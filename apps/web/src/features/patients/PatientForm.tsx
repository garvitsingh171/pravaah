import type { FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Gender } from '../../types';

export type PatientFormValues = {
    fullName: string;
    phone: string;
    email: string;
    gender: '' | Gender;
    dateOfBirth: string;
    age: string;
    address: string;
    city: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    distanceFromClinicKm: string;
    notes: string;
};

export type PatientFormFieldErrors = Partial<Record<keyof PatientFormValues, string>>;

type PatientFormProps = {
    values: PatientFormValues;
    fieldErrors: PatientFormFieldErrors;
    submitLabel: string;
    isSubmitting: boolean;
    onChange: (field: keyof PatientFormValues, value: string) => void;
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

function PatientForm({
    values,
    fieldErrors,
    submitLabel,
    isSubmitting,
    onChange,
    onSubmit,
    onCancel,
}: PatientFormProps) {
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
                    Phone <RequiredMark />
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.phone))}
                        value={values.phone}
                        onChange={(event) => onChange('phone', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="tel"
                        aria-invalid={Boolean(fieldErrors.phone)}
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
                        <option value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</option>
                    </select>
                    <FieldError message={fieldErrors.gender} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Date of birth
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.dateOfBirth))}
                        value={values.dateOfBirth}
                        onChange={(event) => onChange('dateOfBirth', event.target.value)}
                        disabled={isSubmitting}
                        type="date"
                    />
                    <FieldError message={fieldErrors.dateOfBirth} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Age
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.age))}
                        value={values.age}
                        onChange={(event) => onChange('age', event.target.value)}
                        disabled={isSubmitting}
                        inputMode="numeric"
                    />
                    <FieldError message={fieldErrors.age} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    City
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.city))}
                        value={values.city}
                        onChange={(event) => onChange('city', event.target.value)}
                        disabled={isSubmitting}
                    />
                    <FieldError message={fieldErrors.city} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Distance from clinic (km)
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.distanceFromClinicKm))}
                        value={values.distanceFromClinicKm}
                        onChange={(event) => onChange('distanceFromClinicKm', event.target.value)}
                        disabled={isSubmitting}
                        inputMode="decimal"
                    />
                    <FieldError message={fieldErrors.distanceFromClinicKm} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Emergency contact name
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.emergencyContactName))}
                        value={values.emergencyContactName}
                        onChange={(event) => onChange('emergencyContactName', event.target.value)}
                        disabled={isSubmitting}
                    />
                    <FieldError message={fieldErrors.emergencyContactName} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    Emergency contact phone
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.emergencyContactPhone))}
                        value={values.emergencyContactPhone}
                        onChange={(event) => onChange('emergencyContactPhone', event.target.value)}
                        disabled={isSubmitting}
                        autoComplete="tel"
                    />
                    <FieldError message={fieldErrors.emergencyContactPhone} />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Address
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.address))}
                        value={values.address}
                        onChange={(event) => onChange('address', event.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                    />
                    <FieldError message={fieldErrors.address} />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    Notes
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.notes))}
                        value={values.notes}
                        onChange={(event) => onChange('notes', event.target.value)}
                        disabled={isSubmitting}
                        rows={3}
                    />
                    <FieldError message={fieldErrors.notes} />
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
                    {isSubmitting ? 'Saving patient...' : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default PatientForm;
