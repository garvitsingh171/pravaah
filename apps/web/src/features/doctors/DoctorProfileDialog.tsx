import type { ReactNode } from 'react';
import { ProfileDialog } from '../../components/ui';
import type { DoctorSummary } from '../../types';

const optional = (value: string | null | undefined) => value?.trim() || 'Not added';
const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'D';

export default function DoctorProfileDialog({
    doctor,
    isEditing,
    editContent,
    onEdit,
    onClose,
}: {
    doctor: DoctorSummary;
    isEditing: boolean;
    editContent: ReactNode;
    onEdit: () => void;
    onClose: () => void;
}) {
    const active = doctor.isActive && doctor.clinicLinkIsActive !== false;
    const gender = doctor.gender?.replaceAll('_', ' ') ?? 'Not added';

    return (
        <ProfileDialog
            title={doctor.fullName}
            description={`${optional(doctor.specialization)} · ${active ? 'Active' : 'Inactive'}`}
            initials={initials(doctor.fullName)}
            isEditing={isEditing}
            onEdit={onEdit}
            onClose={onClose}
        >
            {isEditing ? (
                editContent
            ) : (
                <div className="grid gap-6 text-sm sm:grid-cols-2">
                    <section>
                        <h3 className="font-semibold text-slate-900">Professional profile</h3>
                        <dl className="mt-3 grid gap-4">
                            <div>
                                <dt className="text-slate-500">Specialization</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(doctor.specialization)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Qualification</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(doctor.qualification)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Registration number</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(doctor.registrationNumber)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Gender</dt>
                                <dd className="mt-1 text-slate-900">{gender}</dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Experience</dt>
                                <dd className="mt-1 text-slate-900">
                                    {doctor.experienceYears ?? 'Not added'} years
                                </dd>
                            </div>
                        </dl>
                    </section>
                    <section>
                        <h3 className="font-semibold text-slate-900">
                            Contact and clinic relationship
                        </h3>
                        <dl className="mt-3 grid gap-4">
                            <div>
                                <dt className="text-slate-500">Phone</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(doctor.phone)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Email</dt>
                                <dd className="mt-1 break-words text-slate-900">
                                    {optional(doctor.email)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Doctor profile status</dt>
                                <dd className="mt-1 text-slate-900">
                                    {doctor.isActive ? 'Active' : 'Inactive'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Clinic link status</dt>
                                <dd className="mt-1 text-slate-900">
                                    {doctor.clinicLinkIsActive === false ? 'Inactive' : 'Active'}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            )}
        </ProfileDialog>
    );
}
