import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertSecurityTestDatabase } from './testDatabaseGuard.js';

// Only the external Clerk verification boundary is replaced. All Pravaah middleware,
// internal-user lookup, services, repositories and Prisma queries remain real.
vi.mock('@clerk/express', () => ({
    clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    getAuth: (req: { headers: { authorization?: string } }) => {
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
        const identities: Record<string, string> = {
            'test-admin-a': 'sec19-admin-a',
            'test-staff-a': 'sec19-staff-a',
            'test-admin-b': 'sec19-admin-b',
            'test-staff-b': 'sec19-staff-b',
            'test-suspended-a': 'sec19-suspended-a',
            'test-orphan': 'sec19-orphan',
            'test-unknown': 'sec19-unknown',
            'test-invitee-b': 'sec19-invitee-b',
            'test-wrong-invitee': 'sec19-wrong-invitee',
        };
        return {
            isAuthenticated: Boolean(token && identities[token]),
            userId: token ? (identities[token] ?? null) : null,
        };
    },
    clerkClient: {
        users: {
            getUser: async (clerkUserId: string) => {
                const emails: Record<string, string> = {
                    'sec19-invitee-b': 'invitee-b@example.test',
                    'sec19-wrong-invitee': 'wrong-invitee@example.test',
                };
                const emailAddress = emails[clerkUserId];
                if (!emailAddress) throw new Error('Unknown synthetic Clerk user');
                return {
                    primaryEmailAddressId: 'primary',
                    emailAddresses: [
                        { id: 'primary', emailAddress, verification: { status: 'verified' } },
                    ],
                    firstName: 'Synthetic',
                    lastName: 'Invitee',
                };
            },
        },
    },
}));

let server: Server;
let baseUrl: string;
let fixtures: typeof import('./fixtures.js');
let state: typeof import('./stateSnapshot.js');
let prisma: (typeof import('../../src/config/prisma.js'))['prisma'];

type Identity =
    | 'admin-a'
    | 'staff-a'
    | 'admin-b'
    | 'staff-b'
    | 'suspended-a'
    | 'orphan'
    | 'unknown'
    | 'invitee-b'
    | 'wrong-invitee'
    | 'invalid'
    | 'expired';

async function request(
    method: string,
    path: string,
    identity?: Identity,
    body?: unknown,
    headers: Record<string, string> = {}
) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(identity ? { authorization: `Bearer test-${identity}` } : {}),
            ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
            ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

async function deniedWithoutMutation(
    method: string,
    path: string,
    identity: Identity | undefined,
    body: unknown,
    expected: number | number[]
) {
    const before = await state.businessState();
    const result = await request(method, path, identity, body);
    expect(Array.isArray(expected) ? expected : [expected]).toContain(result.status);
    expect(result.body.success).toBe(false);
    expect(await state.businessState()).toEqual(before);
    return result;
}

beforeAll(async () => {
    const databaseUrl = assertSecurityTestDatabase();
    process.env.DATABASE_URL = databaseUrl;
    process.env.CLERK_SECRET_KEY = 'sk_test_sec19_synthetic_only';
    process.env.RESEND_API_KEY = '';
    process.env.GEOAPIFY_API_KEY = '';
    fixtures = await import('./fixtures.js');
    state = await import('./stateSnapshot.js');
    prisma = (await import('../../src/config/prisma.js')).prisma;
    const { app } = await import('../../src/app.js');
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test HTTP listener failed');
    baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
    await fixtures.resetFixtures();
});

afterAll(async () => {
    if (fixtures) await fixtures.clearFixtures();
    if (server)
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
    if (prisma) await prisma.$disconnect();
});

