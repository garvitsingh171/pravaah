import { prisma } from '../../../config/prisma.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { DatasetCandidate } from './dataset-export.types.js';

const PAGE_SIZE = 200;

/** Runs all pages against one PostgreSQL repeatable-read snapshot. */
export async function visitDatasetCandidatePages({
    clinicId,
    from,
    to,
    onPage,
}: {
    clinicId: string;
    from: Date;
    to: Date;
    onPage: (candidates: DatasetCandidate[]) => void;
}): Promise<void> {
    return prisma.$transaction(
        async (tx) => {
            let cursorId: string | undefined;
            for (;;) {
                const appointments = await tx.appointment.findMany({
                    where: { clinicId, scheduledAt: { gte: from, lt: to } },
                    orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
                    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
                    take: PAGE_SIZE,
                    select: {
                        id: true,
                        clinicId: true,
                        scheduledAt: true,
                        clinic: { select: { timezone: true } },
                        predictionOutcome: {
                            select: {
                                clinicId: true,
                                actualOutcome: true,
                                actualNoShow: true,
                                outcomeSource: true,
                                evidenceAt: true,
                            },
                        },
                        noShowPredictions: {
                            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                            select: {
                                id: true,
                                clinicId: true,
                                createdAt: true,
                                featureSchemaVersion: true,
                                featureSnapshot: true,
                                ruleVersion: true,
                            },
                        },
                    },
                } satisfies Prisma.AppointmentFindManyArgs);
                const candidates = appointments.map((appointment) => ({
                    appointmentId: appointment.id,
                    clinicId: appointment.clinicId,
                    scheduledAt: appointment.scheduledAt,
                    clinicTimezone: appointment.clinic.timezone,
                    outcome: appointment.predictionOutcome,
                    predictions: appointment.noShowPredictions,
                }));
                onPage(candidates);
                if (appointments.length < PAGE_SIZE) break;
                cursorId = appointments.at(-1)?.id;
            }
        },
        { isolationLevel: 'RepeatableRead', timeout: 120_000 }
    );
}
