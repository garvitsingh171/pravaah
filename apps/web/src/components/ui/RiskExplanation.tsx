import type { RiskLevel } from '../../types';
import RiskBadge from './RiskBadge';

export type RiskReasonLike = {
    code?: unknown;
    message?: unknown;
    scoreImpact?: unknown;
};

export type RiskPredictionLike = {
    riskLevel: RiskLevel;
    score?: number;
    riskScore?: number;
    reasons?: unknown[];
    suggestedActions?: unknown;
    modelVersion?: string;
    generatedAt?: string;
    createdAt?: string;
};

type RiskExplanationProps = {
    prediction?: RiskPredictionLike | null;
    subjectName: string;
    compact?: boolean;
};

const humanDecisionNotice =
    'Pravaah provides explainable operational assistance. Final appointment and queue decisions remain with authorized clinic Admin or Staff users.';

const getRiskScore = (prediction: RiskPredictionLike): number | null => {
    const score = prediction.riskScore ?? prediction.score;

    return typeof score === 'number' && Number.isFinite(score) ? score : null;
};

const getReasonMessages = (reasons: unknown[] | undefined): string[] => {
    if (!Array.isArray(reasons)) {
        return [];
    }

    return reasons.reduce<string[]>((messages, reason) => {
        if (
            typeof reason === 'object' &&
            reason !== null &&
            'message' in reason &&
            typeof (reason as RiskReasonLike).message === 'string'
        ) {
            messages.push((reason as { message: string }).message);
            return messages;
        }

        if (typeof reason === 'string' && reason.trim()) {
            messages.push(reason);
        }

        return messages;
    }, []);
};

const getSuggestedActions = (actions: unknown): string[] => {
    if (!Array.isArray(actions)) {
        return [];
    }

    return actions.filter((action): action is string => {
        return typeof action === 'string' && action.trim().length > 0;
    });
};

const formatGeneratedAt = (value: string | undefined): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

function RiskExplanation({ prediction, subjectName, compact = false }: RiskExplanationProps) {
    if (!prediction) {
        return (
            <div className="rounded-md border border-app-border bg-app-surface-muted p-3 text-sm text-app-muted">
                No no-show risk data is available from the backend for {subjectName}. Treat this
                as unavailable information, not as low risk.
            </div>
        );
    }

    const score = getRiskScore(prediction);
    const reasonMessages = getReasonMessages(prediction.reasons);
    const suggestedActions = getSuggestedActions(prediction.suggestedActions);
    const generatedAt = formatGeneratedAt(prediction.generatedAt ?? prediction.createdAt);

    return (
        <details className="group rounded-md border border-app-border bg-white p-3 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
                <span>Risk explanation</span>
                <span className="text-xs text-app-muted group-open:hidden">Show</span>
                <span className="hidden text-xs text-app-muted group-open:inline">Hide</span>
            </summary>
            <div className="mt-3 space-y-3 text-app-muted">
                <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge riskLevel={prediction.riskLevel} />
                    {score !== null ? <span>Score {score}/100</span> : <span>Score unavailable</span>}
                </div>
                <p>
                    This is deterministic, rule-based appointment-flow support for {subjectName}.
                    It is not a diagnosis and it does not automatically cancel or reorder anything.
                </p>
                {generatedAt || prediction.modelVersion ? (
                    <p className="text-xs">
                        {prediction.modelVersion ? `Rule version: ${prediction.modelVersion}.` : ''}
                        {generatedAt ? ` Generated ${generatedAt}.` : ''}
                    </p>
                ) : null}
                {!compact ? (
                    <>
                        <div>
                            <p className="font-semibold text-app-text">Contributing factors</p>
                            {reasonMessages.length > 0 ? (
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {reasonMessages.map((reasonMessage, index) => (
                                        <li key={`${reasonMessage}-${index}`}>{reasonMessage}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2">No explanation reasons were returned.</p>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-app-text">Suggested staff actions</p>
                            {suggestedActions.length > 0 ? (
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {suggestedActions.map((action) => (
                                        <li key={action}>{action}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2">
                                    Use the clinic's normal communication and queue workflow.
                                </p>
                            )}
                        </div>
                    </>
                ) : null}
                <p className="rounded-md bg-app-surface-muted p-3 text-xs font-medium text-app-text">
                    {humanDecisionNotice}
                </p>
            </div>
        </details>
    );
}

export default RiskExplanation;