describe('authentication and trusted identity', () => {
    it.each(['patients', 'appointments', 'queue', 'dashboard/summary'])(
        'rejects unauthenticated %s reads',
        async (resource) => {
            const suffix = resource === 'queue' ? `?date=${fixtures.fixtureDate}` : '';
            const result = await request(
                'GET',
                `/api/clinics/${fixtures.ids.clinicA}/${resource}${suffix}`
            );
            expect(result.status).toBe(401);
            expect(result.body.success).toBe(false);
        }
    );

    it.each(['invalid', 'expired', 'unknown', 'suspended-a', 'orphan'] as const)(
        'rejects %s identity for clinic records',
        async (identity) => {
            const result = await request(
                'GET',
                `/api/clinics/${fixtures.ids.clinicA}/patients`,
                identity
            );
            expect(identity === 'suspended-a' || identity === 'orphan' ? [403] : [401]).toContain(
                result.status
            );
            expect(result.body.success).toBe(false);
        }
    );

    it('rejects malformed bearer and forged identity headers', async () => {
        const path = `/api/clinics/${fixtures.ids.clinicA}/patients`;
        const result = await request('GET', path, undefined, undefined, {
            authorization: 'Basic test-admin-a',
            'x-clerk-user-id': 'sec19-admin-a',
            'x-user-role': 'ADMIN',
        });
        expect(result.status).toBe(401);
        expect(
            (
                await request('GET', path, undefined, undefined, {
                    'x-clerk-user-id': 'sec19-admin-a',
                })
            ).status
        ).toBe(401);
    });

    it('ignores client role and clinic headers when resolving real Staff identity', async () => {
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${fixtures.ids.clinicA}`,
            'staff-a',
            { name: 'Hijacked', role: 'ADMIN', clinicId: fixtures.ids.clinicB },
            400
        );
        const before = await state.businessState();
        const result = await request(
            'PATCH',
            `/api/clinics/${fixtures.ids.clinicA}`,
            'staff-a',
            { name: 'Hijacked' },
            { 'x-user-role': 'ADMIN', 'x-clinic-id': fixtures.ids.clinicB }
        );
        expect(result.status).toBe(403);
        expect(await state.businessState()).toEqual(before);
    });

    it('rejects unauthenticated and invalid-token writes without side effects', async () => {
        const path = `/api/appointments/${fixtures.ids.appointmentB}/status`;
        await deniedWithoutMutation('PATCH', path, undefined, { status: 'CONFIRMED' }, 401);
        await deniedWithoutMutation('PATCH', path, 'invalid', { status: 'CONFIRMED' }, 401);
    });
});

describe('roles and two-clinic isolation', () => {
    it('permits each clinic Admin to read own settings, and Staff to read own patients', async () => {
        for (const [admin, staff, clinic] of [
            ['admin-a', 'staff-a', fixtures.ids.clinicA],
            ['admin-b', 'staff-b', fixtures.ids.clinicB],
        ] as const) {
            expect((await request('GET', `/api/clinics/${clinic}`, admin)).status).toBe(200);
            expect((await request('GET', `/api/clinics/${clinic}/patients`, staff)).status).toBe(
                200
            );
        }
    });

    it('permits a same-clinic Admin setting update and Staff patient update', async () => {
        const { ids } = fixtures;
        expect(
            (
                await request('PATCH', `/api/clinics/${ids.clinicA}`, 'admin-a', {
                    name: 'Sunrise Family Clinic Updated',
                })
            ).status
        ).toBe(200);
        expect((await prisma.clinic.findUniqueOrThrow({ where: { id: ids.clinicA } })).name).toBe(
            'Sunrise Family Clinic Updated'
        );
        expect(
            (
                await request(
                    'PATCH',
                    `/api/clinics/${ids.clinicB}/patients/${ids.patientB}`,
                    'staff-b',
                    { fullName: 'Updated Fictional Riverside Patient' }
                )
            ).status
        ).toBe(200);
        expect(
            (await prisma.patient.findUniqueOrThrow({ where: { id: ids.patientB } })).fullName
        ).toBe('Updated Fictional Riverside Patient');
    });

    it('allows a same-clinic appointment status change and queue reorder', async () => {
        const { ids } = fixtures;
        expect(
            (
                await request('PATCH', `/api/appointments/${ids.appointmentA}/status`, 'staff-a', {
                    status: 'CONFIRMED',
                })
            ).status
        ).toBe(200);
        expect(
            (await prisma.appointment.findUniqueOrThrow({ where: { id: ids.appointmentA } })).status
        ).toBe('CONFIRMED');
        const clinicBQueueBefore = await prisma.queueEntry.findMany({
            where: { clinicId: ids.clinicB },
            orderBy: { id: 'asc' },
            select: { id: true, position: true, status: true },
        });
        const reorderResult = await request(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'staff-a',
            {
                date: fixtures.fixtureDate,
                queueEntryIds: [ids.queueSharedA, ids.queueA],
                expectedQueueEntryIds: [ids.queueA, ids.queueSharedA],
            }
        );
        expect(reorderResult.status).toBe(200);
        const positions = await prisma.queueEntry.findMany({
            where: { clinicId: ids.clinicA },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        expect(positions).toEqual([
            { id: ids.queueSharedA, position: 1 },
            { id: ids.queueA, position: 2 },
        ]);
        expect(
            await prisma.queueEntry.findMany({
                where: { clinicId: ids.clinicB },
                orderBy: { id: 'asc' },
                select: { id: true, position: true, status: true },
            })
        ).toEqual(clinicBQueueBefore);
    });

    it.each([
        ['admin-a', 'staff-a', 'clinicB'],
        ['admin-b', 'staff-b', 'clinicA'],
    ] as const)('blocks %s and %s from the foreign clinic', async (admin, staff, foreignKey) => {
        const foreign = fixtures.ids[foreignKey];
        for (const identity of [admin, staff]) {
            for (const resource of [
                '',
                '/patients',
                '/doctors',
                '/appointments',
                `/queue?date=${fixtures.fixtureDate}`,
                '/dashboard/summary',
            ]) {
                const result = await request('GET', `/api/clinics/${foreign}${resource}`, identity);
                expect(result.status, `${identity} ${resource}`).toBe(403);
            }
        }
    });

    it('prevents Staff from reading staff management and invitations or updating clinic settings', async () => {
        for (const suffix of ['/staff', '/staff/invitations']) {
            expect(
                (await request('GET', `/api/clinics/${fixtures.ids.clinicA}${suffix}`, 'staff-a'))
                    .status
            ).toBe(403);
        }
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${fixtures.ids.clinicA}`,
            'staff-a',
            { name: 'Changed' },
            403
        );
    });

    it('blocks Staff privilege changes and foreign Admin staff changes without mutation', async () => {
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${fixtures.ids.clinicA}/staff/${fixtures.ids.staffA}/status`,
            'staff-a',
            { status: 'SUSPENDED', role: 'ADMIN' },
            403
        );
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${fixtures.ids.clinicB}/staff/${fixtures.ids.staffB}/status`,
            'admin-a',
            { status: 'SUSPENDED' },
            403
        );
    });

    it('keeps patient and appointment lists scoped, including shared patient and doctor', async () => {
        const { ids } = fixtures;
        for (const [identity, clinic, own, foreign] of [
            ['staff-a', ids.clinicA, ids.appointmentA, ids.appointmentB],
            ['staff-b', ids.clinicB, ids.appointmentB, ids.appointmentA],
        ] as const) {
            const appointments = await request(
                'GET',
                `/api/clinics/${clinic}/appointments`,
                identity
            );
            expect(appointments.status).toBe(200);
            expect(JSON.stringify(appointments.body)).toContain(own);
            expect(JSON.stringify(appointments.body)).not.toContain(foreign);
            const patients = await request('GET', `/api/clinics/${clinic}/patients`, identity);
            expect(patients.status).toBe(200);
            expect(JSON.stringify(patients.body)).toContain(ids.sharedPatient);
            expect(JSON.stringify(patients.body)).not.toContain(
                identity === 'staff-a' ? ids.patientB : ids.patientA
            );
        }
        const sharedFilter = await request(
            'GET',
            `/api/clinics/${ids.clinicA}/appointments?patientId=${ids.sharedPatient}`,
            'staff-a'
        );
        expect(sharedFilter.status).toBe(200);
        expect(JSON.stringify(sharedFilter.body)).not.toContain(ids.sharedAppointmentB);
    });

    it('rejects foreign patient and doctor details and mutations with unchanged database state', async () => {
        const { ids } = fixtures;
        expect(
            (
                await request(
                    'GET',
                    `/api/clinics/${ids.clinicA}/patients/${ids.patientB}`,
                    'staff-a'
                )
            ).status
        ).toBe(404);
        expect(
            (await request('GET', `/api/clinics/${ids.clinicB}/doctors/${ids.doctorA}`, 'staff-b'))
                .status
        ).toBe(404);
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicA}/patients/${ids.patientB}`,
            'staff-a',
            { fullName: 'Stolen' },
            [403, 404]
        );
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicB}/doctors/${ids.doctorA}`,
            'staff-b',
            { fullName: 'Stolen' },
            [403, 404]
        );
    });

    it('does not allow shared associations to reveal foreign appointment activity', async () => {
        const { ids } = fixtures;
        for (const [identity, appointment] of [
            ['staff-a', ids.sharedAppointmentB],
            ['staff-b', ids.appointmentA],
        ] as const) {
            expect(
                (await request('GET', `/api/appointments/${appointment}/activities`, identity))
                    .status
            ).toBe(403);
        }
    });

    it('blocks foreign appointment status and reschedule mutations, preserving queue and predictions', async () => {
        const { ids } = fixtures;
        for (const [identity, appointment] of [
            ['staff-a', ids.appointmentB],
            ['staff-b', ids.appointmentA],
        ] as const) {
            await deniedWithoutMutation(
                'PATCH',
                `/api/appointments/${appointment}/status`,
                identity,
                { status: 'CONFIRMED' },
                403
            );
            await deniedWithoutMutation(
                'PATCH',
                `/api/appointments/${appointment}/reschedule`,
                identity,
                {
                    scheduledAt: new Date(Date.now() + 172_800_000).toISOString(),
                    currentScheduledAt: new Date().toISOString(),
                },
                403
            );
        }
    });

    it('blocks foreign booking and rescheduling slot discovery', async () => {
        for (const [identity, foreignClinic, foreignDoctor, foreignAppointment] of [
            ['staff-a', fixtures.ids.clinicB, fixtures.ids.doctorB, fixtures.ids.appointmentB],
            ['staff-b', fixtures.ids.clinicA, fixtures.ids.doctorA, fixtures.ids.appointmentA],
        ] as const) {
            const available = `/api/clinics/${foreignClinic}/appointments/available-slots?doctorId=${foreignDoctor}&date=${fixtures.fixtureDate}&durationMinutes=15`;
            expect((await request('GET', available, identity)).status).toBe(403);
            expect(
                (
                    await request(
                        'GET',
                        `/api/appointments/${foreignAppointment}/reschedule-slots?date=${fixtures.fixtureDate}`,
                        identity
                    )
                ).status
            ).toBe(403);
        }
    });

    it('rejects cross-clinic appointment associations', async () => {
        const { ids } = fixtures;
        const scheduledAt = new Date(Date.now() + 172_800_000).toISOString();
        for (const [clinic, identity, doctorId, patientId] of [
            [ids.clinicA, 'staff-a', ids.doctorA, ids.patientB],
            [ids.clinicB, 'staff-b', ids.doctorA, ids.patientB],
        ] as const) {
            await deniedWithoutMutation(
                'POST',
                `/api/clinics/${clinic}/appointments`,
                identity,
                { doctorId, patientId, scheduledAt },
                [400, 403, 404]
            );
        }
    });

    it('blocks foreign queue status and reorder operations without shifting any positions', async () => {
        const { ids } = fixtures;
        for (const [identity, foreignClinic, foreignEntry, observedOrder, proposedOrder] of [
            ['staff-a', ids.clinicB, ids.queueB, [ids.queueB], [ids.queueB]],
            [
                'staff-b',
                ids.clinicA,
                ids.queueA,
                [ids.queueA, ids.queueSharedA],
                [ids.queueSharedA, ids.queueA],
            ],
        ] as const) {
            await deniedWithoutMutation(
                'PATCH',
                `/api/clinics/${foreignClinic}/queue/${foreignEntry}/status`,
                identity,
                { status: 'ARRIVED', expectedStatus: 'WAITING' },
                403
            );
            const deniedReorder = await deniedWithoutMutation(
                'PATCH',
                `/api/clinics/${foreignClinic}/queue/reorder`,
                identity,
                {
                    date: fixtures.fixtureDate,
                    queueEntryIds: proposedOrder,
                    expectedQueueEntryIds: observedOrder,
                },
                403
            );
            expect(deniedReorder.body).toMatchObject({
                error: { code: 'CLINIC_ACCESS_DENIED' },
            });
            expect(deniedReorder.body).not.toHaveProperty('data');
        }
        const deniedForeignEntry = await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'staff-a',
            {
                date: fixtures.fixtureDate,
                queueEntryIds: [ids.queueB],
                expectedQueueEntryIds: [ids.queueB],
            },
            403
        );
        expect(deniedForeignEntry.body).toMatchObject({
            error: { code: 'QUEUE_ENTRY_CLINIC_MISMATCH' },
        });
        expect(deniedForeignEntry.body).not.toHaveProperty('data');
    });

    it('rejects a malformed same-clinic reorder before changing queue state', async () => {
        const { ids } = fixtures;
        const result = await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'staff-a',
            { date: fixtures.fixtureDate, queueEntryIds: [ids.queueSharedA, ids.queueA] },
            400
        );
        expect(result.body).toMatchObject({
            error: {
                code: 'VALIDATION_ERROR',
                details: expect.arrayContaining([
                    expect.objectContaining({ field: 'body.expectedQueueEntryIds' }),
                ]),
            },
        });
    });

    it('rejects a cross-doctor reorder within the same clinic without side effects', async () => {
        const { ids } = fixtures;
        const result = await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicB}/queue/reorder`,
            'staff-b',
            {
                date: fixtures.fixtureDate,
                queueEntryIds: [ids.queueSharedB, ids.queueB],
                expectedQueueEntryIds: [ids.queueB, ids.queueSharedB],
            },
            400
        );
        expect(result.body).toMatchObject({ error: { code: 'QUEUE_SCOPE_MISMATCH' } });
    });

    it('rejects a stale same-doctor reorder and preserves the winning order', async () => {
        const { ids } = fixtures;
        const observedOrder = [ids.queueA, ids.queueSharedA];
        const winningOrder = [ids.queueSharedA, ids.queueA];
        const winner = await request(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'staff-a',
            {
                date: fixtures.fixtureDate,
                queueEntryIds: winningOrder,
                expectedQueueEntryIds: observedOrder,
            }
        );
        expect(winner.status).toBe(200);

        const stale = await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'admin-a',
            {
                date: fixtures.fixtureDate,
                queueEntryIds: observedOrder,
                expectedQueueEntryIds: observedOrder,
            },
            409
        );
        expect(stale.body).toMatchObject({ error: { code: 'QUEUE_REORDER_CONFLICT' } });
        const positions = await prisma.queueEntry.findMany({
            where: { clinicId: ids.clinicA, doctorId: ids.doctorA },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        expect(positions).toEqual([
            { id: ids.queueSharedA, position: 1 },
            { id: ids.queueA, position: 2 },
        ]);
    });

    it('blocks foreign prediction feedback reads and writes', async () => {
        const { ids } = fixtures;
        for (const [identity, prediction] of [
            ['staff-a', ids.predictionB],
            ['staff-b', ids.predictionA],
        ] as const) {
            expect(
                (await request('GET', `/api/predictions/${prediction}/feedback`, identity)).status
            ).toBe(403);
            await deniedWithoutMutation(
                'PUT',
                `/api/predictions/${prediction}/feedback`,
                identity,
                { usefulness: 'USEFUL', actionTaken: 'NO_ACTION', note: 'Foreign' },
                403
            );
        }
        expect(
            (await request('GET', `/api/predictions/${ids.predictionA}/feedback`, 'staff-a')).status
        ).toBe(200);
    });

    it('isolates dashboard aggregates and rejects a foreign dashboard path', async () => {
        const { ids } = fixtures;
        for (const [identity, clinic, foreign] of [
            ['staff-a', ids.clinicA, ids.appointmentB],
            ['staff-b', ids.clinicB, ids.appointmentA],
        ] as const) {
            const summary = await request(
                'GET',
                `/api/clinics/${clinic}/dashboard/summary?date=${fixtures.fixtureDate}`,
                identity
            );
            expect(summary.status).toBe(200);
            expect(JSON.stringify(summary.body)).not.toContain(foreign);
        }
    });

    it('keeps appointment, queue, and risk aggregate totals clinic-specific', async () => {
        for (const [identity, clinic, expectedRisk] of [
            ['staff-a', fixtures.ids.clinicA, { low: 1, medium: 1, high: 0 }],
            ['staff-b', fixtures.ids.clinicB, { low: 0, medium: 1, high: 1 }],
        ] as const) {
            const result = await request(
                'GET',
                `/api/clinics/${clinic}/dashboard/summary?date=${fixtures.fixtureDate}`,
                identity
            );
            expect(result.status).toBe(200);
            const summary = (
                result.body.data as {
                    dashboardSummary: {
                        appointmentSummary: { total: number };
                        queueSummary: { total: number };
                        noShowRiskSummary: typeof expectedRisk;
                    };
                }
            ).dashboardSummary;
            expect(summary.appointmentSummary.total).toBe(2);
            expect(summary.queueSummary.total).toBe(2);
            expect(summary.noShowRiskSummary).toEqual(expectedRisk);
        }
    });

    it('enforces tenant boundaries on high-risk, intelligence, and activity dashboards', async () => {
        for (const [identity, ownClinic, foreignClinic, foreignAppointment] of [
            ['staff-a', fixtures.ids.clinicA, fixtures.ids.clinicB, fixtures.ids.appointmentB],
            ['staff-b', fixtures.ids.clinicB, fixtures.ids.clinicA, fixtures.ids.appointmentA],
        ] as const) {
            const paths = [
                `high-risk-appointments?date=${fixtures.fixtureDate}`,
                `no-show-intelligence?from=${fixtures.fixtureDate}&to=${fixtures.fixtureDate}`,
                'today-activity',
            ];
            for (const path of paths) {
                const own = await request(
                    'GET',
                    `/api/clinics/${ownClinic}/dashboard/${path}`,
                    identity
                );
                expect(own.status, path).toBe(200);
                expect(JSON.stringify(own.body)).not.toContain(foreignAppointment);
                const foreign = await request(
                    'GET',
                    `/api/clinics/${foreignClinic}/dashboard/${path}`,
                    identity
                );
                expect(foreign.status, path).toBe(403);
            }
        }
    });

    it('denies foreign clinic lifecycle and sample-data operations before any write', async () => {
        for (const [identity, clinic, clinicName] of [
            ['admin-a', fixtures.ids.clinicB, 'Riverside Health Clinic'],
            ['admin-b', fixtures.ids.clinicA, 'Sunrise Family Clinic'],
        ] as const) {
            expect(
                (await request('GET', `/api/clinics/${clinic}/lifecycle-impact`, identity)).status
            ).toBe(403);
            for (const [suffix, body] of [
                ['/deactivate', { confirmClinicName: clinicName }],
                ['/restore', {}],
                ['/geocode', {}],
                ['/sample-data', {}],
            ] as const) {
                await deniedWithoutMutation(
                    'POST',
                    `/api/clinics/${clinic}${suffix}`,
                    identity,
                    body,
                    403
                );
            }
        }
    });

    it('denies foreign lifecycle and external location actions for linked doctors and patients', async () => {
        for (const [identity, clinic, doctor, patient] of [
            ['admin-a', fixtures.ids.clinicB, fixtures.ids.doctorB, fixtures.ids.patientB],
            ['admin-b', fixtures.ids.clinicA, fixtures.ids.doctorA, fixtures.ids.patientA],
        ] as const) {
            const doctorBase = `/api/clinics/${clinic}/doctors/${doctor}`;
            const patientBase = `/api/clinics/${clinic}/patients/${patient}`;
            for (const path of [
                `${doctorBase}/lifecycle-impact`,
                `${doctorBase}/availability`,
                `${patientBase}/lifecycle-impact`,
            ]) {
                expect((await request('GET', path, identity)).status).toBe(403);
            }
            for (const [method, path, body] of [
                ['DELETE', doctorBase, undefined],
                ['POST', `${doctorBase}/restore`, undefined],
                ['DELETE', patientBase, undefined],
                ['POST', `${patientBase}/restore`, undefined],
                ['POST', `${patientBase}/route`, {}],
                ['POST', `${patientBase}/geocode`, {}],
            ] as const) {
                await deniedWithoutMutation(method, path, identity, body, 403);
            }
            const days = [
                'MONDAY',
                'TUESDAY',
                'WEDNESDAY',
                'THURSDAY',
                'FRIDAY',
                'SATURDAY',
                'SUNDAY',
            ].map((weekday) => ({ weekday, periods: [] }));
            await deniedWithoutMutation(
                'PUT',
                `${doctorBase}/availability`,
                identity,
                { days },
                403
            );
        }
    });

    it('denies foreign staff profile, removal, restoration, and invitation resend', async () => {
        for (const [identity, clinic, staff] of [
            ['admin-a', fixtures.ids.clinicB, fixtures.ids.staffB],
            ['admin-b', fixtures.ids.clinicA, fixtures.ids.staffA],
        ] as const) {
            const base = `/api/clinics/${clinic}/staff/${staff}`;
            expect((await request('GET', base, identity)).status).toBe(403);
            await deniedWithoutMutation(
                'PATCH',
                base,
                identity,
                { fullName: 'Unauthorized Rename' },
                403
            );
            await deniedWithoutMutation('DELETE', base, identity, undefined, 403);
            await deniedWithoutMutation('POST', `${base}/restore`, identity, undefined, 403);
        }
        await deniedWithoutMutation(
            'POST',
            `/api/clinics/${fixtures.ids.clinicB}/staff/invitations/${fixtures.ids.invitationB}/resend`,
            'admin-a',
            undefined,
            403
        );
    });

    it('enforces Admin and clinic scope for invitation management', async () => {
        const { ids } = fixtures;
        await deniedWithoutMutation(
            'POST',
            `/api/clinics/${ids.clinicA}/staff/invitations`,
            'staff-a',
            { email: 'new@example.test' },
            403
        );
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicB}/staff/invitations/${ids.invitationB}/revoke`,
            'admin-a',
            undefined,
            403
        );
        const list = await request(
            'GET',
            `/api/clinics/${ids.clinicB}/staff/invitations`,
            'admin-b'
        );
        expect(list.status).toBe(200);
        const tokenHash = (
            await prisma.staffInvitation.findUniqueOrThrow({ where: { id: ids.invitationB } })
        ).tokenHash;
        expect(JSON.stringify(list.body)).not.toContain(tokenHash);
        expect(JSON.stringify(list.body)).not.toContain(fixtures.invitationTokenB);
    });

    it('lets an Admin create a clinic invitation without exposing its token', async () => {
        const email = 'new-staff-a@example.test';
        const result = await request(
            'POST',
            `/api/clinics/${fixtures.ids.clinicA}/staff/invitations`,
            'admin-a',
            { email }
        );
        expect(result.status).toBe(201);
        const record = await prisma.staffInvitation.findFirstOrThrow({
            where: { clinicId: fixtures.ids.clinicA, email },
        });
        expect(record.status).toBe('PENDING');
        expect(record.emailStatus).toBe('FAILED'); // No external email provider is configured in the test.
        expect(JSON.stringify(result.body)).not.toContain(record.tokenHash);
    });

    it('binds invitation preview and acceptance to the verified Clerk email', async () => {
        const path = `/api/staff/invitations/${fixtures.invitationTokenB}`;
        expect((await request('GET', path, 'invitee-b')).status).toBe(200);
        await deniedWithoutMutation('POST', `${path}/accept`, 'wrong-invitee', {}, 403);
        const accepted = await request('POST', `${path}/accept`, 'invitee-b', {});
        expect(accepted.status).toBe(201);
        const user = await prisma.user.findUniqueOrThrow({
            where: { clerkUserId: 'sec19-invitee-b' },
        });
        expect(user).toMatchObject({
            clinicId: fixtures.ids.clinicB,
            role: 'STAFF',
            status: 'ACTIVE',
        });
        expect(
            (
                await prisma.staffInvitation.findUniqueOrThrow({
                    where: { id: fixtures.ids.invitationB },
                })
            ).status
        ).toBe('ACCEPTED');
        // The same verified identity may safely repeat an idempotent claim; a different identity cannot reuse it.
        expect((await request('POST', `${path}/accept`, 'invitee-b', {})).status).toBe(200);
        await deniedWithoutMutation('POST', `${path}/accept`, 'wrong-invitee', {}, [403, 409]);
    });

    it('rejects expired and revoked invitations without changing membership', async () => {
        const path = `/api/staff/invitations/${fixtures.invitationTokenB}/accept`;
        await prisma.staffInvitation.update({
            where: { id: fixtures.ids.invitationB },
            data: { expiresAt: new Date(Date.now() - 60_000) },
        });
        await deniedWithoutMutation('POST', path, 'invitee-b', {}, 410);
        await prisma.staffInvitation.update({
            where: { id: fixtures.ids.invitationB },
            data: { status: 'REVOKED', expiresAt: new Date(Date.now() + 86_400_000) },
        });
        await deniedWithoutMutation('POST', path, 'invitee-b', {}, 409);
    });
});

