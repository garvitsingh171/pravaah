import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LifecycleRail from './LifecycleRail';

const steps = ['Scheduled', 'Confirmed', 'Arrived', 'In queue', 'Called', 'Completed'].map(
    (label, index) => ({ id: `step-${index}`, label, description: `${label} appointment stage` })
);

describe('LifecycleRail', () => {
    it('shows all six semantic step labels and marks the active step', () => {
        render(<LifecycleRail steps={steps} currentStepId="step-3" layout="compact" />);
        const rail = screen.getByRole('list', { name: 'Workflow lifecycle' });
        expect(rail.children).toHaveLength(6);
        expect(rail).toHaveStyle({
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
        });
        expect(screen.getByText('In queue').closest('[aria-current="step"]')).toBeInTheDocument();
        expect(screen.getByText('Scheduled appointment stage')).toBeInTheDocument();
    });

    it('keeps the shared default layout available', () => {
        render(<LifecycleRail steps={steps} currentStepId="step-0" />);
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Scheduled').closest('[aria-current="step"]')).toBeInTheDocument();
    });
});
