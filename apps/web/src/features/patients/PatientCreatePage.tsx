import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, useToast } from '../../components/feedback';
import { ConfirmationDialog } from '../../components/ui';
import {
    getBackendFieldErrors,
    getBackendValidationDetails,
    isApiClientError,
    type BackendValidationDetail,
} from '../../lib';
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
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
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
    'body.addressLine1': 'addressLine1',
    'body.addressLine2': 'addressLine2',
    'body.city': 'city',
    'body.state': 'state',
    'body.country': 'country',
    'body.pincode': 'pincode',
    'body.emergencyContactName': 'emergencyContactName',
    'body.emergencyContactPhone': 'emergencyContactPhone',
    'body.distanceFromClinicKm': 'distanceFromClinicKm',
    'body.notes': 'notes',
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

    const locationFields: Array<{
        field: keyof PatientFormValues;
        label: string;
        maxLength: number;
    }> = [
        { field: 'addressLine1', label: 'Address line 1', maxLength: 250 },
        { field: 'addressLine2', label: 'Address line 2', maxLength: 250 },
        { field: 'city', label: 'City', maxLength: 100 },
        { field: 'state', label: 'State', maxLength: 100 },
        { field: 'country', label: 'Country', maxLength: 100 },
        { field: 'pincode', label: 'Pincode', maxLength: 20 },
    ];

    for (const locationField of locationFields) {
        if (values[locationField.field].trim().length > locationField.maxLength) {
            errors[locationField.field] = `${locationField.label} must be ${locationField.maxLength} characters or fewer.`;
        }
    }

    if (values.country.trim().toLowerCase() === 'india' && values.pincode.trim()) {
        if (!/^\d{6}$/.test(values.pincode.trim())) {
            errors.pincode = 'Indian pincodes must contain exactly 6 digits.';
        }
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
        addressLine1: toOptionalString(values.addressLine1),
        addressLine2: toOptionalString(values.addressLine2),
        city: toOptionalString(values.city),
        state: toOptionalString(values.state),
        country: toOptionalString(values.country),
        pincode: toOptionalString(values.pincode),
        emergencyContactName: toOptionalString(values.emergencyContactName),
        emergencyContactPhone: toOptionalString(values.emergencyContactPhone),
        notes: toOptionalString(values.notes),
        distanceFromClinicKm: toOptionalNumber(values.distanceFromClinicKm),
    };
};

const hasMeaningfulPatientValues = (values: PatientFormValues): boolean => {
    return (Object.keys(values) as Array<keyof PatientFormValues>).some(
        (field) => values[field].trim() !== emptyFormValues[field].trim()
    );
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
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

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
        if (hasMeaningfulPatientValues(values)) {
            setShowDiscardDialog(true);
            return;
        }

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
                setFieldErrors(
                    getBackendFieldErrors<keyof PatientFormValues>(
                        error.details,
                        validationFieldMap
                    )
                );
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
            <ConfirmationDialog
                open={showDiscardDialog}
                title="Discard patient changes?"
                description="The patient record has entered details that have not been saved."
                confirmLabel="Discard changes"
                cancelLabel="Continue editing"
                onConfirm={() => navigate('/patients')}
                onCancel={() => setShowDiscardDialog(false)}
            />
        </section>
    );
}

export default PatientCreatePage;
