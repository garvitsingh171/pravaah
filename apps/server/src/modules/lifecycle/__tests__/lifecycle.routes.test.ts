import type { RequestHandler, Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../config/prisma.js', () => ({ prisma: {} }));

import { clinicRouter } from '../../clinics/clinic.routes.js';
import { doctorRouter } from '../../doctors/doctor.routes.js';
import { patientRouter } from '../../patients/patient.routes.js';

type Route = {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: RequestHandler & { name?: string } }>;
};
const namesFor = (router: Router, method: string, path: string) => {
    const layers = (router as unknown as { stack: Array<{ route?: Route }> }).stack;
    const route = layers
        .map(({ route }) => route)
        .find((candidate) => candidate?.path === path && candidate.methods[method]);
    if (!route) throw new Error(`Missing ${method} ${path}`);
    return route.stack.map(({ handle }) => handle.name ?? 'anonymous');
};

describe('entity lifecycle route authorization', () => {
    it.each([
        [doctorRouter, 'get', '/:clinicId/doctors/:doctorId/lifecycle-impact'],
        [doctorRouter, 'delete', '/:clinicId/doctors/:doctorId'],
        [doctorRouter, 'post', '/:clinicId/doctors/:doctorId/restore'],
        [patientRouter, 'get', '/:clinicId/patients/:patientId/lifecycle-impact'],
        [patientRouter, 'delete', '/:clinicId/patients/:patientId'],
        [patientRouter, 'post', '/:clinicId/patients/:patientId/restore'],
    ])('requires active Admin and clinic access on %s %s', (router, method, path) => {
        const names = namesFor(router as Router, method as string, path as string);
        expect(names[0]).toBe('authenticateRequest');
        expect(names).toContain('requireClinicAccess');
        expect(names).toContain('requireAdminRole');
    });

    it.each([
        ['get', '/:clinicId/lifecycle-impact'],
        ['post', '/:clinicId/deactivate'],
        ['post', '/:clinicId/restore'],
    ])('keeps Admin recovery reachable while the clinic is inactive on %s %s', (method, path) => {
        const names = namesFor(clinicRouter, method, path);
        expect(names[0]).toBe('authenticateRequest');
        expect(names).toContain('requireAdminRole');
        expect(names).not.toContain('requireClinicAccess');
    });
});