describe('SEC-F-01 bounded collection responses', () => {
    const listPath = (clinicId: string, resource: 'patients' | 'appointments') =>
        `/api/clinics/${clinicId}/${resource}`;

    it.each(['patients', 'appointments'] as const)(
        'rejects malformed %s pagination and preserves clinic authorization',
        async (resource) => {
            const path = listPath(fixtures.ids.clinicA, resource);
            for (const query of [
                'page=0',
                'page=-1',
                'page=1.5',
                'page=abc',
                'page=501',
                'page=9007199254740992',
                'page=1&page=2',
                'limit=0',
                'limit=101',
                'limit=1&limit=2',
                'sort=id',
            ]) {
                const result = await request('GET', `${path}?${query}`, 'staff-a');
                expect(result.status).toBe(400);
                expect(result.body).toMatchObject({
                    success: false,
                    error: { code: 'VALIDATION_ERROR' },
                });
            }
            expect(
                (await request('GET', listPath(fixtures.ids.clinicB, resource), 'staff-a')).status
            ).toBe(403);
        }
    );

    it('returns a minimal clinic-scoped patient page and server-side search', async () => {
        const { ids } = fixtures;
        await prisma.patient.update({
            where: { id: ids.patientA },
            data: {
                addressLine1: 'SECRET_PATIENT_ADDRESS',
                emergencyContactPhone: 'SECRET_EMERGENCY_PHONE',
                dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
            },
        });
        const path = listPath(ids.clinicA, 'patients');
        const result = await request('GET', `${path}?limit=1`, 'staff-a');
        expect(result.status).toBe(200);
        expect(result.body).toMatchObject({
            data: { pagination: { page: 1, limit: 1, hasNextPage: true } },
        });
        const data = result.body.data as { patients: Array<Record<string, unknown>> };
        expect(data.patients).toHaveLength(1);
        expect(Object.keys(data.patients[0]).sort()).toEqual([
            'id',
            'isActive',
            'lastVisitAt',
            'patient',
            'totalAppointments',
            'totalCompletedVisits',
            'totalLateArrivals',
            'totalNoShows',
        ]);
        expect(Object.keys(data.patients[0].patient as object).sort()).toEqual([
            'createdAt',
            'email',
            'fullName',
            'gender',
            'id',
            'isActive',
            'phone',
            'updatedAt',
        ]);
        expect(JSON.stringify(result.body)).not.toMatch(/SECRET_|private note|Riverside note/);
        const searched = await request('GET', `${path}?search=5550102001`, 'staff-a');
        expect(searched.body).toMatchObject({
            data: { patients: [], pagination: { hasNextPage: false } },
        });
    });

    it('returns a minimal appointment page with stable tied timestamps and no foreign data', async () => {
        const { ids } = fixtures;
        await prisma.appointment.update({
            where: { id: ids.appointmentA },
            data: { notes: 'SECRET_APPOINTMENT_NOTE' },
        });
        await prisma.patient.update({
            where: { id: ids.patientA },
            data: { addressLine1: 'SECRET_PATIENT_ADDRESS' },
        });
        await prisma.noShowPrediction.create({
            data: {
                appointmentId: ids.appointmentA,
                clinicId: ids.clinicB,
                patientId: ids.patientB,
                riskLevel: 'HIGH',
                score: 99,
                reasons: [{ code: 'PRIVATE', message: 'SECRET_FOREIGN_PREDICTION' }],
                createdAt: new Date('2030-01-01T00:00:00.000Z'),
            },
        });
        const path = listPath(ids.clinicA, 'appointments');
        const first = await request('GET', `${path}?limit=1`, 'staff-a');
        const second = await request('GET', `${path}?limit=1&page=2`, 'staff-a');
        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        const firstData = first.body.data as { appointments: Array<Record<string, unknown>> };
        const secondData = second.body.data as { appointments: Array<Record<string, unknown>> };
        expect(firstData.appointments).toHaveLength(1);
        expect(secondData.appointments).toHaveLength(1);
        expect(firstData.appointments[0].id).not.toBe(secondData.appointments[0].id);
        expect(firstData.appointments[0].noShowPrediction).toMatchObject({ riskLevel: 'LOW' });
        expect(Object.keys(firstData.appointments[0]).sort()).toEqual([
            'arrivalOffsetMinutes',
            'arrivedAt',
            'bookingSource',
            'clinicId',
            'doctor',
            'doctorId',
            'durationMinutes',
            'id',
            'isLateArrival',
            'noShowPrediction',
            'patient',
            'patientId',
            'queueEntry',
            'reason',
            'scheduledAt',
            'status',
        ]);
        expect(Object.keys(firstData.appointments[0].patient as object).sort()).toEqual([
            'email',
            'fullName',
            'id',
            'phone',
        ]);
        expect(Object.keys(firstData.appointments[0].doctor as object).sort()).toEqual([
            'fullName',
            'id',
            'specialization',
        ]);
        expect(JSON.stringify(first.body)).not.toMatch(
            /SECRET_|Fictional Riverside Patient|Shared patient Riverside note/
        );
        const foreignFilter = await request('GET', `${path}?patientId=${ids.patientB}`, 'staff-a');
        expect(foreignFilter.body).toMatchObject({ data: { appointments: [] } });
        const foreignDoctorFilter = await request(
            'GET',
            `${path}?doctorId=${ids.doctorB}`,
            'staff-a'
        );
        expect(foreignDoctorFilter.body).toMatchObject({ data: { appointments: [] } });
        const foreignAppointmentFilter = await request(
            'GET',
            `${path}?appointmentId=${ids.appointmentB}`,
            'staff-a'
        );
        expect(foreignAppointmentFilter.body).toMatchObject({ data: { appointments: [] } });
    });

    it('enforces a 100-record maximum and deterministic patient page boundaries', async () => {
        const { ids } = fixtures;
        const timestamp = new Date('2026-01-01T00:00:00.000Z');
        const patientIds = Array.from(
            { length: 105 },
            (_, index) => `55555555-5555-4555-8555-${String(index + 1).padStart(12, '0')}`
        );
        await prisma.patient.createMany({
            data: patientIds.map((id, index) => ({
                id,
                fullName: `Bounded Patient ${index}`,
                phone: `55599${index}`,
            })),
        });
        await prisma.patientClinic.createMany({
            data: patientIds.map((patientId) => ({
                patientId,
                clinicId: ids.clinicA,
                createdAt: timestamp,
            })),
        });
        const path = listPath(ids.clinicA, 'patients');
        const first = await request('GET', `${path}?limit=100`, 'staff-a');
        const second = await request('GET', `${path}?limit=100&page=2`, 'staff-a');
        const firstRows = (first.body.data as { patients: Array<{ patient: { id: string } }> })
            .patients;
        const secondRows = (second.body.data as { patients: Array<{ patient: { id: string } }> })
            .patients;
        expect(firstRows).toHaveLength(100);
        expect(secondRows).toHaveLength(7);
        expect(new Set([...firstRows, ...secondRows].map((row) => row.patient.id)).size).toBe(107);
        expect(
            (first.body.data as { pagination: { hasNextPage: boolean } }).pagination.hasNextPage
        ).toBe(true);
        expect(
            (second.body.data as { pagination: { hasNextPage: boolean } }).pagination.hasNextPage
        ).toBe(false);
        expect((await request('GET', `${path}?limit=100`, 'staff-a')).body).toEqual(first.body);
    });

    it('bounds appointment pages and orders equal schedule times by ID', async () => {
        const { ids } = fixtures;
        const scheduledAt = new Date('2026-01-01T10:00:00.000Z');
        const appointmentIds = Array.from(
            { length: 105 },
            (_, index) => `66666666-6666-4666-8666-${String(index + 1).padStart(12, '0')}`
        );
        await prisma.appointment.createMany({
            data: appointmentIds.map((id) => ({
                id,
                clinicId: ids.clinicA,
                doctorId: ids.doctorA,
                patientId: ids.patientA,
                createdByUserId: ids.staffA,
                scheduledAt,
                status: 'COMPLETED',
            })),
        });
        const path = `${listPath(ids.clinicA, 'appointments')}?status=COMPLETED&limit=100`;
        const first = await request('GET', path, 'staff-a');
        const second = await request('GET', `${path}&page=2`, 'staff-a');
        const firstRows = (first.body.data as { appointments: Array<{ id: string }> }).appointments;
        const secondRows = (second.body.data as { appointments: Array<{ id: string }> })
            .appointments;
        expect(firstRows).toHaveLength(100);
        expect(secondRows).toHaveLength(5);
        expect(firstRows.map((row) => row.id)).toEqual(appointmentIds.slice(0, 100));
        expect(secondRows.map((row) => row.id)).toEqual(appointmentIds.slice(100));
        expect(
            (first.body.data as { pagination: { hasNextPage: boolean } }).pagination.hasNextPage
        ).toBe(true);
        expect(
            (second.body.data as { pagination: { hasNextPage: boolean } }).pagination.hasNextPage
        ).toBe(false);
        expect((await request('GET', path, 'staff-a')).body).toEqual(first.body);
    });
});

