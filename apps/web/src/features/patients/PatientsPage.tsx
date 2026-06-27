import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import type { Gender, PatientSummary } from '../../types';
import { listPatients } from './patientApi';

type PatientsLocationState = {
    statusMessage?: string;
};

type PatientListState =
    | {
          status: 'loading';
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'success';
          patients: PatientSummary[];
          error: null;
      }
    | {
          status: 'error';
          patients: PatientSummary[];
          error: {
              message: string;
              code?: string;
          };
      };

const emptyPatientListState: PatientListState = {
    status: 'loading',
    patients: [],
    error: null,
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getGenderLabel = (gender: Gender | null | undefined): string => {
    if (!gender) {
        return 'Not added';
    }

    const labels: Record<Gender, string> = {
        MALE: 'Male',
        FEMALE: 'Female',
        OTHER: 'Other',
        PREFER_NOT_TO_SAY: 'Prefer not to say',
    };

    return labels[gender];
};

const formatDate = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Not added';
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const getAgeOrDateOfBirthLabel = (patient: PatientSummary): string => {
    if (patient.age !== undefined && patient.age !== null) {
        return `${patient.age} years`;
    }

    if (patient.dateOfBirth) {
        return formatDate(patient.dateOfBirth);
    }

    return 'Not added';
};

const getPatientStatusLabel = (patient: PatientSummary): string => {
    return patient.isActive && patient.clinicLinkIsActive !== false ? 'Active' : 'Inactive';
};

const getPatientStatusClassName = (patient: PatientSummary): string => {
    return patient.isActive && patient.clinicLinkIsActive !== false
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
};

const getVisitSummary = (patient: PatientSummary): string => {
    const totalAppointments = patient.totalAppointments ?? 0;
    const totalNoShows = patient.totalNoShows ?? 0;
    const totalLateArrivals = patient.totalLateArrivals ?? 0;

    return `${totalAppointments} appointments, ${totalNoShows} no-shows, ${totalLateArrivals} late`;
};

function PatientsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const locationState = location.state as PatientsLocationState | null;
    const [statusMessage, setStatusMessage] = useState(locationState?.statusMessage ?? null);
    const [patientListState, setPatientListState] =
        useState<PatientListState>(emptyPatientListState);

    const loadPatients = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await listPatients(clinicId, signal);

                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                if (isApiClientError(error)) {
                    if (error.code === 'API_REQUEST_ABORTED') {
                        return;
                    }

                    setPatientListState({
                        status: 'error',
                        patients: [],
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setPatientListState({
                    status: 'error',
                    patients: [],
                    error: {
                        message: 'Patients could not be loaded. Please try again.',
                        code: 'PATIENT_LIST_FAILED',
                    },
                });
            }
        },
        [clinicId]
    );

    const handleRetry = () => {
        setPatientListState((currentState) => ({
            status: 'loading',
            patients: currentState.patients,
            error: null,
        }));

        void loadPatients();
    };

    useEffect(() => {
        const abortController = new AbortController();

        listPatients(clinicId, abortController.signal)
            .then((data) => {
                setPatientListState({
                    status: 'success',
                    patients: data.patients,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === 'AbortError') {
                    return;
                }

                if (isApiClientError(error)) {
                    if (error.code === 'API_REQUEST_ABORTED') {
                        return;
                    }

                    setPatientListState({
                        status: 'error',
                        patients: [],
                        error: {
                            message: error.message,
                            code: error.code,
                        },
                    });
                    return;
                }

                setPatientListState({
                    status: 'error',
                    patients: [],
                    error: {
                        message: 'Patients could not be loaded. Please try again.',
                        code: 'PATIENT_LIST_FAILED',
                    },
                });
            });

        return () => {
            abortController.abort();
        };
    }, [clinicId]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate]);

    const hasPatients =
        patientListState.status === 'success' && patientListState.patients.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Patients
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Patients</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        Find or create patient records before booking appointments and managing the
                        clinic queue.
                    </p>
                </div>

                <Link
                    to="/patients/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Add patient
                </Link>
            </div>

            {statusMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {statusMessage}
                    <button
                        type="button"
                        className="ml-3 text-emerald-700 underline decoration-emerald-300 underline-offset-2"
                        onClick={() => setStatusMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {patientListState.status === 'loading' ? (
                <LoadingState message="Loading patients..." />
            ) : null}

            {patientListState.status === 'error' ? (
                <ErrorMessage
                    title="Patients could not be loaded"
                    message={patientListState.error.message}
                    code={patientListState.error.code}
                    onRetry={handleRetry}
                />
            ) : null}

            {patientListState.status === 'success' && patientListState.patients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">No patients yet</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        Add the first patient record for this clinic so staff can book appointments
                        and keep the daily flow moving.
                    </p>
                    <Link
                        to="/patients/new"
                        className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Add patient
                    </Link>
                </div>
            ) : null}

            {hasPatients ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Patient</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Details</th>
                                    <th className="px-4 py-3 font-semibold">Clinic history</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {patientListState.patients.map((patient) => (
                                    <tr key={patient.id} className="align-top">
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">
                                                {patient.fullName}
                                            </p>
                                            <p className="mt-1 text-slate-600">
                                                {getGenderLabel(patient.gender)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            <p>{patient.phone}</p>
                                            <p className="mt-1 text-slate-500">
                                                {getOptionalText(patient.email)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            <p>{getAgeOrDateOfBirthLabel(patient)}</p>
                                            <p className="mt-1 text-slate-500">
                                                {getOptionalText(patient.city)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            <p>{getVisitSummary(patient)}</p>
                                            <p className="mt-1 text-slate-500">
                                                Last visit:{' '}
                                                {patient.lastVisitAt
                                                    ? formatDate(patient.lastVisitAt)
                                                    : 'Not added'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPatientStatusClassName(
                                                    patient
                                                )}`}
                                            >
                                                {getPatientStatusLabel(patient)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default PatientsPage;
