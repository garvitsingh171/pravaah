import type { Request, Response, NextFunction } from 'express';
import { doctorService } from './doctor.service.js';
import type { CreateDoctorInput } from './doctor.types.js';

export async function createDoctorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const doctorData = req.body as CreateDoctorInput;

        const doctor = await doctorService.createDoctor(clinicId, doctorData);

        res.status(201).json({
            success: true,
            message: 'Doctor created successfully',
            data: {
                doctor,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function listDoctorsByClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };

        const doctors = await doctorService.listDoctorsByClinic(clinicId);

        res.status(200).json({
            success: true,
            message: 'Doctors fetched successfully',
            data: {
                doctors,
            },
        });
    } catch (error) {
        next(error);
    }
}
