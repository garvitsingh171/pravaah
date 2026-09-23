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

    it('rejects client-controlled distance and routing fields', () => {
        const createResult = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            distanceFromClinicKm: 8,
        });
        const updateResult = updatePatientSchema.safeParse({
            distanceFromClinicKm: 8,
            routingStatus: 'CALCULATED',
        });

        expect(createResult.success).toBe(false);
        expect(updateResult.success).toBe(false);
    });
});

describe('patient structured location validation', () => {
    it('accepts a complete structured address and normalizes text fields', () => {
        const result = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            addressLine1: '  B-42, Malviya Nagar  ',
            addressLine2: ' Near Gaurav Tower ',
            city: ' Jaipur ',
            state: ' Rajasthan ',
            country: ' India ',
            pincode: '302017',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.addressLine1).toBe('B-42, Malviya Nagar');
            expect(result.data.addressLine2).toBe('Near Gaurav Tower');
            expect(result.data.city).toBe('Jaipur');
            expect(result.data.state).toBe('Rajasthan');
            expect(result.data.country).toBe('India');
        }
    });

    it('keeps patient location optional and turns whitespace-only values into undefined', () => {
        const result = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            addressLine2: '   ',
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.addressLine2).toBeUndefined();
            expect(result.data.country).toBeUndefined();
        }
    });

    it('rejects the legacy address request field and invalid Indian pincodes', () => {
        const legacyResult = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            address: 'B-42 Malviya Nagar',
        });
        const invalidPincodeResult = createPatientSchema.safeParse({
            fullName: 'Riya Malhotra',
            phone: '+91 90000 02001',
            country: 'India',
            pincode: '30201',
        });

        expect(legacyResult.success).toBe(false);
        expect(invalidPincodeResult.success).toBe(false);
    });

    it('allows bounded international postal text and supports independent PATCH clearing', () => {
        const internationalResult = createPatientSchema.safeParse({
            fullName: 'Amelia Stone',
            phone: '+44 20 1234 5678',
            country: 'United Kingdom',
            pincode: 'SW1A 1AA',
        });
        const patchResult = updatePatientSchema.safeParse({
            addressLine2: null,
            city: ' Jaipur ',
        });

        expect(internationalResult.success).toBe(true);
        expect(patchResult.success).toBe(true);

        if (patchResult.success) {
            expect(patchResult.data.addressLine2).toBeNull();
            expect(patchResult.data.city).toBe('Jaipur');
        }
    });
});
