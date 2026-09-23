import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeoapifyError } from '../../../integrations/geoapify/geoapify.types.js';

const mockRoutingRepository = vi.hoisted(() => ({
    findRoutingContext: vi.fn(),
    beginRoutingAttempt: vi.fn(),
    saveRoutingResultIfCurrent: vi.fn(),
    markRoutingFailedIfCurrent: vi.fn(),
}));
const mockRoutePatientToClinic = vi.hoisted(() => vi.fn());

vi.mock('../../../config/env.js', () => ({
    env: { geoapifyApiKey: 'test-key' },
}));
vi.mock('../routing.repository.js', () => ({
    routingRepository: mockRoutingRepository,
}));
vi.mock('../../../integrations/geoapify/geoapify.routing.client.js', async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import('../../../integrations/geoapify/geoapify.routing.client.js')
        >();

    return {
        ...actual,
        createGeoapifyRoutingClient: vi.fn(() => ({
            routePatientToClinic: mockRoutePatientToClinic,
        })),
    };
});

import { routingService } from '../routing.service.js';

const context = {
    id: 'link-id',
    patientId: 'patient-id',
    clinicId: 'clinic-id',
    distanceFromClinicKm: null,
    estimatedTravelTimeMinutes: null,
    routingStatus: 'FAILED',
    routingProvider: 'GEOAPIFY',
    routingMode: 'DRIVE',
    routingTrafficModel: 'FREE_FLOW',
    routedAt: null,
    routingSourceHash: null,
    routingAttemptId: null,
    patient: {
        id: 'patient-id',
        latitude: 26.912434,
        longitude: 75.787271,
        geocodingStatus: 'GEOCODED',
    },
    clinic: {
        id: 'clinic-id',
        latitude: 26.85305,
        longitude: 75.80573,
        geocodingStatus: 'GEOCODED',
    },
};

describe('routingService concurrent attempt protection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRoutingRepository.findRoutingContext.mockResolvedValue(context);
        mockRoutingRepository.beginRoutingAttempt.mockResolvedValue({});
        mockRoutingRepository.saveRoutingResultIfCurrent.mockResolvedValue({ count: 1 });
        mockRoutingRepository.markRoutingFailedIfCurrent.mockResolvedValue({ count: 1 });
    });

    it('uses separate attempt IDs when same-source retries race', async () => {
        let rejectFirst: ((reason: unknown) => void) | undefined;
        let resolveSecond: ((value: unknown) => void) | undefined;
        mockRoutePatientToClinic
            .mockImplementationOnce(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectFirst = reject;
                    })
            )
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveSecond = resolve;
                    })
            );

        const first = routingService.calculatePatientClinicRoute({
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            force: true,
        });
        await Promise.resolve();
        const second = routingService.calculatePatientClinicRoute({
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            force: true,
        });
        await vi.waitFor(() => {
            expect(mockRoutePatientToClinic).toHaveBeenCalledTimes(2);
        });

        rejectFirst?.(new GeoapifyError('UPSTREAM_ERROR'));
        resolveSecond?.({ distanceMeters: 8437, travelTimeSeconds: 601, provider: 'GEOAPIFY' });

        await Promise.all([first, second]);

        const attempts = mockRoutingRepository.beginRoutingAttempt.mock.calls.map(
            ([, , sourceHash, attemptId]) => ({ sourceHash, attemptId })
        );
        expect(attempts).toHaveLength(2);
        expect(attempts[0]?.sourceHash).toBe(attempts[1]?.sourceHash);
        expect(attempts[0]?.attemptId).not.toBe(attempts[1]?.attemptId);
        expect(mockRoutingRepository.saveRoutingResultIfCurrent).toHaveBeenCalledWith(
            'patient-id',
            'clinic-id',
            attempts[1]?.sourceHash,
            attempts[1]?.attemptId,
            expect.objectContaining({ distanceKm: '8.44', estimatedTravelTimeMinutes: 11 })
        );
        expect(mockRoutingRepository.markRoutingFailedIfCurrent).toHaveBeenCalledWith(
            'patient-id',
            'clinic-id',
            attempts[0]?.sourceHash,
            attempts[0]?.attemptId
        );
    });
});
