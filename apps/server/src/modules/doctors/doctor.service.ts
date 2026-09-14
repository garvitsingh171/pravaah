import { AppError } from '../../utils/AppError.js';
import {
    assertAvailabilityWithinClinicHours,
    normalizeAvailabilityDays,
    sortAvailabilityDays,
    weekdays,
    type DoctorAvailabilityDayInput,
    type DoctorAvailabilityPeriodInput,
    type Weekday,
} from './doctorAvailability.js';
import { doctorRepository } from './doctor.repository.js';
import type {
    CreateDoctorInput,
    ReplaceDoctorAvailabilityInput,
    UpdateDoctorInput,
} from './doctor.types.js';

type DoctorAvailabilityPeriodRecord = DoctorAvailabilityPeriodInput & {
    id: string;
    weekday: Weekday;
};

const buildDoctorAvailabilityResponse = ({
    clinicId,
    doctorId,
    doctorClinicId,
    timezone,
    periods,
}: {
    clinicId: string;
    doctorId: string;
    doctorClinicId: string;
    timezone: string;
    periods: DoctorAvailabilityPeriodRecord[];
}) => {
    const periodsByWeekday = new Map<Weekday, DoctorAvailabilityPeriodRecord[]>();

    for (const weekday of weekdays) {
        periodsByWeekday.set(weekday, []);
    }

    for (const period of periods) {
        periodsByWeekday.get(period.weekday)?.push(period);
    }

    const days = sortAvailabilityDays(
        weekdays.map((weekday) => ({
            weekday,
            periods: (periodsByWeekday.get(weekday) ?? []).map((period) => ({
                id: period.id,
                startTime: period.startTime,
                endTime: period.endTime,
            })),
        }))
    );

    return {
        doctorId,
        doctorClinicId,
        clinicId,
        timezone,
        days,
    };
};

const mapAvailabilityPeriods = (
    periods: Array<{
        id: string;
        weekday: string;
        startTime: string;
        endTime: string;
    }>
): DoctorAvailabilityPeriodRecord[] => {
    return periods.map((period) => ({
        id: period.id,
        weekday: period.weekday as Weekday,
        startTime: period.startTime,
        endTime: period.endTime,
    }));
};

const loadDoctorClinicAvailabilityContext = async (clinicId: string, doctorId: string) => {
    const existingClinic = await doctorRepository.findClinicById(clinicId);

    if (!existingClinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    const existingDoctor = await doctorRepository.findDoctorById(doctorId);

    if (!existingDoctor) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
    }

    const doctorClinicLink = await doctorRepository.findDoctorClinicLink(clinicId, doctorId);

    if (!doctorClinicLink) {
        throw new AppError(
            404,
            'DOCTOR_NOT_LINKED_TO_CLINIC',
            'Doctor is not linked to this clinic'
        );
    }

    return {
        clinic: existingClinic,
        doctor: existingDoctor,
        doctorClinicLink,
    };
};

export const doctorService = {
    async createDoctor(clinicId: string, input: CreateDoctorInput) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        return doctorRepository.createDoctorWithClinicLink(clinicId, input);
    },

    async listDoctorsByClinic(clinicId: string) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const doctorLinks = await doctorRepository.findDoctorLinksByClinicId(clinicId);

        return doctorLinks.map((doctorLink) => ({
            doctorClinicId: doctorLink.id,
            clinicLinkIsActive: doctorLink.isActive,
            ...doctorLink.doctor,
        }));
    },

    async updateDoctor(clinicId: string, doctorId: string, input: UpdateDoctorInput) {
        const existingClinic = await doctorRepository.findClinicById(clinicId);

        if (!existingClinic) {
            throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
        }

        const existingDoctor = await doctorRepository.findDoctorById(doctorId);

        if (!existingDoctor) {
            throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Doctor not found');
        }

        const doctorClinicLink = await doctorRepository.findDoctorClinicLink(clinicId, doctorId);

        if (!doctorClinicLink) {
            throw new AppError(
                404,
                'DOCTOR_NOT_LINKED_TO_CLINIC',
                'Doctor is not linked to this clinic'
            );
        }

        return doctorRepository.updateDoctor(doctorId, input);
    },

    async getDoctorAvailability(clinicId: string, doctorId: string) {
        const { clinic, doctor, doctorClinicLink } = await loadDoctorClinicAvailabilityContext(
            clinicId,
            doctorId
        );

        const periods = await doctorRepository.findDoctorAvailabilityPeriods(doctorClinicLink.id);

        return buildDoctorAvailabilityResponse({
            clinicId: clinic.id,
            doctorId: doctor.id,
            doctorClinicId: doctorClinicLink.id,
            timezone: clinic.timezone,
            periods: mapAvailabilityPeriods(periods),
        });
    },

    async replaceDoctorAvailability(
        clinicId: string,
        doctorId: string,
        input: ReplaceDoctorAvailabilityInput
    ) {
        const normalizedDays: DoctorAvailabilityDayInput[] = normalizeAvailabilityDays(input.days);
        const { clinic, doctor, doctorClinicLink } = await loadDoctorClinicAvailabilityContext(
            clinicId,
            doctorId
        );

        assertAvailabilityWithinClinicHours(normalizedDays, clinic);

        const periods = await doctorRepository.replaceDoctorAvailability(
            doctorClinicLink.id,
            normalizedDays
        );

        return buildDoctorAvailabilityResponse({
            clinicId: clinic.id,
            doctorId: doctor.id,
            doctorClinicId: doctorClinicLink.id,
            timezone: clinic.timezone,
            periods: mapAvailabilityPeriods(periods),
        });
    },
};
