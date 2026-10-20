import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('./predictionFeedbackApi', () => ({ getPredictionFeedback: mocks.get, savePredictionFeedback: mocks.save }));

import PredictionFeedbackForm from './PredictionFeedbackForm';

const saved = {
    id: 'feedback-id', predictionId: 'prediction-id', usefulness: 'USEFUL', actionTaken: 'NO_ACTION',
    note: 'Checked the appointment.', recommendationSnapshot: ['Review'], recommendationVersion: 'v1',
    createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-20T10:00:00Z',
};

describe('PredictionFeedbackForm', () => {
    beforeEach(() => { vi.clearAllMocks(); mocks.get.mockResolvedValue(null); });

    it('does not offer an active form without a prediction run id', () => {
        render(<PredictionFeedbackForm />);
        expect(screen.queryByRole('button', { name: /was this recommendation useful/i })).not.toBeInTheDocument();
        expect(screen.getByText(/feedback is unavailable/i)).toBeInTheDocument();
        expect(mocks.get).not.toHaveBeenCalled();
    });

    it('loads existing feedback, allows an update, and confirms only after persistence', async () => {
        const user = userEvent.setup();
        mocks.get.mockResolvedValue(saved);
        mocks.save.mockResolvedValue({ ...saved, usefulness: 'UNSURE' });
        render(<PredictionFeedbackForm predictionId="prediction-id" />);
        await user.click(screen.getByRole('button', { name: /was this recommendation useful/i }));
        expect(await screen.findByLabelText(/optional note/i)).toHaveValue('Checked the appointment.');
        expect(screen.getByRole('radio', { name: 'Useful' })).toBeChecked();
        await user.click(screen.getByRole('radio', { name: 'Unsure' }));
        await user.click(screen.getByRole('button', { name: 'Update Feedback' }));
        await waitFor(() => expect(mocks.save).toHaveBeenCalledWith('prediction-id', expect.objectContaining({ usefulness: 'UNSURE', actionTaken: 'NO_ACTION' })));
        expect(await screen.findByRole('status')).toHaveTextContent(/feedback saved/i);
    });

    it('keeps editing locked after a failed feedback load and retries before showing saved values', async () => {
        const user = userEvent.setup();
        mocks.get.mockRejectedValueOnce(new Error('Temporary network failure')).mockResolvedValueOnce(saved);
        render(<PredictionFeedbackForm predictionId="prediction-id" />);
        await user.click(screen.getByRole('button', { name: /was this recommendation useful/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Temporary network failure');
        expect(screen.queryByRole('button', { name: 'Save Feedback' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Update Feedback' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry loading feedback' }));
        expect(await screen.findByLabelText(/optional note/i)).toHaveValue('Checked the appointment.');
        expect(screen.getByRole('radio', { name: 'Useful' })).toBeChecked();
        expect(screen.getByRole('button', { name: 'Update Feedback' })).toBeInTheDocument();
        expect(mocks.get).toHaveBeenCalledTimes(2);
    });

    it('shows validation and keeps form contents after a failed save', async () => {
        const user = userEvent.setup();
        mocks.save.mockRejectedValue(new Error('Server unavailable'));
        render(<PredictionFeedbackForm predictionId="prediction-id" />);
        await user.click(screen.getByRole('button', { name: /was this recommendation useful/i }));
        await screen.findByRole('radio', { name: 'Useful' });
        await user.click(screen.getByRole('radio', { name: 'Useful' }));
        await user.selectOptions(screen.getByLabelText(/action reported/i), 'OTHER');
        fireEvent.change(screen.getByLabelText(/optional note/i), { target: { value: 'Keep this text' } });
        await user.click(screen.getByRole('button', { name: 'Save Feedback' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
        expect(screen.getByLabelText(/optional note/i)).toHaveValue('Keep this text');
    });
});
