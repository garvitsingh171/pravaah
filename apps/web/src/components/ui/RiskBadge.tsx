import type { RiskLevel } from '../../types';
import Badge from './Badge';
import { riskPresentation } from './statusPresentation';

type RiskBadgeProps = {
    riskLevel?: RiskLevel | null;
};

function RiskBadge({ riskLevel }: RiskBadgeProps) {
    if (!riskLevel) {
        return <span className="text-sm text-app-subtle">Not available</span>;
    }

    const presentation = riskPresentation[riskLevel];

    return (
        <Badge tone={presentation.tone} aria-label={presentation.description}>
            {presentation.label}
        </Badge>
    );
}

export default RiskBadge;
