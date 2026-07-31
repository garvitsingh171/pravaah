import { describe, expect, it } from 'vitest';
import { dashboardClinicIdParamsSchema } from '../dashboard.validation.js';

describe('dashboardClinicIdParamsSchema', () => {
    it('accepts standard Prisma UUID clinic ids', () => {
        const result = dashboardClinicIdParamsSchema.safeParse({
            clinicId: '550e8400-e29b-41d4-a716-446655440000',
        });

        expect(result.success).toBe(true);
    });

    it('accepts PostgreSQL UUID-shaped clinic ids without requiring RFC version bits', () => {
        const result = dashboardClinicIdParamsSchema.safeParse({
            clinicId: '00000000-0000-0000-0000-000000000000',
        });

        expect(result.success).toBe(true);
    });
});
