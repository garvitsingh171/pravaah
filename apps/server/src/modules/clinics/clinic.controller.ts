import type { Request, Response, NextFunction } from 'express';
import { clinicService } from './clinic.service.js';
import type { CreateClinicInput, UpdateClinicInput } from './clinic.types.js';

export async function createClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
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
    } catch (error) {
        next(error);
    }
}

export async function updateClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const clinicData = req.body as UpdateClinicInput;

        const clinic = await clinicService.updateClinic(clinicId, clinicData);

        res.status(200).json({
            success: true,
            message: 'Clinic updated successfully',
            data: {
                clinic,
            },
        });
    } catch (error) {
        next(error);
    }
}
