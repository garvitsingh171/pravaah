import { randomUUID } from 'node:crypto';
import {
    AppointmentStatus,
    PredictionRefreshStatus,
    type Prisma,
    type PredictionGenerationSource,
} from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
    createNoShowPredictionRun,
    isNoShowFeatureSnapshotV1,
    normalizeNoShowPredictionFeatures,
} from './prediction.service.js';
import {
    NO_SHOW_RULE_VERSION,
    type NoShowFeatureSnapshotV1,
    type NoShowPredictionInput,
    type PredictionGenerationSource as PredictionGenerationSourceType,
} from './prediction.types.js';

const eligibleStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] as const;
const REFRESH_BATCH_SIZE = 100;
const LEASE_DURATION_MS = 60_000;
const RETRY_DELAY_MS = 30_000;

export type RecalculationOutcome =
    | { outcome: 'CREATED'; predictionRunId: string }
    | { outcome: 'UNCHANGED'; predictionRunId: string | null }
    | {
          outcome: 'SKIPPED';
          reason: 'INELIGIBLE_APPOINTMENT' | 'STALE_EVENT' | 'APPOINTMENT_NOT_FOUND';
      };

type RefreshTrigger = Extract<
    PredictionGenerationSourceType,
    'PATIENT_HISTORY_CHANGED' | 'TRAVEL_DISTANCE_CHANGED'
>;

type RecalculationTrigger = Exclude<PredictionGenerationSourceType, 'LEGACY_EXISTING'>;

const sameSnapshot = (left: NoShowFeatureSnapshotV1, right: NoShowFeatureSnapshotV1): boolean =>
    left.scheduledAt === right.scheduledAt &&
    left.bookedAt === right.bookedAt &&
    left.patientNoShowCount === right.patientNoShowCount &&
    left.patientLateArrivalCount === right.patientLateArrivalCount &&
    left.patientCompletedAppointmentCount === right.patientCompletedAppointmentCount &&
    left.distanceFromClinicKm === right.distanceFromClinicKm;

