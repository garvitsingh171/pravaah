import type { ReactNode } from 'react';
import { Badge, Button, ProfileDialog } from '../../components/ui';
import type { PatientSummary } from '../../types';

type Props = {
    patient: PatientSummary;
    isEditing: boolean;
    isRetryingGeocoding: boolean;
    isRetryingRouting: boolean;
    editContent: ReactNode;
    onEdit: () => void;
    onClose: () => void;
    onRetryGeocoding: () => void;
    onRetryRouting: () => void;
};

const optional = (value: string | null | undefined) => value?.trim() || 'Not added';
const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'P';
const displayDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not added'
        : new Intl.DateTimeFormat('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          }).format(date);
};
const displayAge = (patient: PatientSummary) =>
    patient.age != null
        ? `${patient.age} years`
        : patient.dateOfBirth
          ? displayDate(patient.dateOfBirth)
          : 'Not added';

export default function PatientProfileDialog({
    patient,
    isEditing,
    isRetryingGeocoding,
    isRetryingRouting,
    editContent,
    onEdit,
    onClose,
    onRetryGeocoding,
    onRetryRouting,
}: Props) {
    const address =
        [
            patient.addressLine1,
            patient.addressLine2,
            patient.city,
            patient.state,
            patient.pincode,
            patient.country,
        ]
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value))
            .join(', ') || optional(patient.address);
    const active = patient.isActive && patient.clinicLinkIsActive !== false;
    const geocoding =
        patient.geocodingStatus === 'GEOCODED'
            ? { label: 'Location found', tone: 'success' as const }
            : patient.geocodingStatus === 'FAILED'
              ? { label: 'Location lookup failed', tone: 'danger' as const }
              : { label: 'Location not looked up', tone: 'neutral' as const };

    return (
        <ProfileDialog
            title={patient.fullName}
            description={`${displayAge(patient)} · ${patient.gender?.replaceAll('_', ' ') ?? 'Gender not added'} · ${active ? 'Active' : 'Inactive'}`}
            initials={initials(patient.fullName)}
            isEditing={isEditing}
            onEdit={onEdit}
            onClose={onClose}
        >
            {isEditing ? (
                editContent
            ) : (
                <div className="grid gap-6 text-sm sm:grid-cols-2">
                    <section className="sm:col-span-2">
                        <h3 className="font-semibold text-slate-900">Contact and address</h3>
                        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-slate-500">Phone</dt>
                                <dd className="mt-1 break-words text-slate-900">{patient.phone}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Email</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(patient.email)}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-slate-500">Residential address</dt>
                                <dd className="mt-1 break-words text-slate-900">{address}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Emergency contact</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(patient.emergencyContactName)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Emergency number</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(patient.emergencyContactPhone)}
                                </dd>
                            </div>
                        </dl>
                    </section>
                    <section className="sm:col-span-2 border-t border-slate-200 pt-5">
                        <h3 className="font-semibold text-slate-900">Clinic history</h3>
                        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-slate-500">Appointments</dt>
                                <dd className="mt-1 text-slate-900">
                                    {patient.totalAppointments ?? 0}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Completed visits</dt>
                                <dd className="mt-1 text-slate-900">
                                    {patient.totalCompletedVisits ?? 0}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">No-shows</dt>
                                <dd className="mt-1 text-slate-900">{patient.totalNoShows ?? 0}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Late arrivals</dt>
                                <dd className="mt-1 text-slate-900">
                                    {patient.totalLateArrivals ?? 0}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Last completed visit</dt>
                                <dd className="mt-1 text-slate-900">
                                    {patient.lastVisitAt
                                        ? displayDate(patient.lastVisitAt)
                                        : 'No completed visits yet'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Clinic link</dt>
                                <dd className="mt-1 text-slate-900">
                                    {patient.clinicLinkIsActive === false ? 'Inactive' : 'Active'}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-slate-500">Clinic notes</dt>
                                <dd className="mt-1 whitespace-pre-wrap break-words text-slate-900">
                                    {optional(patient.notes)}
                                </dd>
                            </div>
                        </dl>
                    </section>
                    <section className="sm:col-span-2 border-t border-slate-200 pt-5">
                        <h3 className="font-semibold text-slate-900">Location and travel</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge tone={geocoding.tone}>{geocoding.label}</Badge>
                            <span className="text-slate-600">
                                {patient.routingStatus === 'CALCULATED'
                                    ? `Routing calculated · Verified current road distance: ${patient.distanceFromClinicKm ?? 'Not available'} km · ${patient.estimatedTravelTimeMinutes ?? 'Not available'} min drive`
                                    : patient.routingStatus === 'FAILED'
                                      ? 'Routing failed · Travel estimate unavailable'
                                      : 'Routing not calculated · Travel estimate not calculated'}
                            </span>
                        </div>
                        {patient.geocodedAddress ? (
                            <p className="mt-2 break-words text-sm text-slate-600">
                                Matched location: {patient.geocodedAddress}
                                {patient.geocodingProvider ? ` · ${patient.geocodingProvider}` : ''}
                                {patient.geocodingConfidence != null
                                    ? ` · ${Math.round(patient.geocodingConfidence * 100)}% match confidence`
                                    : ''}
                            </p>
                        ) : null}
                        {patient.routingStatus !== 'CALCULATED' &&
                        patient.distanceFromClinicKm != null ? (
                            <p className="mt-2 text-sm text-slate-500">
                                Historical distance (unverified): {patient.distanceFromClinicKm} km
                            </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {patient.geocodingStatus === 'FAILED' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    isLoading={isRetryingGeocoding}
                                    loadingText="Retrying..."
                                    onClick={onRetryGeocoding}
                                >
                                    Retry location lookup
                                </Button>
                            ) : null}
                            {patient.routingStatus !== 'CALCULATED' &&
                            patient.geocodingStatus === 'GEOCODED' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    isLoading={isRetryingRouting}
                                    loadingText="Calculating..."
                                    onClick={onRetryRouting}
                                >
                                    {patient.routingStatus === 'FAILED'
                                        ? 'Retry travel estimate'
                                        : 'Calculate travel estimate'}
                                </Button>
                            ) : null}
                        </div>
                    </section>
                </div>
            )}
        </ProfileDialog>
    );
}
