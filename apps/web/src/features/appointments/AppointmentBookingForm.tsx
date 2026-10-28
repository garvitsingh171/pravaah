import { useLayoutEffect, useRef, type FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Button, fieldControlClassName } from '../../components/ui';
import type { DoctorSummary, PatientSummary } from '../../types';
import type { AvailableAppointmentSlot } from './appointmentApi';

export type AppointmentBookingFormValues = {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
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
    availableSlots: AvailableAppointmentSlot[];
    isLoadingSlots: boolean;
    slotsError?: string | null;
    isSubmitting: boolean;
    isDisabled: boolean;
    onChange: (field: keyof AppointmentBookingFormValues, value: string) => void;
    onSubmit: () => void;
    onAddPatient: () => void;
    patientSearch: string;
    isLoadingPatients: boolean;
    patientSearchError?: string | null;
    onPatientSearchChange: (value: string) => void;
};

const fieldBaseClass = fieldControlClassName;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-[var(--color-status-danger-border)]' : ''
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

const getFieldLabelId = (field: keyof AppointmentBookingFormValues) =>
    `appointment-booking-${field}-label`;

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

const getSlotOptionLabel = (slot: AvailableAppointmentSlot): string => {
    return `${slot.localStartTime}-${slot.localEndTime}`;
};

function RequiredMark() {
    return <span className="text-[var(--color-status-danger-text)]">*</span>;
}

