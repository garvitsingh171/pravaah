import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../utils/AppError.js';

const mockClinicService = vi.hoisted(() => ({
    createClinic: vi.fn(),
    updateClinic: vi.fn(),
    provisionSampleData: vi.fn(),
}));

vi.mock('./clinic.service.js', () => ({
    clinicService: mockClinicService,
}));

import {
    createClinicController,
    provisionSampleDataController,
    updateClinicController,
} from './clinic.controller.js';

describe('createClinicController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('disables standalone clinic creation without calling clinic writes', async () => {
        const req = {
            body: {
                name: 'Standalone Clinic',
                slug: 'standalone-clinic',
            },
        } as unknown as Request;
        const res = {
            status: vi.fn(),
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        await createClinicController(req, res, next);

        expect(mockClinicService.createClinic).not.toHaveBeenCalled();
        expect(mockClinicService.updateClinic).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            new AppError(
                405,
                'STANDALONE_CLINIC_CREATION_DISABLED',
                'Standalone clinic creation is not supported'
            )
        );
    });
});

describe('updateClinicController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps clinic update behavior delegated to the clinic service', async () => {
        const clinic = {
            id: 'clinic-id',
            name: 'Updated Clinic',
            slug: 'updated-clinic',
        };
        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            body: {
                name: 'Updated Clinic',
            },
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockClinicService.updateClinic.mockResolvedValue(clinic);

        await updateClinicController(req, res, next);

        expect(mockClinicService.updateClinic).toHaveBeenCalledWith('clinic-id', {
            name: 'Updated Clinic',
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Clinic updated successfully',
            data: {
                clinic,
            },
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe('provisionSampleDataController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns created sample data summary', async () => {
        const summary = {
            doctors: 3,
            patients: 6,
            appointments: 9,
            noShowPredictions: 9,
            queueEntries: 6,
            todayQueueEntries: 6,
            today: '2026-06-20',
        };
        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            user: {
                id: 'admin-user-id',
            },
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockClinicService.provisionSampleData.mockResolvedValue({
            outcome: 'CREATED',
            summary,
        });

        await provisionSampleDataController(req, res, next);

        expect(mockClinicService.provisionSampleData).toHaveBeenCalledWith({
            clinicId: 'clinic-id',
            user: req.user,
        });
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Sample data provisioned successfully',
            data: {
                outcome: 'CREATED',
                summary,
            },
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns idempotent success when sample data already exists', async () => {
        const summary = {
            doctors: 3,
            patients: 6,
            appointments: 9,
            noShowPredictions: 9,
            queueEntries: 6,
            todayQueueEntries: 6,
            today: '2026-06-20',
        };
        const req = {
            params: {
                clinicId: 'clinic-id',
            },
            user: {
                id: 'admin-user-id',
            },
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockClinicService.provisionSampleData.mockResolvedValue({
            outcome: 'ALREADY_PROVISIONED',
            summary,
        });

        await provisionSampleDataController(req, res, next);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Sample data is already provisioned',
            data: {
                outcome: 'ALREADY_PROVISIONED',
                summary,
            },
        });
    });
});
