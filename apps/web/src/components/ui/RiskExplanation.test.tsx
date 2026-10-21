import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const feedbackMocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../features/predictions/predictionFeedbackApi', () => ({
    getPredictionFeedback: feedbackMocks.get,
    savePredictionFeedback: feedbackMocks.save,
}));

import RiskExplanation from './RiskExplanation';

describe('RiskExplanation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        feedbackMocks.get.mockResolvedValue(null);
    });

    it('shows the stored score, factors, historical context, metadata, actions, and feedback entry', async () => {
        const user = userEvent.setup();
        render(
            <RiskExplanation
                subjectName="Asha Rao"
                timezone="Asia/Kolkata"
                prediction={{
                    id: 'run-1',
                    riskLevel: 'HIGH',
                    score: 75,
                    reasons: [
                        {
                            code: 'PREVIOUS_NO_SHOW_HISTORY',
                            message: 'Missed past visits.',
                            scoreImpact: 40,
                        },
                        {
                            code: 'STRONG_ATTENDANCE_HISTORY',
                            message: 'Completed visits.',
                            scoreImpact: -20,
                        },
                    ],
                    suggestedActions: ['Consider a manual call.'],
                    ruleVersion: 'rule-v7',
                    generationSource: 'APPOINTMENT_RESCHEDULED',
                    generatedAt: '2026-10-20T05:15:00.000Z',
                    predictionContext: { distanceFromClinicKm: 18.42 },
                }}
            />
        );

        await user.click(screen.getByText('Risk explanation'));
        expect(screen.getAllByText('Score 75/100')).toHaveLength(2);
        expect(
            screen.getByText(/rule-based operational indicator, not a calibrated probability/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Previous No-Shows')).toBeInTheDocument();
        expect(screen.getByText(/Increases risk/)).toHaveTextContent('+40 points');
        expect(screen.getByText(/Reduces risk/)).toHaveTextContent('-20 points');
        expect(screen.getByText('18.4 km')).toBeInTheDocument();
        expect(screen.getByText('rule-v7')).toBeInTheDocument();
        expect(screen.getByText('Appointment Rescheduled')).toBeInTheDocument();
        expect(screen.getByText('Consider a manual call.')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /was this recommendation useful/i })
        ).toBeInTheDocument();
    });

    it('shows unavailable values without fabricating missing score, factors, distance, or version', async () => {
        const user = userEvent.setup();
        render(
            <RiskExplanation
                subjectName="Asha Rao"
                prediction={{ riskLevel: 'LOW', score: Number.NaN, reasons: [], ruleVersion: null }}
            />
        );
        await user.click(screen.getByText('Risk explanation'));
        expect(screen.getAllByText('Score not available')).toHaveLength(2);
        expect(
            screen.getByText('Detailed contributing factors are not available for this assessment.')
        ).toBeInTheDocument();
        expect(screen.getByText('Distance considered:')).toHaveTextContent('Not available');
        expect(screen.getByText('Rule version:').parentElement).toHaveTextContent('Not available');
        expect(screen.getByText('Generated:').parentElement).toHaveTextContent('Not available');
        expect(
            screen.getByText(/no specific staff recommendations are available/i)
        ).toBeInTheDocument();
    });

    it.each([
        ['LOW', 0],
        ['LOW', 29],
        ['MEDIUM', 30],
        ['MEDIUM', 59],
        ['HIGH', 60],
        ['HIGH', 100],
    ] as const)('uses the supplied %s classification for stored score %i', (riskLevel, score) => {
        render(
            <RiskExplanation
                subjectName="Patient"
                compact
                disclosure={false}
                prediction={{ riskLevel, score }}
            />
        );

        const riskLabel = riskLevel === 'LOW' ? 'Low' : riskLevel === 'MEDIUM' ? 'Medium' : 'High';
        expect(screen.getByLabelText(`${riskLabel} no-show risk`)).toBeInTheDocument();
        expect(screen.getByText(`Score ${score}/100`)).toBeInTheDocument();
    });
});
