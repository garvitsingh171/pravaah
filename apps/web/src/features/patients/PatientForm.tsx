import { useLayoutEffect, useRef, type FormEvent } from 'react';
import { FieldError } from '../../components/feedback';
import { Button, FormSection, fieldControlClassName } from '../../components/ui';
import { Gender } from '../../types';

export type PatientFormValues = {
    fullName: string;
    phone: string;
    email: string;
    gender: '' | Gender;
    dateOfBirth: string;
    age: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    notes: string;
};

export type PatientFormFieldErrors = Partial<Record<keyof PatientFormValues, string>>;

type PatientFormProps = {
    values: PatientFormValues;
    fieldErrors: PatientFormFieldErrors;
    submitLabel: string;
    submitLoadingText?: string;
    isSubmitting: boolean;
    saveHint?: string;
    onChange: (field: keyof PatientFormValues, value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
};

const fieldBaseClass = fieldControlClassName;

const getFieldClassName = (hasError: boolean): string => {
    return `${fieldBaseClass} ${
        hasError ? 'border-[var(--color-status-danger-border)]' : ''
    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`;
};

const getErrorId = (field: keyof PatientFormValues) => `patient-${field}-error`;
const getLabelId = (field: keyof PatientFormValues) => `patient-${field}-label`;

const getErrorAttributes = (field: keyof PatientFormValues, errors: PatientFormFieldErrors) => ({
    'aria-invalid': Boolean(errors[field]) as boolean,
    'aria-labelledby': getLabelId(field),
    'aria-describedby': errors[field] ? getErrorId(field) : undefined,
});

function RequiredMark() {
    return <span className="text-[var(--color-status-danger-text)]">*</span>;
}

function PatientForm({
    values,
    fieldErrors,
    submitLabel,
    submitLoadingText = 'Saving patient...',
    isSubmitting,
    saveHint,
    onChange,
    onSubmit,
    onCancel,
}: PatientFormProps) {
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

    return (
        <form ref={formRef} className="space-y-6" noValidate onSubmit={handleSubmit}>
            <FormSection
                title="Identity"
                description="These fields identify the patient record used for booking and queue workflows."
            >
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    <span id={getLabelId('fullName')}>
                        Full name <RequiredMark />
                    </span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.fullName))}
                        value={values.fullName}
                        onChange={(event) => onChange('fullName', event.target.value)}
                        {...getErrorAttributes('fullName', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="name"
                        required
                    />
                    <FieldError id={getErrorId('fullName')} message={fieldErrors.fullName} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('phone')}>
                        Phone <RequiredMark />
                    </span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.phone))}
                        value={values.phone}
                        onChange={(event) => onChange('phone', event.target.value)}
                        {...getErrorAttributes('phone', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="tel"
                        required
                    />
                    <FieldError id={getErrorId('phone')} message={fieldErrors.phone} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('email')}>Email</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.email))}
                        value={values.email}
                        onChange={(event) => onChange('email', event.target.value)}
                        {...getErrorAttributes('email', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="email"
                        inputMode="email"
                    />
                    <FieldError id={getErrorId('email')} message={fieldErrors.email} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('gender')}>Gender</span>
                    <select
                        className={getFieldClassName(Boolean(fieldErrors.gender))}
                        value={values.gender}
                        onChange={(event) => onChange('gender', event.target.value)}
                        {...getErrorAttributes('gender', fieldErrors)}
                        disabled={isSubmitting}
                    >
                        <option value="">Not specified</option>
                        <option value={Gender.MALE}>Male</option>
                        <option value={Gender.FEMALE}>Female</option>
                        <option value={Gender.OTHER}>Other</option>
                        <option value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</option>
                    </select>
                    <FieldError id={getErrorId('gender')} message={fieldErrors.gender} />
                </label>
            </FormSection>

            <FormSection title="Demographics" description="Age or date of birth is optional.">
                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('dateOfBirth')}>Date of birth</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.dateOfBirth))}
                        value={values.dateOfBirth}
                        onChange={(event) => onChange('dateOfBirth', event.target.value)}
                        {...getErrorAttributes('dateOfBirth', fieldErrors)}
                        disabled={isSubmitting}
                        type="date"
                    />
                    <FieldError id={getErrorId('dateOfBirth')} message={fieldErrors.dateOfBirth} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('age')}>Age</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.age))}
                        value={values.age}
                        onChange={(event) => onChange('age', event.target.value)}
                        {...getErrorAttributes('age', fieldErrors)}
                        disabled={isSubmitting}
                        inputMode="numeric"
                    />
                    <FieldError id={getErrorId('age')} message={fieldErrors.age} />
                </label>
            </FormSection>

            <FormSection
                title="Location"
                description="Residential location is optional and can be completed later."
            >
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    <span id={getLabelId('addressLine1')}>Address line 1</span>
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.addressLine1))}
                        value={values.addressLine1}
                        onChange={(event) => onChange('addressLine1', event.target.value)}
                        {...getErrorAttributes('addressLine1', fieldErrors)}
                        disabled={isSubmitting}
                        rows={2}
                        autoComplete="address-line1"
                    />
                    <FieldError
                        id={getErrorId('addressLine1')}
                        message={fieldErrors.addressLine1}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    <span id={getLabelId('addressLine2')}>Address line 2</span>
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.addressLine2))}
                        value={values.addressLine2}
                        onChange={(event) => onChange('addressLine2', event.target.value)}
                        {...getErrorAttributes('addressLine2', fieldErrors)}
                        disabled={isSubmitting}
                        rows={2}
                        autoComplete="address-line2"
                    />
                    <FieldError
                        id={getErrorId('addressLine2')}
                        message={fieldErrors.addressLine2}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('city')}>City</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.city))}
                        value={values.city}
                        onChange={(event) => onChange('city', event.target.value)}
                        {...getErrorAttributes('city', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="address-level2"
                    />
                    <FieldError id={getErrorId('city')} message={fieldErrors.city} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('state')}>State</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.state))}
                        value={values.state}
                        onChange={(event) => onChange('state', event.target.value)}
                        {...getErrorAttributes('state', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="address-level1"
                    />
                    <FieldError id={getErrorId('state')} message={fieldErrors.state} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('pincode')}>Pincode</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.pincode))}
                        value={values.pincode}
                        onChange={(event) => onChange('pincode', event.target.value)}
                        {...getErrorAttributes('pincode', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="postal-code"
                        inputMode="numeric"
                    />
                    <FieldError id={getErrorId('pincode')} message={fieldErrors.pincode} />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('country')}>Country</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.country))}
                        value={values.country}
                        onChange={(event) => onChange('country', event.target.value)}
                        {...getErrorAttributes('country', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="country-name"
                    />
                    <FieldError id={getErrorId('country')} message={fieldErrors.country} />
                </label>
            </FormSection>

            <FormSection
                title="Clinic Details"
                description="Travel estimates are calculated from verified patient and clinic locations."
            >
                <p className="text-sm text-slate-600">
                    Travel distance and estimated drive time will appear after the patient and
                    clinic locations are verified.
                </p>
            </FormSection>

            <FormSection title="Emergency Contact">
                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('emergencyContactName')}>Emergency contact name</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.emergencyContactName))}
                        value={values.emergencyContactName}
                        onChange={(event) => onChange('emergencyContactName', event.target.value)}
                        {...getErrorAttributes('emergencyContactName', fieldErrors)}
                        disabled={isSubmitting}
                    />
                    <FieldError
                        id={getErrorId('emergencyContactName')}
                        message={fieldErrors.emergencyContactName}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                    <span id={getLabelId('emergencyContactPhone')}>Emergency contact phone</span>
                    <input
                        className={getFieldClassName(Boolean(fieldErrors.emergencyContactPhone))}
                        value={values.emergencyContactPhone}
                        onChange={(event) => onChange('emergencyContactPhone', event.target.value)}
                        {...getErrorAttributes('emergencyContactPhone', fieldErrors)}
                        disabled={isSubmitting}
                        autoComplete="tel"
                    />
                    <FieldError
                        id={getErrorId('emergencyContactPhone')}
                        message={fieldErrors.emergencyContactPhone}
                    />
                </label>
            </FormSection>

            <FormSection title="Notes">
                <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                    <span id={getLabelId('notes')}>Notes</span>
                    <textarea
                        className={getFieldClassName(Boolean(fieldErrors.notes))}
                        value={values.notes}
                        onChange={(event) => onChange('notes', event.target.value)}
                        {...getErrorAttributes('notes', fieldErrors)}
                        disabled={isSubmitting}
                        rows={3}
                    />
                    <FieldError id={getErrorId('notes')} message={fieldErrors.notes} />
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

export default PatientForm;
