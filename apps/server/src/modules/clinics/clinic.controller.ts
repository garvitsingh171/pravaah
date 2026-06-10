import type { Request, Response } from 'express';
import { clinicService } from './clinic.service.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export async function createClinicController(req: Request, res: Response): Promise<void> {
    try {
        const clinicData = req.body as CreateClinicInput;

        const clinic = await clinicService.createClinic(clinicData);

        res.status(201).json({
            success: true,
            message: 'Clinic created successfully',
            data: {
                clinic,
            },
        });
        return;
    } catch (error) {
        if (error instanceof Error && error.name === 'CLINIC_SLUG_ALREADY_EXISTS') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CLINIC_SLUG_ALREADY_EXISTS',
                    message: 'Clinic slug already exists',
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong while creating clinic',
            },
        });
        return;
    }
}

export async function updateClinicController(req: Request, res: Response): Promise<void> {
    try {
        const clinicIdParam = req.params.clinicId;

        if (typeof clinicIdParam !== 'string' || clinicIdParam.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'CLINIC_ID_REQUIRED',
                    message: 'Clinic id is required',
                },
            });
            return;
        }

        const clinicData = req.body as UpdateClinicInput;

        const clinic = await clinicService.updateClinic(clinicIdParam, clinicData);

        res.status(200).json({
            success: true,
            message: 'Clinic updated successfully',
            data: {
                clinic,
            },
        });
        return;
    } catch (error) {
        if (error instanceof Error && error.name === 'CLINIC_NOT_FOUND') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLINIC_NOT_FOUND',
                    message: 'Clinic not found',
                },
            });
            return;
        }

        if (error instanceof Error && error.name === 'CLINIC_SLUG_ALREADY_EXISTS') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CLINIC_SLUG_ALREADY_EXISTS',
                    message: 'Clinic slug already exists',
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong while updating clinic',
            },
        });
        return;
    }
}
