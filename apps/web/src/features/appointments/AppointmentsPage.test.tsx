import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';
import { AppointmentStatus, BookingSource } from '../../types';
import type { AppointmentListItem, AppointmentListResponseData } from './appointmentApi';
import AppointmentsPage from './AppointmentsPage';

const listAppointments = vi.hoisted(() => vi.fn());
const listPatients = vi.hoisted(() => vi.fn());
const updateAppointmentStatus = vi.hoisted(() => vi.fn());

vi.mock('./appointmentApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./appointmentApi')>()),
    listAppointments,
    updateAppointmentStatus,
}));
vi.mock('../doctors/doctorApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../doctors/doctorApi')>()),
    listDoctors: vi.fn().mockResolvedValue({ doctors: [] }),
}));
vi.mock('../patients/patientApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../patients/patientApi')>()),
    listPatients,
}));

const appointment: AppointmentListItem = {
    id: 'appointment-1',
    clinicId: adminActiveClinic.clinicId,
    doctorId: 'doctor-1',
    patientId: 'patient-1',
    scheduledAt: '2026-10-15T10:00:00.000Z',
    durationMinutes: 15,
    status: AppointmentStatus.SCHEDULED,
    bookingSource: BookingSource.RECEPTION,
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
    doctor: { id: 'doctor-1', fullName: 'Dr. Rao', specialization: 'General Medicine' },
    patient: { id: 'patient-1', fullName: 'Asha Mehra', phone: '9000000000', email: null },
    queueEntry: null,
    noShowPrediction: null,
};

function QueryProbe() {
    const location = useLocation();
    return <output data-testid="appointment-query">{location.search}</output>;
}

function BackProbe() {
    const navigate = useNavigate();
    return <button onClick={() => navigate(-1)}>Browser Back</button>;
}

