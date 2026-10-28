import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const integrationUrl = process.env.QUEUE_INTEGRATION_TEST_DATABASE_URL;
const isDisposableLocalDatabase = (() => {
    if (!integrationUrl || process.env.DATABASE_URL !== integrationUrl) return false;
    try {
        const url = new URL(integrationUrl);
        return (
            ['localhost', '127.0.0.1'].includes(url.hostname) &&
            url.pathname === '/pravaah_298_test' &&
            url.searchParams.get('host')?.startsWith('/tmp/pravaah-298-pg.') === true
        );
    } catch {
        return false;
    }
})();

describe.skipIf(!isDisposableLocalDatabase)(
    'queue reordering with two PostgreSQL staff sessions',
    () => {
        it('commits one order and rejects the other stale order without a lost update', async () => {
            const [{ prisma }, { queueService }] = await Promise.all([
                import('../../../config/prisma.js'),
                import('../queue.service.js'),
            ]);
            const fixtureId = randomUUID();
            const date = '2026-10-28';
            const clinic = await prisma.clinic.create({
                data: { name: 'Queue concurrency test', slug: `queue-298-${fixtureId}` },
            });
            const patientIds: string[] = [];
            let doctorId: string | null = null;

            try {
                const [staffA, staffB, doctor] = await Promise.all([
                    prisma.user.create({
                        data: {
                            clinicId: clinic.id,
                            clerkUserId: `queue-298-a-${fixtureId}`,
                            fullName: 'Staff A',
                            email: `a-${fixtureId}@example.test`,
                            role: 'STAFF',
                            status: 'ACTIVE',
                        },
                    }),
                    prisma.user.create({
                        data: {
                            clinicId: clinic.id,
                            clerkUserId: `queue-298-b-${fixtureId}`,
                            fullName: 'Staff B',
                            email: `b-${fixtureId}@example.test`,
                            role: 'STAFF',
                            status: 'ACTIVE',
                        },
                    }),
                    prisma.doctor.create({ data: { fullName: 'Dr Test' } }),
                ]);
                doctorId = doctor.id;

                const entries = [];
                for (const position of [1, 2, 3]) {
                    const patient = await prisma.patient.create({
                        data: { fullName: `Patient ${position}`, phone: `29800000${position}` },
                    });
                    patientIds.push(patient.id);
                    const appointment = await prisma.appointment.create({
                        data: {
                            clinicId: clinic.id,
                            doctorId: doctor.id,
                            patientId: patient.id,
                            createdByUserId: staffA.id,
                            scheduledAt: new Date(`2026-10-28T0${position + 4}:00:00.000Z`),
                            status: 'IN_QUEUE',
                        },
                    });
                    entries.push(
                        await prisma.queueEntry.create({
                            data: {
                                clinicId: clinic.id,
                                doctorId: doctor.id,
                                patientId: patient.id,
                                appointmentId: appointment.id,
                                position,
                                status: 'WAITING',
                            },
                        })
                    );
                }

                const [first, second, third] = entries;
                if (!first || !second || !third) throw new Error('Queue fixture is incomplete');
                const expected: [string, string, string] = [first.id, second.id, third.id];
                const userA = {
                    id: staffA.id,
                    clerkUserId: staffA.clerkUserId,
                    role: staffA.role,
                    status: staffA.status,
                    clinicId: clinic.id,
                };
                const userB = {
                    id: staffB.id,
                    clerkUserId: staffB.clerkUserId,
                    role: staffB.role,
                    status: staffB.status,
                    clinicId: clinic.id,
                };

                const outcomes = await Promise.allSettled([
                    queueService.reorderQueue(
                        userA,
                        clinic.id,
                        date,
                        [expected[1], expected[0], expected[2]],
                        expected
                    ),
                    queueService.reorderQueue(
                        userB,
                        clinic.id,
                        date,
                        [expected[0], expected[2], expected[1]],
                        expected
                    ),
                ]);
                const committed = outcomes.filter((outcome) => outcome.status === 'fulfilled');
                const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');
                expect(committed).toHaveLength(1);
                expect(rejected).toHaveLength(1);
                expect(rejected[0]).toMatchObject({
                    reason: { code: 'QUEUE_REORDER_CONFLICT', statusCode: 409 },
                });

                const authoritative = await queueService.listQueueByClinicDate(
                    userA,
                    clinic.id,
                    date
                );
                const winner = committed[0];
                if (!winner || winner.status !== 'fulfilled')
                    throw new Error('No reorder committed');
                const committedIds = winner.value.map((entry) => entry.id);
                expect(authoritative.map((entry) => entry.id)).toEqual(committedIds);
                expect(authoritative.map((entry) => entry.position)).toEqual([1, 2, 3]);
            } finally {
                // This test runs only against an explicitly named disposable local database.
                await prisma.queueEntry.deleteMany({ where: { clinicId: clinic.id } });
                await prisma.appointment.deleteMany({ where: { clinicId: clinic.id } });
                await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
                await prisma.user.deleteMany({ where: { clinicId: clinic.id } });
                if (doctorId) await prisma.doctor.delete({ where: { id: doctorId } });
                await prisma.clinic.delete({ where: { id: clinic.id } });
                await prisma.$disconnect();
            }
        });
    }
);
