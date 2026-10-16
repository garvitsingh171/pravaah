import type { Request, Response, NextFunction } from 'express';
import { doctorService } from './doctor.service.js';
import type {
    CreateDoctorInput,
    ReplaceDoctorAvailabilityInput,
    UpdateDoctorInput,
} from './doctor.types.js';

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

export async function getDoctorByClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as { clinicId: string; doctorId: string };
        const doctor = await doctorService.getDoctorByClinic(clinicId, doctorId);
        res.status(200).json({
            success: true,
            message: 'Doctor fetched successfully',
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
}

export async function getDoctorLifecycleImpactController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as { clinicId: string; doctorId: string };
        const data = await doctorService.getLifecycleImpact(clinicId, doctorId);
        res.status(200).json({
            success: true,
            message: 'Doctor impact fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function archiveDoctorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as { clinicId: string; doctorId: string };
        const doctor = await doctorService.setClinicLinkActive({
            clinicId,
            doctorId,
            actorUserId: req.user!.id,
            isActive: false,
        });
        res.status(200).json({
            success: true,
            message: 'Doctor archived from this clinic',
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
}

export async function restoreDoctorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as { clinicId: string; doctorId: string };
        const doctor = await doctorService.setClinicLinkActive({
            clinicId,
            doctorId,
            actorUserId: req.user!.id,
            isActive: true,
        });
        res.status(200).json({
            success: true,
            message: 'Doctor restored to this clinic',
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateDoctorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as {
            clinicId: string;
            doctorId: string;
        };

        const doctorData = req.body as UpdateDoctorInput;

        const doctor = await doctorService.updateDoctor(clinicId, doctorId, doctorData);

        res.status(200).json({
            success: true,
            message: 'Doctor updated successfully',
            data: {
                doctor,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getDoctorAvailabilityController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as {
            clinicId: string;
            doctorId: string;
        };

        const availability = await doctorService.getDoctorAvailability(clinicId, doctorId);

        res.status(200).json({
            success: true,
            message: 'Doctor availability fetched successfully',
            data: {
                availability,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function replaceDoctorAvailabilityController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, doctorId } = req.params as {
            clinicId: string;
            doctorId: string;
        };
        const availabilityData = req.body as ReplaceDoctorAvailabilityInput;

        const availability = await doctorService.replaceDoctorAvailability(
            clinicId,
            doctorId,
            availabilityData
        );

        res.status(200).json({
            success: true,
            message: 'Doctor availability updated successfully',
            data: {
                availability,
            },
        });
    } catch (error) {
        next(error);
    }
}
