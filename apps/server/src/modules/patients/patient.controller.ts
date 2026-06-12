import type { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service.js';
import type { CreatePatientInput, UpdatePatientInput } from './patient.types.js';

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

export async function updatePatientController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as {
            clinicId: string;
            patientId: string;
        };

        const patientData = req.body as UpdatePatientInput;

        const patient = await patientService.updatePatient(clinicId, patientId, patientData);

        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: {
                patient,
            },
        });
    } catch (error) {
        next(error);
    }
}
