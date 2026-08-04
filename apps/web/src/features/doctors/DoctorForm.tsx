import type { FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Button, FormSection, fieldControlClassName } from '../../components/ui';
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
    submitLoadingText?: string;
    isSubmitting: boolean;
    saveHint?: string;
    onChange: (field: keyof DoctorFormValues, value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

const fieldBaseClass = fieldControlClassName;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-[var(--color-status-danger-border)]' : ''
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

function RequiredMark() {
    return <span className="text-[var(--color-status-danger-text)]">*</span>;
}

function DoctorForm({
    values,
    fieldErrors,
    submitLabel,
    submitLoadingText = 'Saving doctor...',
    isSubmitting,
    saveHint,
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
            <FormSection
                title="Identity"
                description="These fields identify the doctor record used by clinic staff."
            >
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
            </FormSection>

            <FormSection
                title="Contact and Profile"
                description="Optional details can be added now or completed later."
            >
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
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                {saveHint ? <p className="text-sm text-slate-500">{saveHint}</p> : <span />}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        loadingText={submitLoadingText}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default DoctorForm;
