import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QueuePage from './QueuePage';
import { ApiClientError } from '../../lib';
import { AppointmentStatus, BookingSource, QueueStatus, RiskLevel } from '../../types';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';
import type { QueueListItem } from './queueApi';

const mockListTodayQueue = vi.hoisted(() => vi.fn());
const mockReorderQueue = vi.hoisted(() => vi.fn());
const mockUpdateQueueStatus = vi.hoisted(() => vi.fn());

vi.mock('./queueApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./queueApi')>();

    return {
        ...actual,
        listTodayQueue: mockListTodayQueue,
        reorderQueue: mockReorderQueue,
        updateQueueStatus: mockUpdateQueueStatus,
    };
});

const getTodayDateInputValue = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const createQueueEntry = (
    overrides: Partial<QueueListItem> & {
        id: string;
        position: number;
        patientName: string;
    }
): QueueListItem => {
    const { id, position, patientName, noShowPrediction, status, ...queueEntryOverrides } =
        overrides;

    return {
        id,
        clinicId: adminActiveClinic.clinicId,
        appointmentId: `30000000-0000-4000-8000-00000000000${position}`,
        doctorId: '10000000-0000-4000-8000-000000000001',
        patientId: `20000000-0000-4000-8000-00000000000${position}`,
        position,
        status: status ?? QueueStatus.WAITING,
        queuedAt: '2026-01-01T09:00:00.000Z',
        calledAt: null,
        completedAt: null,
        createdAt: '2026-01-01T09:00:00.000Z',
        updatedAt: '2026-01-01T09:00:00.000Z',
        appointment: {
            id: `30000000-0000-4000-8000-00000000000${position}`,
            scheduledAt: '2026-01-01T09:00:00.000Z',
            durationMinutes: 15,
            status: AppointmentStatus.IN_QUEUE,
            bookingSource: BookingSource.RECEPTION,
            reason: 'Follow-up',
            notes: null,
        },
        doctor: {
            id: '10000000-0000-4000-8000-000000000001',
            fullName: 'Dr. Asha Raman',
            specialization: 'Family Medicine',
            qualification: 'MBBS',
        },
        patient: {
            id: `20000000-0000-4000-8000-00000000000${position}`,
            fullName: patientName,
            phone: '+91 90000 02001',
            email: null,
            gender: null,
            age: 31,
        },
        noShowPrediction: noShowPrediction ?? null,
        ...queueEntryOverrides,
    };
};

const firstEntry = createQueueEntry({
    id: '40000000-0000-4000-8000-000000000001',
    position: 1,
    patientName: 'Riya Malhotra',
});

const secondEntry = createQueueEntry({
    id: '40000000-0000-4000-8000-000000000002',
    position: 2,
    patientName: 'Kabir Sen',
    noShowPrediction: {
        riskLevel: RiskLevel.HIGH,
        reasons: [
            {
                message: 'Repeated no-shows',
            },
        ],
        suggestedActions: ['Confirm the appointment time.'],
    },
});

const renderQueuePage = () => {
    return renderWithProviders(<QueuePage />, {
        activeClinic: adminActiveClinic,
    });
};

const getQueueRows = () => {
    return screen.getAllByRole('row').slice(1);
};

