import type { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma.js', () => ({ prisma: {} }));

import { authRouter } from '../modules/auth/auth.routes.js';
import { clinicRouter } from '../modules/clinics/clinic.routes.js';
import { doctorRouter } from '../modules/doctors/doctor.routes.js';
import { patientRouter } from '../modules/patients/patient.routes.js';
import {
    clinicAppointmentRouter,
    appointmentRouter,
} from '../modules/appointments/appointment.routes.js';
import { queueRouter } from '../modules/queues/queue.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { staffRouter, staffInvitationRouter } from '../modules/staff/staff.routes.js';
import { predictionFeedbackRouter } from '../modules/predictions/prediction-feedback.routes.js';

const routers: Router[] = [
    authRouter,
    clinicRouter,
    doctorRouter,
    patientRouter,
    clinicAppointmentRouter,
    appointmentRouter,
    queueRouter,
    dashboardRouter,
    staffRouter,
    staffInvitationRouter,
    predictionFeedbackRouter,
];

describe('registered rate-limit coverage', () => {
    it('protects every implemented business route before its controller', () => {
        let checked = 0;
        for (const router of routers) {
            const layers = (
                router as unknown as {
                    stack: Array<{
                        route?: {
                            path: string;
                            stack: Array<{ handle: { name: string } }>;
                        };
                    }>;
                }
            ).stack;
            for (const layer of layers) {
                if (!layer.route) continue;
                const names = layer.route.stack.map((item) => item.handle.name);
                if (layer.route.path === '/' && names.includes('createClinicController')) continue;
                expect(names, layer.route.path).toContain('rateLimitRequest');
                expect(names.indexOf('rateLimitRequest')).toBeLessThan(names.length - 1);
                if (names.includes('requireClinicAccess')) {
                    expect(names.indexOf('requireClinicAccess')).toBeLessThan(
                        names.indexOf('rateLimitRequest')
                    );
                }
                expect(names[0], layer.route.path).toMatch(
                    /^(authenticateRequest|authenticateClerkIdentity)$/
                );
                checked += 1;
            }
        }
        expect(checked).toBe(56);
    });
});
