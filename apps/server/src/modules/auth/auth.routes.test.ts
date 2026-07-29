import type { RequestHandler, Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({}));

vi.mock('../../config/prisma.js', () => ({
    prisma: mockPrisma,
}));

import { appointmentRouter, clinicAppointmentRouter } from '../appointments/appointment.routes.js';
import { clinicRouter } from '../clinics/clinic.routes.js';
import { dashboardRouter } from '../dashboard/dashboard.routes.js';
import { doctorRouter } from '../doctors/doctor.routes.js';
import { patientRouter } from '../patients/patient.routes.js';
import { queueRouter } from '../queues/queue.routes.js';
import { authRouter, validateOnboardingClinicRequest } from './auth.routes.js';

type ExpressRouteLayer = {
    route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{
            handle: RequestHandler & {
                name: string;
            };
        }>;
    };
};

type InspectableRouter = Router & {
    stack?: ExpressRouteLayer[];
};

const getRouteHandlerNames = (router: Router, method: string, path: string): string[] => {
    const stack = (router as InspectableRouter).stack ?? [];
    const route = stack
        .map((layer) => layer.route)
        .find((candidate) => candidate?.path === path && candidate.methods[method] === true);

    if (!route) {
        return [];
    }

    return route.stack.map((layer) => layer.handle.name);
};

const getRouteHandlers = (router: Router, method: string, path: string): RequestHandler[] => {
    const stack = (router as InspectableRouter).stack ?? [];
    const route = stack
        .map((layer) => layer.route)
        .find((candidate) => candidate?.path === path && candidate.methods[method] === true);

    if (!route) {
        return [];
    }

    return route.stack.map((layer) => layer.handle);
};

describe('authRouter onboarding route middleware', () => {
    it('uses Clerk identity-only authentication for onboarding status', () => {
        expect(getRouteHandlerNames(authRouter, 'get', '/onboarding-status')).toEqual([
            'authenticateClerkIdentity',
            'getOnboardingStatusController',
        ]);
    });

    it('authenticates Clerk identity before validating and provisioning clinic onboarding', () => {
        const handlers = getRouteHandlerNames(authRouter, 'post', '/onboarding/clinic');

        expect(handlers).toEqual([
            'authenticateClerkIdentity',
            'validateOnboardingClinicRequest',
            'createClinicOnboardingController',
        ]);
        expect(handlers).not.toContain('authenticateRequest');
    });

    it('uses the onboarding clinic body validator before the provisioning controller', () => {
        const handlers = getRouteHandlers(authRouter, 'post', '/onboarding/clinic');

        expect(handlers).toHaveLength(3);
        expect(handlers[1]).toBe(validateOnboardingClinicRequest);
    });

    it('keeps current-user lookup behind full internal-user authentication', () => {
        expect(getRouteHandlerNames(authRouter, 'get', '/me')).toEqual([
            'authenticateRequest',
            'getCurrentUserController',
        ]);
    });
});

describe('protected application route authentication regression', () => {
    it.each([
        ['clinic create', clinicRouter, 'post', '/'],
        ['clinic settings read', clinicRouter, 'get', '/:clinicId'],
        ['clinic settings update', clinicRouter, 'patch', '/:clinicId'],
        ['clinic sample data', clinicRouter, 'post', '/:clinicId/sample-data'],
        ['doctor create', doctorRouter, 'post', '/:clinicId/doctors'],
        ['doctor list', doctorRouter, 'get', '/:clinicId/doctors'],
        ['doctor update', doctorRouter, 'patch', '/:clinicId/doctors/:doctorId'],
        ['patient create', patientRouter, 'post', '/:clinicId/patients'],
        ['patient list', patientRouter, 'get', '/:clinicId/patients'],
        ['patient update', patientRouter, 'patch', '/:clinicId/patients/:patientId'],
        ['clinic appointment create', clinicAppointmentRouter, 'post', '/:clinicId/appointments'],
        ['clinic appointment list', clinicAppointmentRouter, 'get', '/:clinicId/appointments'],
        [
            'appointment status update',
            appointmentRouter,
            'patch',
            '/appointments/:appointmentId/status',
        ],
        ['queue list', queueRouter, 'get', '/:clinicId/queue'],
        ['queue reorder', queueRouter, 'patch', '/:clinicId/queue/reorder'],
        ['queue status update', queueRouter, 'patch', '/:clinicId/queue/:queueEntryId/status'],
        ['dashboard summary', dashboardRouter, 'get', '/:clinicId/dashboard/summary'],
        [
            'dashboard high-risk appointments',
            dashboardRouter,
            'get',
            '/:clinicId/dashboard/high-risk-appointments',
        ],
        ['dashboard today activity', dashboardRouter, 'get', '/:clinicId/dashboard/today-activity'],
    ])('%s starts with full internal-user authentication', (_name, router, method, path) => {
        expect(getRouteHandlerNames(router as Router, method as string, path as string)[0]).toBe(
            'authenticateRequest'
        );
    });
});
