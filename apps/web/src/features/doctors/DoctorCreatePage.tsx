import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, useToast } from '../../components/feedback';
import { Button, PageHeader, ConfirmationDialog } from '../../components/ui';
import {
    getBackendFieldErrors,
    getBackendValidationDetails,
    isApiClientError,
    type BackendValidationDetail,
} from '../../lib';
import type { Gender } from '../../types';
import DoctorForm, { type DoctorFormFieldErrors, type DoctorFormValues } from './DoctorForm';
import { createDoctor, type CreateDoctorRequest } from './doctorApi';

const emptyFormValues: DoctorFormValues = {
    fullName: '',
    specialization: '',
    qualification: '',
    registrationNumber: '',
    phone: '',
    email: '',
    gender: '',
    experienceYears: '',
};

const validationFieldMap: Partial<Record<string, keyof DoctorFormValues>> = {
    'body.fullName': 'fullName',
    'body.specialization': 'specialization',
    'body.qualification': 'qualification',
    'body.registrationNumber': 'registrationNumber',
    'body.phone': 'phone',
    'body.email': 'email',
    'body.gender': 'gender',
    'body.experienceYears': 'experienceYears',
};

const hasEmailShape = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateDoctorForm = (values: DoctorFormValues): DoctorFormFieldErrors => {
    const errors: DoctorFormFieldErrors = {};

    if (!values.fullName.trim()) {
        errors.fullName = 'Doctor name is required.';
    } else if (values.fullName.trim().length < 2) {
        errors.fullName = 'Doctor name must be at least 2 characters long.';
    }

    if (values.email.trim() && !hasEmailShape(values.email.trim())) {
        errors.email = 'Enter a valid email address.';
    }

    if (values.experienceYears.trim()) {
        const experienceYears = Number(values.experienceYears);

        if (!Number.isInteger(experienceYears) || experienceYears < 0) {
            errors.experienceYears =
                'Experience years must be a whole number greater than or equal to 0.';
        }
    }

    return errors;
};

const toOptionalString = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
};

const toCreateDoctorRequest = (values: DoctorFormValues): CreateDoctorRequest => {
    const experienceYears = values.experienceYears.trim()
        ? Number(values.experienceYears)
        : undefined;

    return {
        fullName: values.fullName.trim(),
        specialization: toOptionalString(values.specialization),
        qualification: toOptionalString(values.qualification),
        registrationNumber: toOptionalString(values.registrationNumber),
        phone: toOptionalString(values.phone),
        email: toOptionalString(values.email),
        gender: values.gender ? (values.gender as Gender) : undefined,
        experienceYears,
    };
};

const hasMeaningfulDoctorValues = (values: DoctorFormValues): boolean => {
    return Object.values(values).some((value) => value.trim().length > 0);
};

function DoctorCreatePage() {
    const navigate = useNavigate();
    const { clinicId } = useActiveClinic();
    const { showErrorToast } = useToast();
    const [values, setValues] = useState<DoctorFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<DoctorFormFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [formErrorDetails, setFormErrorDetails] = useState<BackendValidationDetail[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    const handleChange = (field: keyof DoctorFormValues, value: string) => {
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
        if (hasMeaningfulDoctorValues(values)) {
            setShowDiscardDialog(true);
            return;
        }

        navigate('/doctors');
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validateDoctorForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);
        setFormErrorDetails([]);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        setIsSubmitting(true);

        try {
            await createDoctor(clinicId, toCreateDoctorRequest(values));

            navigate('/doctors', {
                state: {
                    statusMessage: 'Doctor created successfully.',
                },
            });
        } catch (error) {
            if (isApiClientError(error)) {
                const backendFieldErrors = getBackendFieldErrors<keyof DoctorFormValues>(
                    error.details,
                    validationFieldMap
                );

                setFieldErrors(backendFieldErrors);
                setFormError(error.message);
                setFormErrorCode(error.code);
                setFormErrorDetails(getBackendValidationDetails(error.details));
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Doctor could not be created. Please try again.';

            setFormError(fallbackMessage);
            setFormErrorCode('DOCTOR_CREATE_FAILED');
            showErrorToast(fallbackMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="space-y-6">
            <PageHeader
                title="Add Doctor"
                eyebrow="Clinic directory"
                description="Create a provider profile for appointments and daily clinic flow."
                actions={
                    <Button variant="outline" onClick={handleCancel}>
                        Back to doctors
                    </Button>
                }
            />

            {formError ? (
                <ErrorMessage
                    title="Doctor was not created"
                    message={formError}
                    code={formErrorCode}
                    details={formErrorDetails}
                />
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
                <DoctorForm
                    values={values}
                    fieldErrors={fieldErrors}
                    submitLabel="Create doctor"
                    isSubmitting={isSubmitting}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
            <ConfirmationDialog
                open={showDiscardDialog}
                title="Discard doctor changes?"
                description="The doctor record has entered details that have not been saved."
                confirmLabel="Discard changes"
                cancelLabel="Continue editing"
                onConfirm={() => navigate('/doctors')}
                onCancel={() => setShowDiscardDialog(false)}
            />
        </section>
    );
}

export default DoctorCreatePage;
