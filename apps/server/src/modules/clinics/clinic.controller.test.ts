import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../utils/AppError.js';

const mockClinicService = vi.hoisted(() => ({
    createClinic: vi.fn(),
    updateClinic: vi.fn(),
}));

vi.mock('./clinic.service.js', () => ({
    clinicService: mockClinicService,
}));

import { createClinicController, updateClinicController } from './clinic.controller.js';

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
