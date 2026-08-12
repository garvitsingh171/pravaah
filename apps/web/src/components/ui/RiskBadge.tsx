import type { RiskLevel } from '../../types';
import Badge from './Badge';
import { riskPresentation } from './statusPresentation';

type RiskBadgeProps = {
    riskLevel?: RiskLevel | null;
};

function RiskBadge({ riskLevel }: RiskBadgeProps) {
    if (!riskLevel) {
        return (
            <Badge tone="neutral" aria-label="No-show risk level: Not available">
                Risk unavailable
            </Badge>
        );
    }

    const presentation = riskPresentation[riskLevel];

    return (
        <Badge tone={presentation.tone} aria-label={presentation.description}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {presentation.label}
        </Badge>
    );
}

export default RiskBadge;