function AppointmentBookingForm({
    values,
    fieldErrors,
    doctors,
    patients,
    availableSlots,
    isLoadingSlots,
    slotsError,
    isSubmitting,
    isDisabled,
    onChange,
    onSubmit,
    onAddPatient,
    patientSearch,
    isLoadingPatients,
    patientSearchError,
    onPatientSearchChange,
}: AppointmentBookingFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const focusErrorAfterSubmit = useRef(false);

    useLayoutEffect(() => {
        if (!focusErrorAfterSubmit.current || !Object.values(fieldErrors).some(Boolean)) return;
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        focusErrorAfterSubmit.current = false;
    }, [fieldErrors]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        focusErrorAfterSubmit.current = true;
        onSubmit();
    };

    const controlsDisabled = isSubmitting || isDisabled;
    const selectedDoctor = doctors.find((doctor) => doctor.id === values.doctorId);
    const selectedPatient = patients.find((patient) => patient.id === values.patientId);
    const searchMatches = patients.filter((patient) =>
        getPatientOptionLabel(patient)
            .toLocaleLowerCase()
            .includes(patientSearch.trim().toLocaleLowerCase())
    );
    const matchingPatients = patients.filter(
        (patient) => searchMatches.includes(patient) || patient.id === values.patientId
    );

    return (
        <form ref={formRef} className="space-y-6" noValidate onSubmit={handleSubmit}>
            <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-950">
                    Clinic records
                </legend>
                <p className="mb-4 text-sm leading-6 text-slate-600">
                    Choose the patient and the doctor for this visit.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                        <span id={getFieldLabelId('doctorId')}>
                            Doctor <RequiredMark />
                        </span>
                        <select
                            className={getFieldClassName(Boolean(fieldErrors.doctorId))}
                            value={values.doctorId}
                            onChange={(event) => onChange('doctorId', event.target.value)}
                            disabled={controlsDisabled}
                            aria-invalid={Boolean(fieldErrors.doctorId)}
                            aria-labelledby={getFieldLabelId('doctorId')}
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
                        <FieldError
                            id={getFieldErrorId('doctorId')}
                            message={fieldErrors.doctorId}
                        />
                        {selectedDoctor ? (
                            <span className="mt-1 block text-xs text-slate-500">
                                {getDoctorOptionLabel(selectedDoctor)}
                            </span>
                        ) : null}
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Find patient
                            <input
                                className={fieldControlClassName}
                                type="search"
                                maxLength={100}
                                placeholder="Search by name or phone"
                                value={patientSearch}
                                onChange={(event) => onPatientSearchChange(event.target.value)}
                                disabled={isSubmitting}
                                aria-describedby="appointment-booking-patient-search-help appointment-booking-patient-search-status"
                            />
                        </label>
                        <p
                            id="appointment-booking-patient-search-help"
                            className="mt-1 text-xs text-slate-600"
                        >
                            Search by name or phone, then choose a patient from the list below.
                        </p>
                        <label className="mt-3 block text-sm font-medium text-slate-700">
                            <span id={getFieldLabelId('patientId')}>
                                Patient <RequiredMark />
                            </span>
                            <select
                                className={getFieldClassName(Boolean(fieldErrors.patientId))}
                                value={values.patientId}
                                onChange={(event) => onChange('patientId', event.target.value)}
                                disabled={controlsDisabled}
                                aria-invalid={Boolean(fieldErrors.patientId)}
                                aria-labelledby={getFieldLabelId('patientId')}
                                aria-describedby={getFieldErrorDescriptionId(
                                    'patientId',
                                    fieldErrors
                                )}
                                required
                            >
                                <option value="">Select patient</option>
                                {matchingPatients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {getPatientOptionLabel(patient)}
                                    </option>
                                ))}
                            </select>
                            <FieldError
                                id={getFieldErrorId('patientId')}
                                message={fieldErrors.patientId}
                            />
                            {selectedPatient ? (
                                <span className="mt-1 block text-xs text-slate-500">
                                    {getPatientOptionLabel(selectedPatient)}
                                </span>
                            ) : null}
                        </label>
                        <p
                            id="appointment-booking-patient-search-status"
                            role="status"
                            className="mt-2 text-xs text-app-muted"
                        >
                            {isLoadingPatients
                                ? 'Searching patients…'
                                : patientSearchError
                                  ? 'Patient and doctor options could not be loaded. Retry above.'
                                  : patientSearch && searchMatches.length === 0
                                    ? 'No matching patients in this clinic.'
                                    : `${searchMatches.length} patient${searchMatches.length === 1 ? '' : 's'} available in the list.`}
                        </p>
                        <button
                            type="button"
                            className="mt-2 min-h-10 text-sm font-semibold text-action underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
                            onClick={onAddPatient}
                            disabled={isSubmitting}
                        >
                            Add a new patient
                        </button>
                    </div>
                </div>
            </fieldset>

            <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
                <legend className="px-1 text-sm font-semibold text-slate-950">Timing</legend>
                <div className="grid gap-5 md:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                        <span id={getFieldLabelId('appointmentDate')}>
                            Appointment date <RequiredMark />
                        </span>
                        <input
                            className={getFieldClassName(Boolean(fieldErrors.appointmentDate))}
                            type="date"
                            value={values.appointmentDate}
                            onChange={(event) => onChange('appointmentDate', event.target.value)}
                            disabled={controlsDisabled}
                            aria-invalid={Boolean(fieldErrors.appointmentDate)}
                            aria-labelledby={getFieldLabelId('appointmentDate')}
                            aria-describedby={getFieldErrorDescriptionId(
                                'appointmentDate',
                                fieldErrors
                            )}
                            required
                        />
                        <FieldError
                            id={getFieldErrorId('appointmentDate')}
                            message={fieldErrors.appointmentDate}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        <span id={getFieldLabelId('durationMinutes')}>
                            Duration minutes <RequiredMark />
                        </span>
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
                            aria-labelledby={getFieldLabelId('durationMinutes')}
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
                        <span id={getFieldLabelId('scheduledAt')}>
                            Available slot <RequiredMark />
                        </span>
                        <select
                            className={getFieldClassName(Boolean(fieldErrors.scheduledAt))}
                            value={values.scheduledAt}
                            onChange={(event) => onChange('scheduledAt', event.target.value)}
                            disabled={
                                controlsDisabled ||
                                isLoadingSlots ||
                                Boolean(slotsError) ||
                                availableSlots.length === 0
                            }
                            aria-invalid={Boolean(fieldErrors.scheduledAt)}
                            aria-labelledby={getFieldLabelId('scheduledAt')}
                            aria-describedby={getFieldErrorDescriptionId(
                                'scheduledAt',
                                fieldErrors
                            )}
                            required
                        >
                            <option value="">
                                {isLoadingSlots
                                    ? 'Loading slots...'
                                    : availableSlots.length > 0
                                      ? 'Select slot'
                                      : 'No slots available'}
                            </option>
                            {availableSlots.map((slot) => (
                                <option key={slot.scheduledAt} value={slot.scheduledAt}>
                                    {getSlotOptionLabel(slot)}
                                </option>
                            ))}
                        </select>
                        <FieldError
                            id={getFieldErrorId('scheduledAt')}
                            message={fieldErrors.scheduledAt}
                        />
                        {slotsError ? (
                            <span className="mt-1 block text-xs text-[var(--color-status-danger-text)]">
                                {slotsError}
                            </span>
                        ) : null}
                    </label>
                </div>
            </fieldset>

            <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
                <legend className="px-1 text-sm font-semibold text-slate-950">Visit context</legend>
                <p className="mb-4 text-sm leading-6 text-slate-600">
                    Reason and notes are optional operational context for staff. Keep them concise
                    and relevant to this appointment.
                </p>
                <div className="grid gap-5">
                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        <span id={getFieldLabelId('reason')}>
                            Reason{' '}
                            <span className="text-xs font-normal text-slate-500">(optional)</span>
                        </span>
                        <input
                            className={getFieldClassName(Boolean(fieldErrors.reason))}
                            value={values.reason}
                            onChange={(event) => onChange('reason', event.target.value)}
                            disabled={controlsDisabled}
                            placeholder="Fever, follow-up, consultation"
                            aria-invalid={Boolean(fieldErrors.reason)}
                            aria-labelledby={getFieldLabelId('reason')}
                            aria-describedby={getFieldErrorDescriptionId('reason', fieldErrors)}
                        />
                        <FieldError id={getFieldErrorId('reason')} message={fieldErrors.reason} />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                        <span id={getFieldLabelId('notes')}>
                            Staff notes{' '}
                            <span className="text-xs font-normal text-slate-500">(optional)</span>
                        </span>
                        <textarea
                            className={getFieldClassName(Boolean(fieldErrors.notes))}
                            value={values.notes}
                            onChange={(event) => onChange('notes', event.target.value)}
                            disabled={controlsDisabled}
                            rows={3}
                            aria-invalid={Boolean(fieldErrors.notes)}
                            aria-labelledby={getFieldLabelId('notes')}
                            aria-describedby={getFieldErrorDescriptionId('notes', fieldErrors)}
                        />
                        <FieldError id={getFieldErrorId('notes')} message={fieldErrors.notes} />
                    </label>
                </div>
            </fieldset>

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