describe('malicious input and validation', () => {
    it.each(["' OR '1'='1", "'; DROP TABLE patients; --", "' UNION SELECT NULL --"])(
        'treats patient search payload as literal text: %s',
        async (payload) => {
            const { ids } = fixtures;
            const result = await request(
                'GET',
                `/api/clinics/${ids.clinicA}/patients?search=${encodeURIComponent(payload)}`,
                'staff-a'
            );
            expect(result.status).toBe(200);
            expect(JSON.stringify(result.body)).not.toContain(ids.patientB);
            expect(JSON.stringify(result.body)).not.toContain('Fictional Sunrise Patient');
            expect(await prisma.patient.count()).toBe(3);
        }
    );

    it('rejects SQL shaped IDs and unsupported sort parameters without changing business data', async () => {
        const before = await state.businessState();
        const { ids } = fixtures;
        const badId = encodeURIComponent('1 OR 1=1');
        for (const path of [
            `/api/appointments/${badId}/activities`,
            `/api/clinics/${ids.clinicA}/patients?sort=${encodeURIComponent('id; DROP TABLE patients')}`,
            `/api/clinics/${ids.clinicA}/appointments?doctorId=${badId}`,
        ]) {
            const result = await request('GET', path, 'staff-a');
            expect(result.status).toBe(400);
            expect(JSON.stringify(result.body)).not.toMatch(/SELECT\s|FROM\s+"|PrismaClient/i);
        }
        expect(await state.businessState()).toEqual(before);
    });

    it('stores a SQL payload literally through the parameterized prediction feedback query', async () => {
        const { ids } = fixtures;
        const payload = "'; DROP TABLE patients; --";
        const result = await request(
            'PUT',
            `/api/predictions/${ids.predictionA}/feedback`,
            'staff-a',
            { usefulness: 'USEFUL', actionTaken: 'NO_ACTION', note: payload }
        );
        expect(result.status).toBe(200);
        expect(
            (
                await prisma.predictionFeedback.findFirstOrThrow({
                    where: { predictionId: ids.predictionA },
                })
            ).note
        ).toBe(payload);
        expect(await prisma.patient.count()).toBe(3);
    });

    it('rejects invalid appointment mutation before business writes', async () => {
        await deniedWithoutMutation(
            'PATCH',
            `/api/appointments/${fixtures.ids.appointmentA}/status`,
            'staff-a',
            { status: 'SUPERUSER' },
            400
        );
    });
});
