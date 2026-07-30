import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DoctorsPage from './DoctorsPage';
import { ApiClientError } from '../../lib';
import { Gender, type DoctorSummary } from '../../types';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';

const mockListDoctors = vi.hoisted(() => vi.fn());
const mockUpdateDoctor = vi.hoisted(() => vi.fn());

vi.mock('./doctorApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./doctorApi')>();

    return {
        ...actual,
        listDoctors: mockListDoctors,
        updateDoctor: mockUpdateDoctor,
    };
});

const doctor: DoctorSummary = {
    id: '10000000-0000-4000-8000-000000000001',
    doctorClinicId: '11000000-0000-4000-8000-000000000001',
    clinicLinkIsActive: true,
    fullName: 'Dr. Asha Raman',
    specialization: 'Family Medicine',
    qualification: 'MBBS',
    registrationNumber: 'KMC-1001',
    phone: '+91 90000 01001',
    email: 'asha@example.test',
    gender: Gender.FEMALE,
    experienceYears: 12,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const doctorWithEmptyOptionalValues: DoctorSummary = {
    ...doctor,
    id: '10000000-0000-4000-8000-000000000002',
    fullName: 'Dr. Empty Optional',
    specialization: null,
    qualification: null,
    registrationNumber: null,
    phone: null,
    email: null,
    gender: null,
    experienceYears: null,
};

const renderDoctorsPage = () => {
    return renderWithProviders(<DoctorsPage />, {
        activeClinic: adminActiveClinic,
    });
};

describe('DoctorsPage edit workflow', () => {
    beforeEach(() => {
        mockListDoctors.mockReset();
        mockUpdateDoctor.mockReset();
    });

    it('shows edit actions, opens pre-filled values, handles optional empty values, and cancels', async () => {
        const user = userEvent.setup();
        mockListDoctors.mockResolvedValue({
            doctors: [doctor, doctorWithEmptyOptionalValues],
        });

        renderDoctorsPage();

        expect(await screen.findByRole('button', { name: /edit dr\. asha raman/i })).toBeVisible();

        await user.click(screen.getByRole('button', { name: /edit dr\. empty optional/i }));

        expect(screen.getByRole('heading', { name: /edit dr\. empty optional/i })).toBeVisible();
        expect(screen.getByLabelText(/full name/i)).toHaveValue('Dr. Empty Optional');
        expect(screen.getByLabelText(/specialization/i)).toHaveValue('');
        expect(screen.getByLabelText(/email/i)).toHaveValue('');
        expect(screen.getByRole('button', { name: /save doctor/i })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: /^cancel$/i }));

        expect(
            screen.queryByRole('heading', { name: /edit dr\. empty optional/i })
        ).not.toBeInTheDocument();
    });

    it('sends only changed supported fields and refreshes the visible list after success', async () => {
        const user = userEvent.setup();
        const updatedDoctor = {
            ...doctor,
            specialization: 'Cardiology',
        };

        mockListDoctors
            .mockResolvedValueOnce({
                doctors: [doctor],
            })
            .mockResolvedValueOnce({
                doctors: [updatedDoctor],
            });
        mockUpdateDoctor.mockResolvedValue({
            doctor: updatedDoctor,
        });

        renderDoctorsPage();

        await user.click(await screen.findByRole('button', { name: /edit dr\. asha raman/i }));
        await user.clear(screen.getByLabelText(/specialization/i));
        await user.type(screen.getByLabelText(/specialization/i), 'Cardiology');
        await user.click(screen.getByRole('button', { name: /save doctor/i }));

        await waitFor(() => {
            expect(mockUpdateDoctor).toHaveBeenCalledWith(adminActiveClinic.clinicId, doctor.id, {
                specialization: 'Cardiology',
            });
        });

        const payload = mockUpdateDoctor.mock.calls[0][2];

        expect(payload).not.toHaveProperty('doctorId');
        expect(payload).not.toHaveProperty('clinicId');
        expect(payload).not.toHaveProperty('doctorClinicId');
        expect(payload).not.toHaveProperty('createdAt');
        expect(await screen.findByText('Cardiology')).toBeInTheDocument();
    });

    it('validates client fields before submitting', async () => {
        const user = userEvent.setup();
        mockListDoctors.mockResolvedValue({
            doctors: [doctor],
        });

        renderDoctorsPage();

        await user.click(await screen.findByRole('button', { name: /edit dr\. asha raman/i }));
        await user.clear(screen.getByLabelText(/full name/i));
        await user.type(screen.getByLabelText(/full name/i), 'A');
        await user.clear(screen.getByLabelText(/email/i));
        await user.type(screen.getByLabelText(/email/i), 'not-an-email');
        await user.clear(screen.getByLabelText(/experience years/i));
        await user.type(screen.getByLabelText(/experience years/i), '-1');
        await user.click(screen.getByRole('button', { name: /save doctor/i }));

        expect(screen.getByText('Doctor name must be at least 2 characters long.')).toBeVisible();
        expect(screen.getByText('Enter a valid email address.')).toBeVisible();
        expect(
            screen.getByText('Experience years must be a whole number greater than or equal to 0.')
        ).toBeVisible();
        expect(mockUpdateDoctor).not.toHaveBeenCalled();
    });

    it('shows backend validation and authorization errors while preserving input', async () => {
        const user = userEvent.setup();
        mockListDoctors.mockResolvedValue({
            doctors: [doctor],
        });
        mockUpdateDoctor
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    status: 400,
                    details: [
                        {
                            field: 'body.email',
                            message: 'Invalid doctor email',
                        },
                    ],
                })
            )
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'CLINIC_ACCESS_DENIED',
                    message: 'You do not have access to this clinic',
                    status: 403,
                })
            );

        renderDoctorsPage();

        await user.click(await screen.findByRole('button', { name: /edit dr\. asha raman/i }));
        await user.clear(screen.getByLabelText(/phone/i));
        await user.type(screen.getByLabelText(/phone/i), '+91 90000 09999');
        await user.click(screen.getByRole('button', { name: /save doctor/i }));

        expect(await screen.findAllByText('Request validation failed')).not.toHaveLength(0);
        expect(screen.getByText('Invalid doctor email')).toBeVisible();
        expect(screen.getByLabelText(/phone/i)).toHaveValue('+91 90000 09999');

        await user.click(screen.getByRole('button', { name: /save doctor/i }));

        expect(
            await screen.findAllByText('You do not have access to this clinic')
        ).not.toHaveLength(0);
        expect(screen.getByText('CLINIC_ACCESS_DENIED')).toBeVisible();
        expect(screen.getByLabelText(/phone/i)).toHaveValue('+91 90000 09999');
    });

    it('blocks repeated submissions while saving and supports deactivation', async () => {
        const user = userEvent.setup();
        let resolveUpdate: (value: unknown) => void = () => {};
        const updatePromise = new Promise((resolve) => {
            resolveUpdate = resolve;
        });

        mockListDoctors
            .mockResolvedValueOnce({
                doctors: [doctor],
            })
            .mockResolvedValueOnce({
                doctors: [
                    {
                        ...doctor,
                        isActive: false,
                    },
                ],
            });
        mockUpdateDoctor.mockReturnValue(updatePromise);

        renderDoctorsPage();

        await user.click(await screen.findByRole('button', { name: /edit dr\. asha raman/i }));
        await user.click(screen.getByRole('checkbox', { name: /active doctor record/i }));

        const saveButton = screen.getByRole('button', { name: /save doctor/i });
        await user.click(saveButton);
        await user.click(saveButton);

        expect(mockUpdateDoctor).toHaveBeenCalledTimes(1);
        expect(mockUpdateDoctor).toHaveBeenCalledWith(adminActiveClinic.clinicId, doctor.id, {
            isActive: false,
        });
        expect(screen.getByRole('button', { name: /saving doctor/i })).toBeDisabled();

        resolveUpdate({
            doctor: {
                ...doctor,
                isActive: false,
            },
        });

        expect(await screen.findByText('Inactive')).toBeInTheDocument();
    });
});
