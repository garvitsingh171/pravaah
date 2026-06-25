import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import { BookingSource } from '../../types';
import type { DoctorSummary, PatientSummary, RiskLevel } from '../../types';
import { listDoctors } from '../doctors/doctorApi';
import { listPatients } from '../patients/patientApi';
import AppointmentBookingForm, {
    type AppointmentBookingFormFieldErrors,
    type AppointmentBookingFormValues,
} from './AppointmentBookingForm';
import { createAppointment, type CreateAppointmentRequest } from './appointmentApi';

type BackendValidationDetail = {
    field: string;
    message: string;
};

type AppointmentReferenceState =
    | {
          status: 'loading';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'success';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'error';
          doctors: DoctorSummary[];
          patients: PatientSummary[];
          error: {
              title: string;
              message: string;
              code?: string;
          };
      };

type SuccessState = {
    message: string;
    scheduledAt: string;
    riskLevel?: RiskLevel;
};

const emptyFormValues: AppointmentBookingFormValues = {
    doctorId: '',
    patientId: '',
    scheduledAt: '',
    durationMinutes: '15',
    reason: '',
    notes: '',
};

const emptyReferenceState: AppointmentReferenceState = {
    status: 'loading',
    doctors: [],
    patients: [],
    error: null,
};

const requiredText = 'This field is required.';

const validationFieldMap: Partial<Record<string, keyof AppointmentBookingFormValues>> = {
    'body.doctorId': 'doctorId',
    'body.patientId': 'patientId',
    'body.scheduledAt': 'scheduledAt',
    'body.durationMinutes': 'durationMinutes',
    'body.reason': 'reason',
    'body.notes': 'notes',
};

const isActiveDoctor = (doctor: DoctorSummary): boolean => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false;
};

const isActivePatient = (patient: PatientSummary): boolean => {
    return patient.isActive && patient.clinicLinkIsActive !== false;
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const validateAppointmentForm = (
    values: AppointmentBookingFormValues
): AppointmentBookingFormFieldErrors => {
    const errors: AppointmentBookingFormFieldErrors = {};

    if (!values.doctorId) {
        errors.doctorId = requiredText;
    }

    if (!values.patientId) {
        errors.patientId = requiredText;
    }

    if (!values.scheduledAt) {
        errors.scheduledAt = requiredText;
    } else if (Number.isNaN(new Date(values.scheduledAt).getTime())) {
        errors.scheduledAt = 'Enter a valid appointment date and time.';
    }

    if (!values.durationMinutes.trim()) {
        errors.durationMinutes = requiredText;
    } else {
        const durationMinutes = Number(values.durationMinutes);

        if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            errors.durationMinutes = 'Duration minutes must be a positive whole number.';
        }
    }

    return errors;
};

const toCreateAppointmentRequest = (
    values: AppointmentBookingFormValues
): CreateAppointmentRequest => {
    return {
        doctorId: values.doctorId,
        patientId: values.patientId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        durationMinutes: Number(values.durationMinutes),
        reason: toOptionalString(values.reason),
        notes: toOptionalString(values.notes),
        bookingSource: BookingSource.RECEPTION,
    };
};

const getBackendValidationDetails = (details: unknown): BackendValidationDetail[] => {
    if (!Array.isArray(details)) {
        return [];
    }

    return details.reduce<BackendValidationDetail[]>((validationDetails, detail) => {
        if (
            typeof detail !== 'object' ||
            detail === null ||
            !('field' in detail) ||
            !('message' in detail) ||
            typeof detail.field !== 'string' ||
            typeof detail.message !== 'string'
        ) {
            return validationDetails;
        }

        validationDetails.push({
            field: detail.field,
            message: detail.message,
        });

        return validationDetails;
    }, []);
};

const getBackendFieldErrors = (details: unknown): AppointmentBookingFormFieldErrors => {
    return getBackendValidationDetails(details).reduce<AppointmentBookingFormFieldErrors>(
        (errors, detail) => {
            const field = validationFieldMap[detail.field];

            if (field) {
                errors[field] = detail.message;
            }

            return errors;
        },
        {}
    );
};

const getReferenceLoadErrorState = (error: unknown): AppointmentReferenceState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            doctors: [],
            patients: [],
            error: {
                title: 'Appointment data could not be loaded',
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        doctors: [],
        patients: [],
        error: {
            title: 'Appointment data could not be loaded',
            message: 'Doctors and patients could not be loaded. Please try again.',
            code: 'APPOINTMENT_REFERENCE_LOAD_FAILED',
        },
    };
};

const formatAppointmentDateTime = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

