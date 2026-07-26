import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { clinicService } from './clinic.service.js';
import type { UpdateClinicInput } from './clinic.types.js';

export async function createClinicController(
    _req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        throw new AppError(
            405,
            'STANDALONE_CLINIC_CREATION_DISABLED',
            'Standalone clinic creation is not supported'
        );
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
