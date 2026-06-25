import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage } from '../../components/feedback';
import { isApiClientError } from '../../lib';
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

const requiredText = 'This field is required.';

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
        errors.fullName = requiredText;
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

const getBackendFieldErrors = (details: unknown): DoctorFormFieldErrors => {
    if (!Array.isArray(details)) {
        return {};
    }

    return details.reduce<DoctorFormFieldErrors>((errors, detail) => {
        if (
            typeof detail !== 'object' ||
            detail === null ||
            !('field' in detail) ||
            !('message' in detail) ||
            typeof detail.field !== 'string' ||
            typeof detail.message !== 'string'
        ) {
            return errors;
        }

        const field = validationFieldMap[detail.field];

        if (field) {
            errors[field] = detail.message;
        }

        return errors;
    }, {});
};

function DoctorCreatePage() {
    const navigate = useNavigate();
    const { clinicId } = useActiveClinic();
    const [values, setValues] = useState<DoctorFormValues>(emptyFormValues);
    const [fieldErrors, setFieldErrors] = useState<DoctorFormFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    };

    const handleCancel = () => {
        navigate('/doctors');
    };

    const handleSubmit = async () => {
        const nextFieldErrors = validateDoctorForm(values);

        setFieldErrors(nextFieldErrors);
        setFormError(null);
        setFormErrorCode(undefined);

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
                const backendFieldErrors = getBackendFieldErrors(error.details);

                setFieldErrors(backendFieldErrors);
                setFormError(error.message);
                setFormErrorCode(error.code);
                return;
            }

            setFormError('Doctor could not be created. Please try again.');
            setFormErrorCode('DOCTOR_CREATE_FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Doctors
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Add Doctor</h1>
                    <p className="mt-3 max-w-2xl text-slate-600">
                        Create a clinic-side doctor record for appointment booking and daily clinic
                        flow.
                    </p>
                </div>

                <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={handleCancel}
                >
                    Back to doctors
                </button>
            </div>

            {formError ? (
                <ErrorMessage
                    title="Doctor was not created"
                    message={formError}
                    code={formErrorCode}
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
        </section>
    );
}

export default DoctorCreatePage;