describe('QueuePage manual reorder controls', () => {
    beforeEach(() => {
        mockListTodayQueue.mockReset();
        mockReorderQueue.mockReset();
        mockUpdateQueueStatus.mockReset();
    });

    it('displays queue positions and enforces first, last, and single-entry boundaries', async () => {
        mockListTodayQueue.mockResolvedValue({
            queueEntries: [firstEntry, secondEntry],
        });

        renderQueuePage();

        expect(await screen.findByText('Position 1')).toBeVisible();
        expect(screen.getByText('Position 2')).toBeVisible();
        expect(screen.getByRole('button', { name: /move riya malhotra up/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /move riya malhotra down/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /move kabir sen up/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /move kabir sen down/i })).toBeDisabled();

        mockListTodayQueue.mockResolvedValue({
            queueEntries: [firstEntry],
        });

        await userEvent.click(screen.getByRole('button', { name: /refresh queue/i }));

        expect(
            await screen.findByRole('button', { name: /move riya malhotra up/i })
        ).toBeDisabled();
        expect(screen.getByRole('button', { name: /move riya malhotra down/i })).toBeDisabled();
    });

    it('sends the selected date and unique reordered queue-entry ids after a deliberate move', async () => {
        const user = userEvent.setup();
        const reorderedEntries = [
            {
                ...secondEntry,
                position: 1,
            },
            {
                ...firstEntry,
                position: 2,
            },
        ];

        mockListTodayQueue.mockResolvedValue({
            queueEntries: [firstEntry, secondEntry],
        });
        mockReorderQueue.mockResolvedValue({
            queueEntries: reorderedEntries,
        });

        renderQueuePage();

        await user.click(await screen.findByRole('button', { name: /move riya malhotra down/i }));

        await waitFor(() => {
            expect(mockReorderQueue).toHaveBeenCalledWith(adminActiveClinic.clinicId, {
                date: getTodayDateInputValue(),
                queueEntryIds: [secondEntry.id, firstEntry.id],
            });
        });

        const payload = mockReorderQueue.mock.calls[0][1];

        expect(new Set(payload.queueEntryIds).size).toBe(payload.queueEntryIds.length);
        expect(payload.queueEntryIds).not.toContain(firstEntry.patientId);
        expect(payload.queueEntryIds).not.toContain(firstEntry.appointmentId);
        expect(await screen.findByText('Moved Riya Malhotra.')).toBeVisible();
    });

    it('disables move and status controls while saving and prevents repeated reorder requests', async () => {
        const user = userEvent.setup();
        let resolveReorder: (value: unknown) => void = () => {};
        const reorderPromise = new Promise((resolve) => {
            resolveReorder = resolve;
        });

        mockListTodayQueue.mockResolvedValue({
            queueEntries: [firstEntry, secondEntry],
        });
        mockReorderQueue.mockReturnValue(reorderPromise);

        renderQueuePage();

        const moveDownButton = await screen.findByRole('button', {
            name: /move riya malhotra down/i,
        });

        await user.click(moveDownButton);
        await user.click(moveDownButton);

        expect(mockReorderQueue).toHaveBeenCalledTimes(1);
        expect(moveDownButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /move kabir sen up/i })).toBeDisabled();
        expect(
            screen.getByRole('combobox', { name: /update queue status for riya malhotra/i })
        ).toBeDisabled();

        resolveReorder({
            queueEntries: [
                {
                    ...secondEntry,
                    position: 1,
                },
                {
                    ...firstEntry,
                    position: 2,
                },
            ],
        });

        expect(await screen.findByText('Moved Riya Malhotra.')).toBeVisible();
    });

    it('keeps the last confirmed order and selected filters after reorder failure', async () => {
        const user = userEvent.setup();
        mockListTodayQueue.mockResolvedValue({
            queueEntries: [firstEntry, secondEntry],
        });
        mockReorderQueue.mockRejectedValue(
            new ApiClientError({
                code: 'QUEUE_REORDER_CONFLICT',
                message: 'Queue changed while reordering. Please refresh and try again.',
                status: 409,
            })
        );

        renderQueuePage();

        await screen.findByText('Riya Malhotra');
        await user.selectOptions(
            screen.getByRole('combobox', { name: /^queue status$/i }),
            QueueStatus.WAITING
        );
        await user.click(screen.getByRole('button', { name: /move riya malhotra down/i }));

        expect(
            await screen.findAllByText(
                'Queue changed while reordering. Please refresh and try again.'
            )
        ).not.toHaveLength(0);
        expect(screen.getByText('QUEUE_REORDER_CONFLICT')).toBeVisible();
        expect(screen.getByRole('combobox', { name: /^queue status$/i })).toHaveValue(
            QueueStatus.WAITING
        );

        const rows = getQueueRows();

        expect(within(rows[0]!).getByText('Riya Malhotra')).toBeVisible();
        expect(within(rows[1]!).getByText('Kabir Sen')).toBeVisible();
    });

    it('does not reorder automatically from no-show risk visibility and leaves status updates available', async () => {
        const user = userEvent.setup();
        mockListTodayQueue
            .mockResolvedValueOnce({
                queueEntries: [firstEntry, secondEntry],
            })
            .mockResolvedValueOnce({
                queueEntries: [
                    firstEntry,
                    {
                        ...secondEntry,
                        status: QueueStatus.CALLED,
                    },
                ],
            });
        mockUpdateQueueStatus.mockResolvedValue({
            queueEntry: {
                ...secondEntry,
                status: QueueStatus.CALLED,
            },
        });

        renderQueuePage();

        expect(await screen.findByText('high risk')).toBeVisible();
        expect(mockReorderQueue).not.toHaveBeenCalled();

        await user.selectOptions(
            screen.getByRole('combobox', { name: /update queue status for kabir sen/i }),
            QueueStatus.CALLED
        );

        expect(mockUpdateQueueStatus).toHaveBeenCalledWith(
            adminActiveClinic.clinicId,
            secondEntry.id,
            QueueStatus.CALLED
        );
    });
});
