import { describe, expect, it } from 'vitest';
import { dashboardClinicIdParamsSchema, noShowIntelligenceQuerySchema } from '../dashboard.validation.js';

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

describe('noShowIntelligenceQuerySchema', () => {
    it('accepts a clinic calendar period up to 31 days', () => {
        expect(noShowIntelligenceQuerySchema.safeParse({ from: '2026-06-01', to: '2026-06-30' }).success).toBe(true);
    });

    it('rejects reversed or overly broad periods', () => {
        expect(noShowIntelligenceQuerySchema.safeParse({ from: '2026-06-02', to: '2026-06-01' }).success).toBe(false);
        expect(noShowIntelligenceQuerySchema.safeParse({ from: '2026-06-01', to: '2026-07-02' }).success).toBe(false);
    });
});