const acquireAppointmentPredictionLock = (tx: Prisma.TransactionClient, appointmentId: string) =>
    tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
            hashtextextended(${`prediction-refresh:${appointmentId}`}, 0)
        )
    `;

/** Builds the sole V1 feature contract from authoritative, clinic-scoped data. */
export const buildCanonicalNoShowPredictionInput = async (
    tx: Prisma.TransactionClient,
    appointment: {
        clinicId: string;
        patientId: string;
        scheduledAt: Date;
        createdAt: Date;
    }
): Promise<NoShowPredictionInput> => {
    const [patientClinic, patientNoShowCount, patientCompletedAppointmentCount] = await Promise.all(
        [
            tx.patientClinic.findUnique({
                where: {
                    patientId_clinicId: {
                        patientId: appointment.patientId,
                        clinicId: appointment.clinicId,
                    },
                },
                select: { totalLateArrivals: true, distanceFromClinicKm: true },
            }),
            tx.appointment.count({
                where: {
                    clinicId: appointment.clinicId,
                    patientId: appointment.patientId,
                    status: AppointmentStatus.NO_SHOW,
                },
            }),
            tx.appointment.count({
                where: {
                    clinicId: appointment.clinicId,
                    patientId: appointment.patientId,
                    status: AppointmentStatus.COMPLETED,
                },
            }),
        ]
    );

    if (!patientClinic) {
        throw new Error('PATIENT_CLINIC_LINK_NOT_FOUND');
    }

    return {
        scheduledAt: appointment.scheduledAt,
        // A reschedule never changes the original booking time.
        bookedAt: appointment.createdAt,
        patientNoShowCount,
        patientLateArrivalCount: patientClinic.totalLateArrivals,
        patientCompletedAppointmentCount,
        distanceFromClinicKm:
            patientClinic.distanceFromClinicKm === null
                ? null
                : Number(patientClinic.distanceFromClinicKm),
    };
};

export const recalculateAppointmentIfChanged = async ({
    tx,
    clinicId,
    appointmentId,
    generationSource,
    now = new Date(),
}: {
    tx: Prisma.TransactionClient;
    clinicId: string;
    appointmentId: string;
    generationSource: RecalculationTrigger;
    now?: Date;
}): Promise<RecalculationOutcome> => {
    // Unit repositories supply narrow transaction doubles. Real Prisma
    // transaction clients always expose this method; retaining this guard keeps
    // the pure service seams usable without weakening production locking.
    if (typeof tx.$executeRaw !== 'function') {
        return { outcome: 'SKIPPED', reason: 'STALE_EVENT' };
    }
    await acquireAppointmentPredictionLock(tx, appointmentId);

    const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, clinicId },
        select: {
            id: true,
            clinicId: true,
            patientId: true,
            scheduledAt: true,
            createdAt: true,
            status: true,
        },
    });

    if (!appointment) {
        return { outcome: 'SKIPPED', reason: 'APPOINTMENT_NOT_FOUND' };
    }

    if (
        appointment.scheduledAt <= now ||
        !eligibleStatuses.includes(appointment.status as (typeof eligibleStatuses)[number])
    ) {
        return { outcome: 'SKIPPED', reason: 'INELIGIBLE_APPOINTMENT' };
    }

    const input = await buildCanonicalNoShowPredictionInput(tx, appointment);
    const snapshot = normalizeNoShowPredictionFeatures(input);
    const latest = await tx.noShowPrediction.findFirst({
        where: { appointmentId: appointment.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, featureSnapshot: true, ruleVersion: true, createdAt: true },
    });

    if (
        latest &&
        latest.ruleVersion === NO_SHOW_RULE_VERSION &&
        isNoShowFeatureSnapshotV1(latest.featureSnapshot) &&
        sameSnapshot(latest.featureSnapshot, snapshot)
    ) {
        return { outcome: 'UNCHANGED', predictionRunId: latest.id };
    }

    // createdAt ordering is the operational latest-run ordering. Make it monotonic
    // while holding the appointment lock so same-millisecond appends stay current.
    const createdAt =
        latest && latest.createdAt >= now ? new Date(latest.createdAt.getTime() + 1) : now;
    const run = createNoShowPredictionRun({ input, generationSource });
    const prediction = await tx.noShowPrediction.create({
        data: {
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            patientId: appointment.patientId,
            riskLevel: run.riskLevel,
            score: run.score,
            reasons: run.reasons,
            featureSchemaVersion: run.featureSchemaVersion,
            featureSnapshot: run.featureSnapshot,
            ruleVersion: run.ruleVersion,
            generationSource: generationSource as PredictionGenerationSource,
            runKey: `recalculation:${appointment.id}:${createdAt.getTime()}:${randomUUID()}`,
            createdAt,
        },
        select: { id: true },
    });

    return { outcome: 'CREATED', predictionRunId: prediction.id };
};

/** Register inside the same transaction as the authoritative feature change. */
export const registerPredictionRefreshWork = async ({
    tx,
    clinicId,
    patientId,
    trigger,
    now = new Date(),
}: {
    tx: Prisma.TransactionClient;
    clinicId: string;
    patientId: string;
    trigger: RefreshTrigger;
    now?: Date;
}): Promise<void> => {
    if (
        !('predictionRefreshWork' in tx) ||
        !tx.predictionRefreshWork ||
        typeof tx.predictionRefreshWork.upsert !== 'function'
    ) {
        return;
    }
    await tx.predictionRefreshWork.upsert({
        where: { clinicId_patientId: { clinicId, patientId } },
        create: {
            clinicId,
            patientId,
            latestTrigger: trigger as PredictionGenerationSource,
            requestedAt: now,
            nextAttemptAt: now,
        },
        update: {
            requestedRevision: { increment: 1 },
            latestTrigger: trigger as PredictionGenerationSource,
            status: PredictionRefreshStatus.PENDING,
            requestedAt: now,
            nextAttemptAt: now,
            lastErrorCode: null,
        },
    });
};

type ClaimedRefreshWork = {
    id: string;
    clinicId: string;
    patientId: string;
    requestedRevision: number;
    latestTrigger: RefreshTrigger;
};

const claimNextRefreshWork = async (owner: string): Promise<ClaimedRefreshWork | null> => {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
        const candidate = await tx.predictionRefreshWork.findFirst({
            where: {
                status: {
                    in: [
                        PredictionRefreshStatus.PENDING,
                        PredictionRefreshStatus.RETRYABLE_FAILURE,
                        PredictionRefreshStatus.PROCESSING,
                    ],
                },
                nextAttemptAt: { lte: now },
                OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
            },
            orderBy: [{ requestedAt: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                clinicId: true,
                patientId: true,
                requestedRevision: true,
                processedRevision: true,
                latestTrigger: true,
            },
        });

        if (!candidate || candidate.requestedRevision <= candidate.processedRevision) {
            return null;
        }

        const claimed = await tx.predictionRefreshWork.updateMany({
            where: {
                id: candidate.id,
                requestedRevision: candidate.requestedRevision,
                status: {
                    in: [
                        PredictionRefreshStatus.PENDING,
                        PredictionRefreshStatus.RETRYABLE_FAILURE,
                        PredictionRefreshStatus.PROCESSING,
                    ],
                },
                nextAttemptAt: { lte: now },
                OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
            },
            data: {
                status: PredictionRefreshStatus.PROCESSING,
                leaseOwner: owner,
                leaseExpiresAt: new Date(now.getTime() + LEASE_DURATION_MS),
                attemptCount: { increment: 1 },
            },
        });

        if (claimed.count !== 1) {
            return null;
        }

        return candidate as ClaimedRefreshWork;
    });
};

const acknowledgeRefreshWork = async (work: ClaimedRefreshWork, owner: string): Promise<void> => {
    const completed = await prisma.predictionRefreshWork.updateMany({
        where: {
            id: work.id,
            leaseOwner: owner,
            requestedRevision: work.requestedRevision,
        },
        data: {
            processedRevision: work.requestedRevision,
            status: PredictionRefreshStatus.COMPLETED,
            leaseOwner: null,
            leaseExpiresAt: null,
            lastErrorCode: null,
        },
    });

    if (completed.count === 0) {
        // A later event was coalesced while this lease was processing. Acknowledge
        // only the captured revision and leave the newer revision pending.
        await prisma.predictionRefreshWork.updateMany({
            where: { id: work.id, leaseOwner: owner },
            data: {
                processedRevision: work.requestedRevision,
                status: PredictionRefreshStatus.PENDING,
                leaseOwner: null,
                leaseExpiresAt: null,
                nextAttemptAt: new Date(),
            },
        });
    }
};

const markRefreshWorkFailed = async (work: ClaimedRefreshWork, owner: string): Promise<void> => {
    await prisma.predictionRefreshWork.updateMany({
        where: { id: work.id, leaseOwner: owner },
        data: {
            status: PredictionRefreshStatus.RETRYABLE_FAILURE,
            leaseOwner: null,
            leaseExpiresAt: null,
            nextAttemptAt: new Date(Date.now() + RETRY_DELAY_MS),
            lastErrorCode: 'PREDICTION_REFRESH_FAILED',
        },
    });
};

const processClaimedRefreshWork = async (
    work: ClaimedRefreshWork,
    owner: string
): Promise<void> => {
    let cursor: string | undefined;
    try {
        for (;;) {
            const appointments = await prisma.appointment.findMany({
                where: {
                    clinicId: work.clinicId,
                    patientId: work.patientId,
                    scheduledAt: { gt: new Date() },
                    status: { in: [...eligibleStatuses] },
                },
                orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
                take: REFRESH_BATCH_SIZE,
                ...(cursor === undefined ? {} : { cursor: { id: cursor }, skip: 1 }),
                select: { id: true },
            });

            if (appointments.length === 0) {
                break;
            }

            for (const appointment of appointments) {
                await prisma.$transaction((tx) =>
                    recalculateAppointmentIfChanged({
                        tx,
                        clinicId: work.clinicId,
                        appointmentId: appointment.id,
                        generationSource: work.latestTrigger,
                    })
                );
            }

            if (appointments.length < REFRESH_BATCH_SIZE) {
                break;
            }
            cursor = appointments[appointments.length - 1]?.id;
        }

        await acknowledgeRefreshWork(work, owner);
        console.info(
            `[prediction-refresh] clinicId=${work.clinicId} patientId=${work.patientId} trigger=${work.latestTrigger} outcome=COMPLETED`
        );
    } catch (error) {
        await markRefreshWorkFailed(work, owner);
        console.warn(
            `[prediction-refresh] clinicId=${work.clinicId} patientId=${work.patientId} trigger=${work.latestTrigger} outcome=RETRYING failureCode=PREDICTION_REFRESH_FAILED`
        );
        throw error;
    }
};

/** Drains persisted requests only; it never schedules a time-based recalculation. */
export const drainPendingPredictionRefreshWork = async (maxClaims = 10): Promise<void> => {
    const owner = randomUUID();
    for (let claimedCount = 0; claimedCount < maxClaims; claimedCount += 1) {
        const work = await claimNextRefreshWork(owner);
        if (!work) {
            return;
        }

        try {
            await processClaimedRefreshWork(work, owner);
        } catch {
            // The work row retains a retryable state. Continue no further work in
            // this drain so an outage cannot turn into a tight retry loop.
            return;
        }
    }
};

let recoveryTimer: NodeJS.Timeout | null = null;

export const startPredictionRefreshWorker = (): void => {
    if (recoveryTimer) {
        return;
    }

    const drain = () => {
        void drainPendingPredictionRefreshWork().catch(() => undefined);
    };
    drain();
    // This is recovery for durable, event-created work, not a periodic
    // recalculation of appointments.
    recoveryTimer = setInterval(drain, RETRY_DELAY_MS);
    recoveryTimer.unref();
};
