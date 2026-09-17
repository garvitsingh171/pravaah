import { describe, expect, it } from 'vitest';
import { createPatientSchema, updatePatientSchema } from '../patient.validation.js';

describe('patient operational statistics validation', () => {
    it('rejects operational statistics in create and update requests', () => {
        const createResult = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            totalCompletedVisits: 99,
        });
        const updateResult = updatePatientSchema.safeParse({
            totalCompletedVisits: 99,
        });

        expect(createResult.success).toBe(false);
        expect(updateResult.success).toBe(false);
    });
});
