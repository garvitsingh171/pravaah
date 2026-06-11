import type { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service.js';
import type { CreatePatientInput } from './patient.types.js';

export async function createPatientController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const patientData = req.body as CreatePatientInput;

        const patient = await patientService.createPatient(clinicId, patientData);

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            data: {
                patient,
            },
        });
    } catch (error) {
        next(error);
    }
}
