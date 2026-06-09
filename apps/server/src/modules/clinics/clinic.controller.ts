import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { clinicService } from './clinic.service.js';
import { createClinicSchema } from './clinic.validation.js';
import type { CreateClinicInput } from './clinic.types.js';

export async function createClinicController(req: Request, res: Response) {
    try {
        const clinicData = req.body as CreateClinicInput;

        const clinic = await clinicService.createClinic(clinicData);

        return res.status(201).json({
            success: true,
            message: 'Clinic created successfully',
            data: {
                clinic,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'CLINIC_SLUG_ALREADY_EXISTS') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CLINIC_SLUG_ALREADY_EXISTS',
                    message: 'Clinic slug already exists',
                },
            });
        }

        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Something went wrong while creating clinic',
            },
        });
    }
}
