import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientsPage from './PatientsPage';
import { ApiClientError } from '../../lib';
import { Gender, type PatientSummary } from '../../types';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';

const mockListPatients = vi.hoisted(() => vi.fn());
const mockUpdatePatient = vi.hoisted(() => vi.fn());

vi.mock('./patientApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./patientApi')>();

    return {
        ...actual,
        listPatients: mockListPatients,
        updatePatient: mockUpdatePatient,
    };
});

const patient: PatientSummary = {
    id: '20000000-0000-4000-8000-000000000001',
    patientClinicId: '21000000-0000-4000-8000-000000000001',
    clinicLinkIsActive: true,
    fullName: 'Riya Malhotra',
    phone: '+91 90000 02001',
    email: 'riya@example.test',
    gender: Gender.FEMALE,
    dateOfBirth: '1995-04-12T00:00:00.000Z',
    age: 31,
    address: '12 Demo Road',
    city: 'Bengaluru',
    emergencyContactName: 'Arun Malhotra',
    emergencyContactPhone: '+91 90000 02901',
    notes: 'Consistent attendance',
    distanceFromClinicKm: '2.40',
    totalAppointments: 8,
    totalNoShows: 0,
    totalLateArrivals: 0,
    lastVisitAt: '2026-01-10T00:00:00.000Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

const patientWithNullableValues: PatientSummary = {
    ...patient,
    id: '20000000-0000-4000-8000-000000000002',
    fullName: 'Kabir Sen',
    email: null,
    gender: null,
    dateOfBirth: null,
    age: null,
    address: null,
    city: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    notes: null,
    distanceFromClinicKm: null,
    totalAppointments: 0,
    totalNoShows: 0,
    totalLateArrivals: 0,
    lastVisitAt: null,
};

const renderPatientsPage = () => {
    return renderWithProviders(<PatientsPage />, {
        activeClinic: adminActiveClinic,
    });
};

describe('PatientsPage edit workflow', () => {
    beforeEach(() => {
        mockListPatients.mockReset();
        mockUpdatePatient.mockReset();
    });

    it('shows edit actions, opens pre-filled values, handles nullable values, and cancels', async () => {
        const user = userEvent.setup();
        mockListPatients.mockResolvedValue({
            patients: [patient, patientWithNullableValues],
        });

        renderPatientsPage();

        expect(await screen.findByRole('button', { name: /edit riya malhotra/i })).toBeVisible();

        await user.click(screen.getByRole('button', { name: /edit kabir sen/i }));

        expect(screen.getByRole('heading', { name: /edit kabir sen/i })).toBeVisible();
        expect(screen.getByLabelText(/full name/i)).toHaveValue('Kabir Sen');
        expect(screen.getByLabelText(/^email$/i)).toHaveValue('');
        expect(screen.getByLabelText(/date of birth/i)).toHaveValue('');
        expect(screen.getByRole('button', { name: /save patient/i })).toBeDisabled();
        expect(screen.queryByLabelText(/total appointments/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/total no-shows/i)).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^cancel$/i }));

        expect(screen.queryByRole('heading', { name: /edit kabir sen/i })).not.toBeInTheDocument();
    });

    it('sends null for cleared nullable fields and excludes authority and history fields', async () => {
        const user = userEvent.setup();
        const updatedPatient = {
            ...patient,
            email: null,
            notes: null,
            distanceFromClinicKm: null,
        };

        mockListPatients
            .mockResolvedValueOnce({
                patients: [patient],
            })
            .mockResolvedValueOnce({
                patients: [updatedPatient],
            });
        mockUpdatePatient.mockResolvedValue({
            patient: updatedPatient,
        });

        renderPatientsPage();

        await user.click(await screen.findByRole('button', { name: /edit riya malhotra/i }));
        await user.clear(screen.getByLabelText(/^email$/i));
        await user.clear(screen.getByLabelText(/distance from clinic/i));
        await user.clear(screen.getByLabelText(/^notes$/i));
        await user.click(screen.getByRole('button', { name: /save patient/i }));

        await waitFor(() => {
            expect(mockUpdatePatient).toHaveBeenCalledWith(adminActiveClinic.clinicId, patient.id, {
                email: null,
                distanceFromClinicKm: null,
                notes: null,
            });
        });

        const payload = mockUpdatePatient.mock.calls[0][2];

        expect(payload).not.toHaveProperty('patientId');
        expect(payload).not.toHaveProperty('clinicId');
        expect(payload).not.toHaveProperty('patientClinicId');
        expect(payload).not.toHaveProperty('totalAppointments');
        expect(payload).not.toHaveProperty('totalNoShows');
        expect(payload).not.toHaveProperty('createdAt');
        expect(await screen.findAllByText('Not added')).not.toHaveLength(0);
    });

    it('validates patient edit fields before submitting', async () => {
        const user = userEvent.setup();
        mockListPatients.mockResolvedValue({
            patients: [patient],
        });

        renderPatientsPage();

        await user.click(await screen.findByRole('button', { name: /edit riya malhotra/i }));
        await user.clear(screen.getByLabelText(/full name/i));
        await user.type(screen.getByLabelText(/full name/i), 'R');
        await user.clear(screen.getByLabelText(/^phone$/i));
        await user.type(screen.getByLabelText(/^phone$/i), '123');
        await user.clear(screen.getByLabelText(/^email$/i));
        await user.type(screen.getByLabelText(/^email$/i), 'bad-email');
        await user.clear(screen.getByLabelText(/^age$/i));
        await user.type(screen.getByLabelText(/^age$/i), '-3');
        await user.clear(screen.getByLabelText(/distance from clinic/i));
        await user.type(screen.getByLabelText(/distance from clinic/i), '-1');
        await user.click(screen.getByRole('button', { name: /save patient/i }));

        expect(screen.getByText('Patient name must be at least 2 characters long.')).toBeVisible();
        expect(screen.getByText('Patient phone must be at least 5 characters long.')).toBeVisible();
        expect(screen.getByText('Enter a valid email address.')).toBeVisible();
        expect(
            screen.getByText('Age must be a whole number greater than or equal to 0.')
        ).toBeVisible();
        expect(
            screen.getByText('Distance from clinic must be a number greater than or equal to 0.')
        ).toBeVisible();
        expect(mockUpdatePatient).not.toHaveBeenCalled();
    });

    it('shows backend and network errors while preserving edited input', async () => {
        const user = userEvent.setup();
        mockListPatients.mockResolvedValue({
            patients: [patient],
        });
        mockUpdatePatient
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'CLINIC_ACCESS_DENIED',
                    message: 'You do not have access to this clinic',
                    status: 403,
                })
            )
            .mockRejectedValueOnce(new TypeError('Failed to fetch'));

        renderPatientsPage();

        await user.click(await screen.findByRole('button', { name: /edit riya malhotra/i }));
        await user.clear(screen.getByLabelText(/^city$/i));
        await user.type(screen.getByLabelText(/^city$/i), 'Mysuru');
        await user.click(screen.getByRole('button', { name: /save patient/i }));

        expect(
            await screen.findAllByText('You do not have access to this clinic')
        ).not.toHaveLength(0);
        expect(screen.getByText('CLINIC_ACCESS_DENIED')).toBeVisible();
        expect(screen.getByLabelText(/^city$/i)).toHaveValue('Mysuru');

        await user.click(screen.getByRole('button', { name: /save patient/i }));

        expect(
            await screen.findAllByText('Patient could not be updated. Please try again.')
        ).not.toHaveLength(0);
        expect(screen.getByText('PATIENT_UPDATE_FAILED')).toBeVisible();
        expect(screen.getByLabelText(/^city$/i)).toHaveValue('Mysuru');
    });

    it('blocks repeated submissions while saving and supports deactivation', async () => {
        const user = userEvent.setup();
        let resolveUpdate: (value: unknown) => void = () => {};
        const updatePromise = new Promise((resolve) => {
            resolveUpdate = resolve;
        });

        mockListPatients
            .mockResolvedValueOnce({
                patients: [patient],
            })
            .mockResolvedValueOnce({
                patients: [
                    {
                        ...patient,
                        isActive: false,
                    },
                ],
            });
        mockUpdatePatient.mockReturnValue(updatePromise);

        renderPatientsPage();

        await user.click(await screen.findByRole('button', { name: /edit riya malhotra/i }));
        await user.click(screen.getByRole('checkbox', { name: /active patient record/i }));

        const saveButton = screen.getByRole('button', { name: /save patient/i });
        await user.click(saveButton);
        await user.click(saveButton);

        expect(mockUpdatePatient).toHaveBeenCalledTimes(1);
        expect(mockUpdatePatient).toHaveBeenCalledWith(adminActiveClinic.clinicId, patient.id, {
            isActive: false,
        });
        expect(screen.getByRole('button', { name: /saving patient/i })).toBeDisabled();

        resolveUpdate({
            patient: {
                ...patient,
                isActive: false,
            },
        });

        expect(await screen.findByText('Inactive')).toBeInTheDocument();
    });
});
