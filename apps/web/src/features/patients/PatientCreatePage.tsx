import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, useToast } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import type { Gender } from '../../types';
import PatientForm, { type PatientFormFieldErrors, type PatientFormValues } from './PatientForm';
import { createPatient, type CreatePatientRequest } from './patientApi';

const emptyFormValues: PatientFormValues = {
    fullName: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    distanceFromClinicKm: '',
    notes: '',
};

const validationFieldMap: Partial<Record<string, keyof PatientFormValues>> = {
    'body.fullName': 'fullName',
    'body.phone': 'phone',
    'body.email': 'email',
    'body.gender': 'gender',
    'body.dateOfBirth': 'dateOfBirth',
    'body.age': 'age',
    'body.address': 'address',
    'body.city': 'city',
    'body.emergencyContactName': 'emergencyContactName',
    'body.emergencyContactPhone': 'emergencyContactPhone',
    'body.distanceFromClinicKm': 'distanceFromClinicKm',
    'body.notes': 'notes',
};

type BackendValidationDetail = {
    field: string;
    message: string;
};

const hasEmailShape = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateWholeNumber = (value: string, message: string): string | undefined => {
    if (!value.trim()) {
        return undefined;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
        return message;
    }

    return undefined;
};

const validateNonNegativeNumber = (value: string, message: string): string | undefined => {
    if (!value.trim()) {
        return undefined;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
        return message;
    }

    return undefined;
};

const validatePatientForm = (values: PatientFormValues): PatientFormFieldErrors => {
    const errors: PatientFormFieldErrors = {};

    if (!values.fullName.trim()) {
        errors.fullName = 'Patient name is required.';
    } else if (values.fullName.trim().length < 2) {
        errors.fullName = 'Patient name must be at least 2 characters long.';
    }

    if (!values.phone.trim()) {
        errors.phone = 'Patient phone number is required.';
    } else if (values.phone.trim().length < 5) {
        errors.phone = 'Patient phone must be at least 5 characters long.';
    }

    if (values.email.trim() && !hasEmailShape(values.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    const ageError = validateWholeNumber(
        values.age,
        'Age must be a whole number greater than or equal to 0.'
    );

    if (ageError) {
        errors.age = ageError;
    }

    const distanceError = validateNonNegativeNumber(
        values.distanceFromClinicKm,
        'Distance from clinic must be a number greater than or equal to 0.'
    );

    if (distanceError) {
        errors.distanceFromClinicKm = distanceError;
    }

    if (values.notes.trim().length > 500) {
        errors.notes = 'Notes must be shorter than 500 characters.';
    }

    return errors;
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const toOptionalNumber = (value: string): number | undefined => {
    return value.trim() ? Number(value) : undefined;
};

const toCreatePatientRequest = (values: PatientFormValues): CreatePatientRequest => {
    return {
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: toOptionalString(values.email),
        gender: values.gender ? (values.gender as Gender) : undefined,
        dateOfBirth: toOptionalString(values.dateOfBirth),
        age: toOptionalNumber(values.age),
        address: toOptionalString(values.address),
        city: toOptionalString(values.city),
        emergencyContactName: toOptionalString(values.emergencyContactName),
        emergencyContactPhone: toOptionalString(values.emergencyContactPhone),
        notes: toOptionalString(values.notes),
        distanceFromClinicKm: toOptionalNumber(values.distanceFromClinicKm),
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

const getBackendFieldErrors = (details: unknown): PatientFormFieldErrors => {
    return getBackendValidationDetails(details).reduce<PatientFormFieldErrors>((errors, detail) => {
        const field = validationFieldMap[detail.field];

        if (field) {
            errors[field] = detail.message;
        }

        return errors;
    }, {});
};

function PatientCreatePage() {
    const navigate = useNavigate();
    const { clinicId } = useActiveClinic();
    const { showErrorToast } = useToast();
    const [values, setValues] = useState<PatientFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<PatientFormFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: keyof PatientFormValues, value: string) => {
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
    };

    const handleCancel = () => {
        navigate('/patients');
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validatePatientForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            await createPatient(clinicId, toCreatePatientRequest(values));

            navigate('/patients', {
                state: {
                    statusMessage: 'Patient created successfully.',
                },
            });
        } catch (error) {
            if (isApiClientError(error)) {
                setFieldErrors(getBackendFieldErrors(error.details));
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Patient could not be created. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('PATIENT_CREATE_FAILED');
            showErrorToast(fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        Patients
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Add Patient</h1>
                    <p className="mt-3 max-w-2xl text-slate-600">
                        Create a clinic-side patient record before booking appointments or managing
                        the daily queue.
                    </p>
                </div>

                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={handleCancel}
                >
                    Back to patients
                </button>
            </div>

            {formError ? (
                <ErrorMessage
                    title="Patient was not created"
                    message={formError}
                    code={formErrorCode}
                    details={formErrorDetails}
                />
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
                <PatientForm
                    values={values}
                    fieldErrors={fieldErrors}
                    submitLabel="Create patient"
                    isSubmitting={isSubmitting}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </section>
    );
}

export default PatientCreatePage;
