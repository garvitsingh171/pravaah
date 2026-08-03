import type { FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Button, fieldControlClassName } from '../../components/ui';
import type { DoctorSummary, PatientSummary } from '../../types';

export type AppointmentBookingFormValues = {
    doctorId: string;
    patientId: string;
    scheduledAt: string;
    durationMinutes: string;
    reason: string;
    notes: string;
};

export type AppointmentBookingFormFieldErrors = Partial<
    Record<keyof AppointmentBookingFormValues, string>
>;

type AppointmentBookingFormProps = {
    values: AppointmentBookingFormValues;
    fieldErrors: AppointmentBookingFormFieldErrors;
    doctors: DoctorSummary[];
    patients: PatientSummary[];
    isSubmitting: boolean;
    isDisabled: boolean;
    onChange: (field: keyof AppointmentBookingFormValues, value: string) => void;
    onSubmit: () => void;
};

const fieldBaseClass = fieldControlClassName;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-[var(--color-status-danger-border)]' : ''
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

const getFieldErrorId = (field: keyof AppointmentBookingFormValues): string => {
    return `appointment-booking-${field}-error`;
};

const getFieldErrorDescriptionId = (
    field: keyof AppointmentBookingFormValues,
    fieldErrors: AppointmentBookingFormFieldErrors
): string | undefined => {
    return fieldErrors[field] ? getFieldErrorId(field) : undefined;
};

const getOptionalText = (value: string | null | undefined): string | null => {
    const trimmedValue = value?.trim();

    return trimmedValue || null;
};

const getDoctorOptionLabel = (doctor: DoctorSummary): string => {
    const specialization = getOptionalText(doctor.specialization);

    return specialization ? `${doctor.fullName} - ${specialization}` : doctor.fullName;
};

const getPatientOptionLabel = (patient: PatientSummary): string => {
    const phone = getOptionalText(patient.phone);

    return phone ? `${patient.fullName} - ${phone}` : patient.fullName;
};

function RequiredMark() {
    return <span className="text-[var(--color-status-danger-text)]">*</span>;
}

function AppointmentBookingForm({
    values,
    fieldErrors,
    doctors,
    patients,
    isSubmitting,
    isDisabled,
    onChange,
    onSubmit,
}: AppointmentBookingFormProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
    };

    const controlsDisabled = isSubmitting || isDisabled;

    return (
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                    Doctor <RequiredMark />
                    <select
                        className={getFieldClassName(Boolean(fieldErrors.doctorId))}
                        value={values.doctorId}
                        onChange={(event) => onChange('doctorId', event.target.value)}
                        disabled={controlsDisabled}
                        aria-invalid={Boolean(fieldErrors.doctorId)}
                        aria-describedby={getFieldErrorDescriptionId('doctorId', fieldErrors)}
                        required
                    >
                        <option value="">Select doctor</option>
                        {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                                {getDoctorOptionLabel(doctor)}
                            </option>
                        ))}
                    </select>
                    <FieldError id={getFieldErrorId('doctorId')} message={fieldErrors.doctorId} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Patient <RequiredMark />
                    <select
                        className={getFieldClassName(Boolean(fieldErrors.patientId))}
                        value={values.patientId}
                        onChange={(event) => onChange('patientId', event.target.value)}
                        disabled={controlsDisabled}
                        aria-invalid={Boolean(fieldErrors.patientId)}
                        aria-describedby={getFieldErrorDescriptionId('patientId', fieldErrors)}
                        required
                    >
                        <option value="">Select patient</option>
                        {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {getPatientOptionLabel(patient)}
                            </option>
                        ))}
                    </select>
                    <FieldError id={getFieldErrorId('patientId')} message={fieldErrors.patientId} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Appointment date and time <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.scheduledAt))}
                        type="datetime-local"
                        value={values.scheduledAt}
                        onChange={(event) => onChange('scheduledAt', event.target.value)}
                        disabled={controlsDisabled}
                        aria-invalid={Boolean(fieldErrors.scheduledAt)}
                        aria-describedby={getFieldErrorDescriptionId('scheduledAt', fieldErrors)}
                        required
                    />
                    <FieldError
                        id={getFieldErrorId('scheduledAt')}
                        message={fieldErrors.scheduledAt}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Duration minutes <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.durationMinutes))}
                        value={values.durationMinutes}
                        onChange={(event) => onChange('durationMinutes', event.target.value)}
                        disabled={controlsDisabled}
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        aria-invalid={Boolean(fieldErrors.durationMinutes)}
                        aria-describedby={getFieldErrorDescriptionId(
                            'durationMinutes',
                            fieldErrors
                        )}
                        required
                    />
                    <FieldError
                        id={getFieldErrorId('durationMinutes')}
                        message={fieldErrors.durationMinutes}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Reason
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.reason))}
                        value={values.reason}
                        onChange={(event) => onChange('reason', event.target.value)}
                        disabled={controlsDisabled}
                        placeholder="Fever, follow-up, consultation"
                    />
                    <FieldError message={fieldErrors.reason} />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Notes
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.notes))}
                        value={values.notes}
                        onChange={(event) => onChange('notes', event.target.value)}
                        disabled={controlsDisabled}
                        rows={3}
                    />
                    <FieldError message={fieldErrors.notes} />
                </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button
                    type="submit"
                    disabled={controlsDisabled}
                    isLoading={isSubmitting}
                    loadingText="Booking appointment..."
                >
                    Book appointment
                </Button>
            </div>
        </form>
    );
}

export default AppointmentBookingForm;
