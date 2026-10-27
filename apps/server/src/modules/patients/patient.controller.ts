import type { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service.js';
import type {
    CreatePatientInput,
    ListPatientsQueryInput,
    UpdatePatientInput,
} from './patient.types.js';

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

export async function retryPatientGeocodingController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as {
            clinicId: string;
            patientId: string;
        };
        const patient = await patientService.retryGeocoding(clinicId, patientId);

        res.status(200).json({
            success: true,
            message: 'Patient location lookup completed successfully',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
}

export async function retryPatientRoutingController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as {
            clinicId: string;
            patientId: string;
        };
        const patient = await patientService.retryRouting(clinicId, patientId);

        res.status(200).json({
            success: true,
            message: 'Travel estimate recalculated successfully',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
}

export async function listPatientsByClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const query = res.locals.validatedQuery as ListPatientsQueryInput;

        const data = await patientService.listPatientsByClinic(clinicId, query);

        res.status(200).json({
            success: true,
            message: 'Patients fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function getPatientByClinicController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as { clinicId: string; patientId: string };
        const patient = await patientService.getPatientByClinic(clinicId, patientId);
        res.status(200).json({
            success: true,
            message: 'Patient fetched successfully',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
}

export async function getPatientLifecycleImpactController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as { clinicId: string; patientId: string };
        const data = await patientService.getLifecycleImpact(clinicId, patientId);
        res.status(200).json({
            success: true,
            message: 'Patient impact fetched successfully',
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function archivePatientController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as { clinicId: string; patientId: string };
        const patient = await patientService.setClinicLinkActive({
            clinicId,
            patientId,
            actorUserId: req.user!.id,
            isActive: false,
        });
        res.status(200).json({
            success: true,
            message: 'Patient archived from this clinic',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
}

export async function restorePatientController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, patientId } = req.params as { clinicId: string; patientId: string };
        const patient = await patientService.setClinicLinkActive({
            clinicId,
            patientId,
            actorUserId: req.user!.id,
            isActive: true,
        });
        res.status(200).json({
            success: true,
            message: 'Patient restored to this clinic',
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
}
