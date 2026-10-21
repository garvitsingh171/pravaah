import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NoShowRiskDetailsDialog from './NoShowRiskDetailsDialog';

const subject = {
    id: 'appointment-test',
    patientName: 'Synthetic Patient',
    doctorName: 'Synthetic Doctor',
    scheduledAt: '2026-09-18T10:00:00.000Z',
    status: 'IN_QUEUE',
    lifecycleSteps: ['Scheduled', 'Confirmed', 'Arrived', 'In queue', 'Called', 'Completed'].map(
        (label, index) => ({ id: `step-${index}`, label, description: `${label} description` })
    ),
    currentLifecycleStepId: 'step-3',
    prediction: {
        riskLevel: 'HIGH' as const,
        score: 72,
        reasons: [
            { code: 'PREVIOUS_NO_SHOW_HISTORY', message: 'Synthetic factor', scoreImpact: 20 },
        ],
        suggestedActions: [
            'A long synthetic recommendation that wraps naturally within the dialog.',
        ],
    },
};

describe('NoShowRiskDetailsDialog', () => {
    it('renders lifecycle and risk content and supports Escape dismissal', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <NoShowRiskDetailsDialog subject={subject} timezone="Asia/Kolkata" onClose={onClose} />
        );
        expect(screen.getByRole('dialog', { name: 'No-show risk assessment' })).toBeInTheDocument();
        expect(screen.getByText('In queue')).toBeInTheDocument();
        expect(
            screen.getByRole('list', { name: 'Appointment lifecycle for Synthetic Patient' })
                .children
        ).toHaveLength(6);
        expect(screen.getByText('Contributing factors')).toBeInTheDocument();
        expect(screen.getByText(/long synthetic recommendation/)).toBeInTheDocument();
        expect(screen.getAllByLabelText('High no-show risk')).toHaveLength(1);
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes through the visible close button', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<NoShowRiskDetailsDialog subject={subject} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: 'Close no-show risk assessment' }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