function AppointmentsPage() {
    const { clinicId } = useActiveClinic();
    const [values, setValues] = useState<AppointmentBookingFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<AppointmentBookingFormFieldErrors>({});
    const [referenceState, setReferenceState] =
        useState<AppointmentReferenceState>(emptyReferenceState);
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorTitle, setFormErrorTitle] = useState('Appointment was not booked');
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [successState, setSuccessState] = useState<SuccessState | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadAppointmentReferences = useCallback(
        async (signal?: AbortSignal) => {
            const [doctorData, patientData] = await Promise.all([
                listDoctors(clinicId, signal),
                listPatients(clinicId, signal),
            ]);

            return {
                doctors: doctorData.doctors.filter(isActiveDoctor),
                patients: patientData.patients.filter(isActivePatient),
            };
        },
        [clinicId]
    );

    const handleRetryReferences = () => {
        setReferenceState((currentState) => ({
            status: 'loading',
            doctors: currentState.doctors,
            patients: currentState.patients,
            error: null,
        }));

        void loadAppointmentReferences()
            .then((data) => {
                setReferenceState({
                    status: 'success',
                    doctors: data.doctors,
                    patients: data.patients,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getReferenceLoadErrorState(error);

                if (errorState) {
                    setReferenceState(errorState);
                }
            });
    };

    useEffect(() => {
        const abortController = new AbortController();

        void loadAppointmentReferences(abortController.signal)
            .then((data) => {
                setReferenceState({
                    status: 'success',
                    doctors: data.doctors,
                    patients: data.patients,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getReferenceLoadErrorState(error);

                if (errorState) {
                    setReferenceState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadAppointmentReferences]);

    const handleChange = (field: keyof AppointmentBookingFormValues, value: string) => {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
        setFieldErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }));
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setSuccessState(null);
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validateAppointmentForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorTitle('Appointment was not booked');
        setFormErrorCode(undefined);
        setFormErrorDetails([]);
        setSuccessState(null);

        if (Object.keys(nextFieldErrors).length > 0 || referenceState.status !== 'success') {
            return;
        }

        setIsSubmitting(true);

        try {
            const data = await createAppointment(clinicId, toCreateAppointmentRequest(values));

            setValues(emptyFormValues);
            setFieldErrors({});
            setSuccessState({
                message: 'Appointment booked successfully.',
                scheduledAt: data.appointment.scheduledAt,
                riskLevel: data.noShowPrediction?.riskLevel,
            });
        } catch (error) {
            if (isApiClientError(error)) {
                setFieldErrors(getBackendFieldErrors(error.details));
                setFormError(error.message);
                setFormErrorTitle(
                    error.code === 'APPOINTMENT_SLOT_CONFLICT'
                        ? 'Doctor already has an appointment at this time'
                        : 'Appointment was not booked'
                );
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                return;
            }

            setFormError('Appointment could not be booked. Please try again.');
            setFormErrorCode('APPOINTMENT_CREATE_FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canUseForm =
        referenceState.status === 'success' &&
        referenceState.doctors.length > 0 &&
        referenceState.patients.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Appointments
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Book appointment</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        Select an active doctor and patient, choose the appointment time, and book
                        it into the clinic flow.
                    </p>
                </div>
            </div>

            {referenceState.status === 'loading' ? (
                <LoadingState message="Loading doctors and patients..." />
            ) : null}

            {referenceState.status === 'error' ? (
                <ErrorMessage
                    title={referenceState.error.title}
                    message={referenceState.error.message}
                    code={referenceState.error.code}
                    onRetry={handleRetryReferences}
                />
            ) : null}

            {referenceState.status === 'success' && referenceState.doctors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        No active doctors available
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        Add or activate a doctor before booking appointments for this clinic.
                    </p>
                    <Link
                        to="/doctors/new"
                        className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Add doctor
                    </Link>
                </div>
            ) : null}

            {referenceState.status === 'success' && referenceState.patients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        No active patients available
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        Add a patient record before booking appointments for this clinic.
                    </p>
                    <Link
                        to="/patients/new"
                        className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Add patient
                    </Link>
                </div>
            ) : null}

            {successState ? (
                <div
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                    role="status"
                >
                    <p className="font-semibold">{successState.message}</p>
                    <p className="mt-1">
                        Scheduled for {formatAppointmentDateTime(successState.scheduledAt)}
                        {successState.riskLevel
                            ? ` with ${successState.riskLevel.toLowerCase()} no-show risk.`
                            : '.'}
                    </p>
                </div>
            ) : null}

            {formError ? (
                <ErrorMessage
                    title={formErrorTitle}
                    message={formError}
                    code={formErrorCode}
                    details={formErrorDetails}
                />
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
                <AppointmentBookingForm
                    values={values}
                    fieldErrors={fieldErrors}
                    doctors={referenceState.doctors}
                    patients={referenceState.patients}
                    isSubmitting={isSubmitting}
                    isDisabled={!canUseForm}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                />
            </div>
        </section>
    );
}

export default AppointmentsPage;
