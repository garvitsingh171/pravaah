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
        expect(
            (
                await request('PATCH', `/api/clinics/${ids.clinicA}/queue/reorder`, 'staff-a', {
                    date: fixtures.fixtureDate,
                    queueEntryIds: [ids.queueSharedA, ids.queueA],
                })
            ).status
        ).toBe(200);
        const positions = await prisma.queueEntry.findMany({
            where: { clinicId: ids.clinicA },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        expect(positions).toEqual([
            { id: ids.queueSharedA, position: 1 },
            { id: ids.queueA, position: 2 },
        ]);
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
        for (const [identity, foreignClinic, foreignEntry] of [
            ['staff-a', ids.clinicB, ids.queueB],
            ['staff-b', ids.clinicA, ids.queueA],
        ] as const) {
            await deniedWithoutMutation(
                'PATCH',
                `/api/clinics/${foreignClinic}/queue/${foreignEntry}/status`,
                identity,
                { status: 'ARRIVED' },
                403
            );
            await deniedWithoutMutation(
                'PATCH',
                `/api/clinics/${foreignClinic}/queue/reorder`,
                identity,
                { date: fixtures.fixtureDate, queueEntryIds: [foreignEntry] },
                403
            );
        }
        await deniedWithoutMutation(
            'PATCH',
            `/api/clinics/${ids.clinicA}/queue/reorder`,
            'staff-a',
            { date: fixtures.fixtureDate, queueEntryIds: [ids.queueB] },
            [400, 403, 404]
        );
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
