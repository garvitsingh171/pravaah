import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import type { DoctorSummary } from '../../types';
import { listDoctors } from './doctorApi';

type DoctorsLocationState = {
    statusMessage?: string;
};

type DoctorListState =
    | {
          status: 'loading';
          doctors: DoctorSummary[];
          error: null;
      }
    | {
          status: 'success';
          doctors: DoctorSummary[];
          error: null;
      }
    | {
          status: 'error';
          doctors: DoctorSummary[];
          error: {
              message: string;
              code?: string;
          };
      };

const emptyDoctorListState: DoctorListState = {
    status: 'loading',
    doctors: [],
    error: null,
};

const getOptionalText = (value: string | null | undefined): string => {
    return value?.trim() || 'Not added';
};

const getDoctorStatusLabel = (doctor: DoctorSummary): string => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false ? 'Active' : 'Inactive';
};

const getDoctorStatusClassName = (doctor: DoctorSummary): string => {
    return doctor.isActive && doctor.clinicLinkIsActive !== false
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';
};

const getDoctorListErrorState = (error: unknown): DoctorListState | null => {
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
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        doctors: [],
        error: {
            message: 'Doctors could not be loaded. Please try again.',
            code: 'DOCTOR_LIST_FAILED',
        },
    };
};

function DoctorsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicId } = useActiveClinic();
    const locationState = location.state as DoctorsLocationState | null;
    const [statusMessage, setStatusMessage] = useState(locationState?.statusMessage ?? null);
    const [doctorListState, setDoctorListState] = useState<DoctorListState>(emptyDoctorListState);

    const loadDoctors = useCallback((signal?: AbortSignal) => listDoctors(clinicId, signal), [clinicId]);

    const handleRetry = () => {
        setDoctorListState((currentState) => ({
            status: 'loading',
            doctors: currentState.doctors,
            error: null,
        }));

        void loadDoctors()
            .then((data) => {
                setDoctorListState({
                    status: 'success',
                    doctors: data.doctors,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getDoctorListErrorState(error);

                if (errorState) {
                    setDoctorListState(errorState);
                }
            });
    };

    useEffect(() => {
        const abortController = new AbortController();

        void loadDoctors(abortController.signal)
            .then((data) => {
                setDoctorListState({
                    status: 'success',
                    doctors: data.doctors,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getDoctorListErrorState(error);

                if (errorState) {
                    setDoctorListState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadDoctors]);

    useEffect(() => {
        if (locationState?.statusMessage) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, locationState?.statusMessage, navigate]);

    const hasDoctors = doctorListState.status === 'success' && doctorListState.doctors.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Doctors
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Doctors</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        View clinic doctor records before booking appointments or managing the daily
                        clinic flow.
                    </p>
                </div>

                <Link
                    to="/doctors/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                    Add doctor
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

            {doctorListState.status === 'loading' ? (
                <LoadingState message="Loading doctors..." />
            ) : null}

            {doctorListState.status === 'error' ? (
                <ErrorMessage
                    title="Doctors could not be loaded"
                    message={doctorListState.error.message}
                    code={doctorListState.error.code}
                    onRetry={handleRetry}
                />
            ) : null}

            {doctorListState.status === 'success' && doctorListState.doctors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">No doctors yet</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        Add the first doctor record for this clinic so staff can use it during
                        appointment booking and queue workflows.
                    </p>
                    <Link
                        to="/doctors/new"
                        className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Add doctor
                    </Link>
                </div>
            ) : null}

            {hasDoctors ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Doctor</th>
                                    <th className="px-4 py-3 font-semibold">Qualification</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Experience</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {doctorListState.doctors.map((doctor) => (
                                    <tr key={doctor.id} className="align-top">
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">
                                                {doctor.fullName}
                                            </p>
                                            <p className="mt-1 text-slate-600">
                                                {getOptionalText(doctor.specialization)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            <p>{getOptionalText(doctor.qualification)}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Reg. {getOptionalText(doctor.registrationNumber)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            <p>{getOptionalText(doctor.phone)}</p>
                                            <p className="mt-1 text-slate-500">
                                                {getOptionalText(doctor.email)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-slate-700">
                                            {doctor.experienceYears ?? 'Not added'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getDoctorStatusClassName(
                                                    doctor
                                                )}`}
                                            >
                                                {getDoctorStatusLabel(doctor)}
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

export default DoctorsPage;
