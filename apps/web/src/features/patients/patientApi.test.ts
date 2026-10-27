import { describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
vi.mock('../../lib', () => ({ apiClient: { get } }));

import { getPatient } from './patientApi';

describe('authorized patient detail mapping', () => {
    it('uses only the scoped clinic link for profile fields', async () => {
        get.mockResolvedValue({
            patient: {
                id: 'patient-id',
                fullName: 'Synthetic Patient',
                patientClinics: [
                    {
                        id: 'clinic-link-id',
                        isActive: true,
                        notes: 'Clinic-specific edit note',
                        routingStatus: 'CALCULATED',
                        totalAppointments: 3,
                        totalCompletedVisits: 2,
                        totalNoShows: 1,
                        totalLateArrivals: 0,
                        lastVisitAt: null,
                    },
                ],
            },
        });

        const result = await getPatient('clinic-id', 'patient-id');
        expect(result.patient).toMatchObject({
            id: 'patient-id',
            patientClinicId: 'clinic-link-id',
            notes: 'Clinic-specific edit note',
            routingStatus: 'CALCULATED',
            totalAppointments: 3,
        });
        expect(result.patient).not.toHaveProperty('patientClinics');
        expect(get).toHaveBeenCalledWith('/clinics/clinic-id/patients/patient-id', {
            signal: undefined,
        });
    });
});