describe('AppointmentsPage primary status action', () => {
    beforeEach(() => {
        listAppointments.mockReset().mockResolvedValue({
            appointments: [appointment],
            pagination: { page: 1, limit: 15, hasNextPage: false },
        });
        listPatients.mockReset().mockResolvedValue({ patients: [] });
        updateAppointmentStatus.mockReset().mockResolvedValue({
            appointment: { ...appointment, status: AppointmentStatus.CONFIRMED },
        });
    });

    it('renders appointment patient text without creating executable markup', async () => {
        const payload = "<img src=x onerror=alert('XSS')>";
        listAppointments.mockResolvedValue({
            appointments: [
                { ...appointment, patient: { ...appointment.patient, fullName: payload } },
            ],
            pagination: { page: 1, limit: 15, hasNextPage: false },
        });
        const view = renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });
        await waitFor(() => expect(view.container.textContent).toContain(payload));
        expect(view.container.querySelector('img, script, [onerror]')).toBeNull();
    });

    it('opens booking only on request and converts the legacy fragment to the dialog', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, {
            activeClinic: adminActiveClinic,
            route: '/appointments#book-appointment',
        });

        expect(await screen.findByRole('dialog', { name: 'Book appointment' })).toBeVisible();
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.body.querySelector('#book-appointment')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog', { name: 'Book appointment' })).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('');
        expect(document.body.querySelector('#book-appointment')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Book appointment' }));
        expect(screen.getByRole('dialog', { name: 'Book appointment' })).toBeVisible();
    });

    it('searches booking patients through the bounded clinic API', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });
        await user.click(screen.getByRole('button', { name: 'Book appointment' }));
        await user.type(screen.getByRole('searchbox', { name: 'Find patient' }), 'Kabir');
        await waitFor(() =>
            expect(listPatients).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                expect.objectContaining({ search: 'Kabir', limit: 20, isActive: true }),
                expect.any(AbortSignal)
            )
        );
    });

    it('offers the next valid transition directly and saves through the API', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        await user.click(await screen.findByRole('button', { name: 'Confirm' }));

        await waitFor(() => {
            expect(updateAppointmentStatus).toHaveBeenCalledWith(appointment.id, {
                status: AppointmentStatus.CONFIRMED,
            });
        });
        expect(await screen.findByText('Status updated to confirmed.')).toBeInTheDocument();
    });

    it('moves focus to status feedback when an updated row leaves the filtered list', async () => {
        const user = userEvent.setup();
        let currentStatus: AppointmentStatus = AppointmentStatus.SCHEDULED;
        listAppointments.mockImplementation(
            async (_clinicId: string, filters: { status?: AppointmentStatus }) => ({
                appointments: filters.status === currentStatus ? [appointment] : [],
                pagination: { page: 1, limit: 15, hasNextPage: false },
            })
        );
        updateAppointmentStatus.mockImplementation(async () => {
            currentStatus = AppointmentStatus.CONFIRMED;
            return { appointment: { ...appointment, status: currentStatus } };
        });
        renderWithProviders(<AppointmentsPage />, {
            activeClinic: adminActiveClinic,
            route: '/appointments?status=SCHEDULED',
        });
        await user.click(await screen.findByRole('button', { name: 'Confirm' }));
        const feedback = await screen.findByText('Status updated to confirmed.');
        await waitFor(() => expect(feedback).toHaveFocus());
        expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    });

    it('requests server pages and server patient search', async () => {
        const user = userEvent.setup();
        const rows = Array.from({ length: 17 }, (_, index) => ({
            ...appointment,
            id: `appointment-${index}`,
            patient: {
                ...appointment.patient,
                id: `patient-${index}`,
                fullName: `Patient ${index + 1}`,
                phone: `90000000${String(index).padStart(2, '0')}`,
            },
        }));
        listAppointments.mockImplementation(
            async (_clinicId: string, filters: { page?: number; search?: string }) => {
                const matches = filters.search
                    ? rows.filter((row) => row.patient.phone.includes(filters.search ?? ''))
                    : rows;
                const page = filters.page ?? 1;
                return {
                    appointments: matches.slice((page - 1) * 15, page * 15),
                    pagination: { page, limit: 15, hasNextPage: matches.length > page * 15 },
                };
            }
        );
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        expect(await screen.findByText('Patient 1')).toBeInTheDocument();
        expect(screen.queryByText('Patient 17')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(await screen.findByText('Patient 17')).toBeInTheDocument();

        await user.type(screen.getByRole('searchbox', { name: 'Search patient' }), '9000000016');
        expect(await screen.findByText('Patient 17')).toBeInTheDocument();
        expect(screen.queryByText('Patient 1')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });

    it('restores a filtered page, retains it through a dialog, then reconciles after a status change', async () => {
        const user = userEvent.setup();
        let rows = Array.from({ length: 16 }, (_, index) => ({
            ...appointment,
            id: `appointment-${index + 1}`,
            patient: { ...appointment.patient, fullName: `Patient ${index + 1}` },
        }));
        listAppointments.mockImplementation(
            async (
                _clinicId: string,
                filters: {
                    page: number;
                    limit: number;
                    status?: AppointmentStatus;
                }
            ) => {
                const matches = rows.filter(
                    (row) => !filters.status || row.status === filters.status
                );
                const start = (filters.page - 1) * filters.limit;
                return {
                    appointments: matches.slice(start, start + filters.limit),
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        hasNextPage: matches.length > start + filters.limit,
                    },
                };
            }
        );
        updateAppointmentStatus.mockImplementation(async (id: string) => {
            rows = rows.map((row) =>
                row.id === id ? { ...row, status: AppointmentStatus.CONFIRMED } : row
            );
            return { appointment: rows.find((row) => row.id === id) };
        });
        renderWithProviders(
            <>
                <AppointmentsPage />
                <QueryProbe />
            </>,
            {
                activeClinic: adminActiveClinic,
                route: '/appointments?date=2026-10-15&status=SCHEDULED&page=2',
            }
        );

        expect(await screen.findByText('Patient 16')).toBeInTheDocument();
        expect(listAppointments).toHaveBeenCalledWith(
            adminActiveClinic.clinicId,
            expect.objectContaining({
                date: '2026-10-15',
                status: AppointmentStatus.SCHEDULED,
                page: 2,
                limit: 15,
            }),
            expect.any(AbortSignal)
        );
        await user.click(screen.getByRole('button', { name: 'View risk details for Patient 16' }));
        expect(screen.getByRole('dialog', { name: 'No-show risk assessment' })).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.getByTestId('appointment-query')).toHaveTextContent('page=2');

        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        await waitFor(() =>
            expect(screen.getByTestId('appointment-query')).not.toHaveTextContent('page=2')
        );
        expect(screen.getByTestId('appointment-query')).toHaveTextContent('status=SCHEDULED');
        expect(await screen.findByText('Patient 1')).toBeInTheDocument();
        expect(screen.queryByText('Patient 16')).not.toBeInTheDocument();
        expect(
            listAppointments.mock.calls.some(
                (call) => call[1].page === 1 && call[1].status === AppointmentStatus.SCHEDULED
            )
        ).toBe(true);
    });

    it('hides old rows during a page request and ignores a late response after filtering', async () => {
        const user = userEvent.setup();
        const nextPage = {
            ...appointment,
            id: 'appointment-2',
            patient: { ...appointment.patient, fullName: 'Next page patient' },
        };
        const confirmed = {
            ...appointment,
            id: 'appointment-3',
            status: AppointmentStatus.CONFIRMED,
            patient: { ...appointment.patient, fullName: 'Confirmed patient' },
        };
        let resolveNextPage!: (data: AppointmentListResponseData) => void;
        const pendingPage = new Promise<AppointmentListResponseData>((resolve) => {
            resolveNextPage = resolve;
        });
        listAppointments.mockImplementation(
            (_clinicId: string, filters: { page: number; status?: AppointmentStatus }) => {
                if (filters.page === 2) return pendingPage;
                return Promise.resolve({
                    appointments:
                        filters.status === AppointmentStatus.CONFIRMED
                            ? [confirmed]
                            : [appointment],
                    pagination: { page: 1, limit: 15, hasNextPage: !filters.status },
                });
            }
        );
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });
        expect(await screen.findByText('Asha Mehra')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.queryByText('Asha Mehra')).not.toBeInTheDocument();
        expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Status' }),
            AppointmentStatus.CONFIRMED
        );
        expect(await screen.findByText('Confirmed patient')).toBeInTheDocument();
        resolveNextPage({
            appointments: [nextPage],
            pagination: { page: 2, limit: 15, hasNextPage: false },
        });
        await waitFor(() =>
            expect(screen.queryByText('Next page patient')).not.toBeInTheDocument()
        );
        expect(screen.getByText('Confirmed patient')).toBeInTheDocument();
    });

    it('requests the selected bounded page size and records it in the URL', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <>
                <AppointmentsPage />
                <QueryProbe />
            </>,
            {
                activeClinic: adminActiveClinic,
            }
        );
        await screen.findByText('Asha Mehra');
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Appointments per page' }),
            '20'
        );
        await waitFor(() =>
            expect(listAppointments).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                expect.objectContaining({ page: 1, limit: 20 }),
                expect.any(AbortSignal)
            )
        );
        expect(screen.getByTestId('appointment-query')).toHaveTextContent('limit=20');
    });

    it('restores a prior filtered page on browser Back', async () => {
        const user = userEvent.setup();
        const confirmed = {
            ...appointment,
            id: 'appointment-confirmed',
            status: AppointmentStatus.CONFIRMED,
            patient: { ...appointment.patient, fullName: 'Confirmed patient' },
        };
        listAppointments.mockImplementation(
            async (
                _clinicId: string,
                filters: {
                    page: number;
                    status?: AppointmentStatus;
                }
            ) => ({
                appointments:
                    filters.status === AppointmentStatus.CONFIRMED ? [confirmed] : [appointment],
                pagination: { page: filters.page, limit: 15, hasNextPage: false },
            })
        );
        renderWithProviders(
            <>
                <AppointmentsPage />
                <QueryProbe />
                <BackProbe />
            </>,
            {
                activeClinic: adminActiveClinic,
                route: '/appointments?date=2026-10-15&status=SCHEDULED&page=2',
            }
        );
        expect(await screen.findByText('Asha Mehra')).toBeInTheDocument();
        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Status' }),
            AppointmentStatus.CONFIRMED
        );
        expect(await screen.findByText('Confirmed patient')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Browser Back' }));
        await waitFor(() =>
            expect(screen.getByTestId('appointment-query')).toHaveTextContent('page=2')
        );
        expect(await screen.findByText('Asha Mehra')).toBeInTheDocument();
        expect(listAppointments).toHaveBeenLastCalledWith(
            adminActiveClinic.clinicId,
            expect.objectContaining({ status: AppointmentStatus.SCHEDULED, page: 2 }),
            expect.any(AbortSignal)
        );
    });

    it('normalizes an invalid deep link before requesting appointments', async () => {
        renderWithProviders(
            <>
                <AppointmentsPage />
                <QueryProbe />
            </>,
            {
                activeClinic: adminActiveClinic,
                route: '/appointments?date=2026-02-30&page=999&search=private',
            }
        );
        expect(await screen.findByText('Asha Mehra')).toBeInTheDocument();
        expect(screen.getByTestId('appointment-query').textContent).toBe('');
        expect(listAppointments).toHaveBeenCalledTimes(1);
        expect(listAppointments).toHaveBeenCalledWith(
            adminActiveClinic.clinicId,
            expect.objectContaining({ page: 1, limit: 15, search: undefined }),
            expect.any(AbortSignal)
        );
    });

    it('finds the nearest valid page for an outdated deep link with bounded requests', async () => {
        listAppointments.mockImplementation(
            async (_clinicId: string, filters: { page: number; limit: number }) => ({
                appointments: filters.page <= 3 ? [appointment] : [],
                pagination: {
                    page: filters.page,
                    limit: filters.limit,
                    hasNextPage: filters.page < 3,
                },
            })
        );
        renderWithProviders(
            <>
                <AppointmentsPage />
                <QueryProbe />
            </>,
            {
                activeClinic: adminActiveClinic,
                route: '/appointments?date=2026-10-15&page=5',
            }
        );
        expect(await screen.findByText('Asha Mehra')).toBeInTheDocument();
        expect(screen.getByTestId('appointment-query')).toHaveTextContent('page=3');
        expect(listAppointments.mock.calls.map((call) => call[1].page)).toEqual([5, 3, 4, 3]);
    });

    it('loads a returned appointment by ID and restores the schedule', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, {
            activeClinic: adminActiveClinic,
            route: {
                pathname: '/appointments',
                state: {
                    appointmentId: appointment.id,
                    appointmentDate: '2026-10-14T20:00:00.000Z',
                },
            },
        });

        await waitFor(() =>
            expect(listAppointments).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                { appointmentId: appointment.id, page: 1, limit: 15 },
                expect.any(AbortSignal)
            )
        );
        expect(await screen.findByText('Showing the selected appointment.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Show schedule' }));
        await waitFor(() =>
            expect(listAppointments).toHaveBeenCalledWith(
                adminActiveClinic.clinicId,
                expect.objectContaining({ date: '2026-10-15', page: 1, limit: 15 }),
                expect.any(AbortSignal)
            )
        );
    });

    it('opens risk details in a dialog without adding an expanded appointment row', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        await user.click(
            await screen.findByRole('button', { name: 'View risk details for Asha Mehra' })
        );

        expect(screen.getByRole('dialog', { name: 'No-show risk assessment' })).toBeInTheDocument();
        expect(screen.getByText('Risk assessment unavailable')).toBeInTheDocument();
        expect(document.querySelector('.operational-detail-row')).not.toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'View risk details for Asha Mehra' })
        ).toHaveFocus();
        expect(
            screen.getByRole('button', { name: 'View risk details for Asha Mehra' })
        ).toHaveFocus();
    });

    it('keeps secondary status transitions available in the compact actions selector', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        const actions = await screen.findByRole('combobox', {
            name: 'More actions for Asha Mehra',
        });
        expect(screen.getByRole('option', { name: 'View activity' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Reschedule' })).toBeInTheDocument();
        await user.selectOptions(actions, AppointmentStatus.ARRIVED);

        await waitFor(() => {
            expect(updateAppointmentStatus).toHaveBeenCalledWith(appointment.id, {
                status: AppointmentStatus.ARRIVED,
            });
        });
    });
});
