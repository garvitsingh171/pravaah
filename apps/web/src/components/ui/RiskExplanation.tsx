import type { RiskLevel } from '../../types';
import Badge from './Badge';
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
            <div className="rounded-lg border border-dashed border-app-border-strong bg-app-surface-muted p-4 text-sm text-app-muted">
                <p className="font-semibold text-app-text">Risk data unavailable</p>
                <p className="mt-1 leading-6">
                    No no-show risk data is available from the backend for {subjectName}. Treat this
                    as unavailable information, not as low risk.
                </p>
            </div>
        );
    }

    const score = getRiskScore(prediction);
    const reasonMessages = getReasonMessages(prediction.reasons);
    const suggestedActions = getSuggestedActions(prediction.suggestedActions);
    const generatedAt = formatGeneratedAt(prediction.generatedAt ?? prediction.createdAt);

    return (
        <details className="group rounded-lg border border-app-border bg-white p-4 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span>Risk explanation</span>
                    <RiskBadge riskLevel={prediction.riskLevel} />
                    {score !== null ? <Badge tone="neutral">Score {score}/100</Badge> : null}
                </span>
                <span className="shrink-0 text-xs text-app-muted group-open:hidden">Show</span>
                <span className="hidden shrink-0 text-xs text-app-muted group-open:inline">
                    Hide
                </span>
            </summary>
            <div className="mt-4 space-y-4 text-app-muted">
                <div className="rounded-md border border-app-border bg-app-surface-muted p-3">
                    <p className="text-sm font-semibold text-app-text">
                        Deterministic assistance for {subjectName}
                    </p>
                    <p className="mt-1 text-sm leading-6">
                        This is rule-based appointment-flow support. It is not a diagnosis and it
                        does not automatically cancel, contact, or reorder anything.
                    </p>
                    {generatedAt || prediction.modelVersion ? (
                        <p className="mt-2 text-xs">
                            {prediction.modelVersion
                                ? `Rule version: ${prediction.modelVersion}.`
                                : ''}
                            {generatedAt ? ` Generated ${generatedAt}.` : ''}
                        </p>
                    ) : null}
                </div>
                {!compact ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="font-semibold text-app-text">Why this level?</p>
                            {reasonMessages.length > 0 ? (
                                <ul className="mt-3 space-y-2">
                                    {reasonMessages.map((reasonMessage, index) => (
                                        <li
                                            key={`${reasonMessage}-${index}`}
                                            className="flex gap-2 leading-6"
                                        >
                                            <span
                                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                                                aria-hidden="true"
                                            />
                                            <span>{reasonMessage}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 leading-6">
                                    No explanation reasons were returned.
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-app-text">Suggested staff attention</p>
                            {suggestedActions.length > 0 ? (
                                <ul className="mt-3 space-y-2">
                                    {suggestedActions.map((action) => (
                                        <li key={action} className="flex gap-2 leading-6">
                                            <span
                                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-status-warning-text)]"
                                                aria-hidden="true"
                                            />
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 leading-6">
                                    Use the clinic's normal communication and queue workflow.
                                </p>
                            )}
                        </div>
                    </div>
                ) : null}
                <p className="rounded-md border border-brand-soft bg-brand-subtle p-3 text-xs font-medium leading-5 text-app-text">
                    {humanDecisionNotice}
                </p>
            </div>
        </details>
    );
}

export default RiskExplanation;
