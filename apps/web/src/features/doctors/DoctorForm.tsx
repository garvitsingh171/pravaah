import type { FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Gender } from '../../types';

export type DoctorFormValues = {
    fullName: string;
    specialization: string;
    qualification: string;
    registrationNumber: string;
    phone: string;
    email: string;
    gender: '' | Gender;
    experienceYears: string;
};

export type DoctorFormFieldErrors = Partial<Record<keyof DoctorFormValues, string>>;

type DoctorFormProps = {
    values: DoctorFormValues;
    fieldErrors: DoctorFormFieldErrors;
    submitLabel: string;
    isSubmitting: boolean;
    onChange: (field: keyof DoctorFormValues, value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

const fieldBaseClass =
    'mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-red-300' : 'border-slate-300'
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

function RequiredMark() {
    return <span className="text-red-600">*</span>;
}

function DoctorForm({
    values,
    fieldErrors,
    submitLabel,
    isSubmitting,
    onChange,
    onSubmit,
    onCancel,
}: DoctorFormProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Full name <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.fullName))}
                        value={values.fullName}
                        onChange={(event) => onChange('fullName', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="name"
                        aria-invalid={Boolean(fieldErrors.fullName)}
                    />
                    <FieldError message={fieldErrors.fullName} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Specialization
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.specialization))}
                        value={values.specialization}
                        onChange={(event) => onChange('specialization', event.target.value)}
                        disabled={isSubmitting}
                        placeholder="General Medicine"
                    />
                    <FieldError message={fieldErrors.specialization} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Qualification
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.qualification))}
                        value={values.qualification}
                        onChange={(event) => onChange('qualification', event.target.value)}
                        disabled={isSubmitting}
                        placeholder="MBBS, MD"
                    />
                    <FieldError message={fieldErrors.qualification} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Registration number
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.registrationNumber))}
                        value={values.registrationNumber}
                        onChange={(event) => onChange('registrationNumber', event.target.value)}
                        disabled={isSubmitting}
                    />
                    <FieldError message={fieldErrors.registrationNumber} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Phone
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.phone))}
                        value={values.phone}
                        onChange={(event) => onChange('phone', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="tel"
                    />
                    <FieldError message={fieldErrors.phone} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Email
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.email))}
                        value={values.email}
                        onChange={(event) => onChange('email', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="email"
                        inputMode="email"
                    />
                    <FieldError message={fieldErrors.email} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Gender
                    <select
                        className={getFieldClassName(Boolean(fieldErrors.gender))}
                        value={values.gender}
                        onChange={(event) => onChange('gender', event.target.value)}
                        disabled={isSubmitting}
                    >
                        <option value="">Not specified</option>
                        <option value={Gender.MALE}>Male</option>
                        <option value={Gender.FEMALE}>Female</option>
                        <option value={Gender.OTHER}>Other</option>
                    </select>
                    <FieldError message={fieldErrors.gender} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Experience years
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.experienceYears))}
                        value={values.experienceYears}
                        onChange={(event) => onChange('experienceYears', event.target.value)}
                        disabled={isSubmitting}
                        inputMode="numeric"
                    />
                    <FieldError message={fieldErrors.experienceYears} />
                </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving doctor...' : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default DoctorForm;
