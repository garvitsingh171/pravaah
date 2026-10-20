import { useId } from 'react';
import type { PredictionGenerationSource, RiskLevel } from '../../types';
import { formatClinicDateTime } from '../../lib/clinicDateTime';
import PredictionFeedbackForm from '../../features/predictions/PredictionFeedbackForm';
import Badge from './Badge';
import RiskBadge from './RiskBadge';
import {
    formatGenerationSource,
    formatPredictionDistance,
    formatScoreImpact,
    getRiskDescription,
    normalizePredictionReasons,
    normalizeSuggestedActions,
} from './riskExplanationModel';

export type RiskReasonLike = {
    code?: unknown;
    message?: unknown;
    scoreImpact?: unknown;
};

export type RiskPredictionLike = {
    id?: string;
    riskLevel: RiskLevel;
    score?: number | null;
    riskScore?: number | null;
    reasons?: unknown;
    suggestedActions?: unknown;
    ruleVersion?: string | null;
    featureSchemaVersion?: string | null;
    generationSource?: PredictionGenerationSource | null;
    modelVersion?: string | null;
    generatedAt?: string | null;
    createdAt?: string | null;
    predictionContext?: { distanceFromClinicKm?: unknown } | null;
};

type RiskExplanationProps = {
    prediction?: RiskPredictionLike | null;
    subjectName: string;
    compact?: boolean;
    disclosure?: boolean;
    timezone?: string | null;
};

const fallbackTimezone = 'Asia/Kolkata';

function formatGeneratedAt(value: string | null | undefined, timezone?: string | null): string {
    if (!value || Number.isNaN(new Date(value).getTime())) return 'Not available';
    try {
        return `${formatClinicDateTime(value, timezone || fallbackTimezone)} ${timezone ? `(${timezone})` : '(Asia/Kolkata, clinic default)'}`;
    } catch {
        return `${formatClinicDateTime(value, fallbackTimezone)} (Asia/Kolkata fallback)`;
    }
}

function ExplanationContent({
    prediction,
    subjectName,
    compact,
    timezone,
    idPrefix,
}: Omit<RiskExplanationProps, 'disclosure'> & {
    prediction: RiskPredictionLike;
    idPrefix: string;
}) {
    const scoreCandidate = prediction.riskScore ?? prediction.score;
    const score =
        typeof scoreCandidate === 'number' && Number.isFinite(scoreCandidate)
            ? scoreCandidate
            : null;
    const factors = normalizePredictionReasons(prediction.reasons);
    const actions = normalizeSuggestedActions(prediction.suggestedActions);
    const ruleVersion = prediction.ruleVersion?.trim() || 'Not available';
    const generatedAt = formatGeneratedAt(prediction.generatedAt ?? prediction.createdAt, timezone);
    const distance = formatPredictionDistance(prediction.predictionContext?.distanceFromClinicKm);
    const source = formatGenerationSource(prediction.generationSource);

    return (
        <div className="space-y-4 text-sm text-app-muted">
            <section
                className="rounded-md border border-app-border bg-app-surface-muted p-4"
                aria-labelledby={`${idPrefix}-assessment-heading`}
            >
                <p
                    id={`${idPrefix}-assessment-heading`}
                    className="text-xs font-semibold uppercase tracking-wide text-app-muted"
                >
                    No-show risk assessment
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RiskBadge riskLevel={prediction.riskLevel} />
                    <Badge tone="neutral">
                        {score === null ? 'Score not available' : `Score ${score}/100`}
                    </Badge>
                </div>
                <p className="mt-2 max-w-2xl leading-6">
                    {getRiskDescription(prediction.riskLevel)}
                </p>
                <p className="mt-1 text-xs leading-5">
                    This is a rule-based score, not a calibrated probability. Factor impacts are
                    shown individually; the stored final score remains authoritative and is limited
                    to the supported 0–100 range.
                </p>
            </section>

            {!compact ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <section aria-labelledby={`${idPrefix}-factors-heading`}>
                        <h3
                            id={`${idPrefix}-factors-heading`}
                            className="font-semibold text-app-text"
                        >
                            Contributing factors
                        </h3>
                        {factors.length ? (
                            <ul className="mt-3 space-y-2">
                                {factors.map((factor) => {
                                    const impact = formatScoreImpact(factor.scoreImpact);
                                    return (
                                        <li
                                            key={factor.key}
                                            className="rounded-md border border-app-border bg-white p-3"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <h4 className="font-semibold text-app-text">
                                                    {factor.title}
                                                </h4>
                                                <Badge
                                                    tone={
                                                        factor.scoreImpact === null ||
                                                        factor.scoreImpact === 0
                                                            ? 'neutral'
                                                            : factor.scoreImpact > 0
                                                              ? 'warning'
                                                              : 'success'
                                                    }
                                                >
                                                    {impact.value}
                                                    {impact.direction
                                                        ? ` · ${impact.direction}`
                                                        : ''}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 leading-6">
                                                {factor.message ?? 'Description not available.'}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="mt-2 leading-6">
                                Detailed contributing factors are not available for this assessment.
                            </p>
                        )}
                    </section>

                    <section aria-labelledby={`${idPrefix}-actions-heading`}>
                        <h3
                            id={`${idPrefix}-actions-heading`}
                            className="font-semibold text-app-text"
                        >
                            Suggested staff actions
                        </h3>
                        {actions.length ? (
                            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-6">
                                {actions.map((action, index) => (
                                    <li key={`${action}-${index}`}>{action}</li>
                                ))}
                            </ol>
                        ) : (
                            <p className="mt-2 leading-6">
                                No specific staff recommendations are available for this assessment.
                            </p>
                        )}
                        <p className="mt-3 text-xs leading-5">
                            Recommendations are advisory. Staff decide whether to act; no patient or
                            appointment action is triggered automatically.
                        </p>
                    </section>
                </div>
            ) : null}

            <section
                className="grid gap-3 rounded-md border border-app-border bg-white p-4 sm:grid-cols-2"
                aria-label="Prediction context and details"
            >
                <div>
                    <h3 className="font-semibold text-app-text">Travel context</h3>
                    <p className="mt-1">
                        Distance considered:{' '}
                        <span className="font-semibold text-app-text">{distance}</span>
                    </p>
                    <p className="mt-1 text-xs leading-5">
                        Historical distance stored when this prediction was generated.
                    </p>
                </div>
                <div>
                    <h3 className="font-semibold text-app-text">Prediction details</h3>
                    <dl className="mt-1 space-y-1 text-xs leading-5">
                        <div>
                            <dt className="inline">Generated: </dt>
                            <dd className="inline">{generatedAt}</dd>
                        </div>
                        <div>
                            <dt className="inline">Rule version: </dt>
                            <dd className="inline">{ruleVersion}</dd>
                        </div>
                        <div>
                            <dt className="inline">Source: </dt>
                            <dd className="inline">{source}</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <p className="rounded-md border border-brand-soft bg-brand-subtle p-3 text-xs font-medium leading-5 text-app-text">
                This is guidance for clinic staff. A risk flag does not mean a patient will miss the
                appointment; staff remain responsible for decisions.
            </p>
            <PredictionFeedbackForm
                key={prediction.id ?? 'missing-prediction-id'}
                predictionId={prediction.id}
            />
            <span className="sr-only">Risk explanation for {subjectName}</span>
        </div>
    );
}

function RiskExplanation({
    prediction,
    subjectName,
    compact = false,
    disclosure = true,
    timezone,
}: RiskExplanationProps) {
    const idPrefix = `risk-explanation-${useId()}`;
    if (!prediction) {
        return (
            <div className="rounded-lg border border-dashed border-app-border-strong bg-app-surface-muted p-4 text-sm text-app-muted">
                <h3 className="font-semibold text-app-text">Risk information unavailable</h3>
                <p className="mt-1 leading-6">
                    No stored risk assessment is available for {subjectName}. Continue with normal
                    clinic operations.
                </p>
            </div>
        );
    }

    const scoreCandidate = prediction.riskScore ?? prediction.score;
    const score =
        typeof scoreCandidate === 'number' && Number.isFinite(scoreCandidate)
            ? scoreCandidate
            : null;
    const content = (
        <ExplanationContent
            prediction={prediction}
            subjectName={subjectName}
            compact={compact}
            timezone={timezone}
            idPrefix={idPrefix}
        />
    );

    if (!disclosure)
        return (
            <div className="rounded-lg border border-app-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                {content}
            </div>
        );

    return (
        <details className="group rounded-lg border border-app-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-app-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span>Risk explanation</span>
                    <RiskBadge riskLevel={prediction.riskLevel} />
                    <Badge tone="neutral">
                        {score === null ? 'Score not available' : `Score ${score}/100`}
                    </Badge>
                </span>
                <span className="shrink-0 text-xs text-app-muted group-open:hidden">Show</span>
                <span className="hidden shrink-0 text-xs text-app-muted group-open:inline">
                    Hide
                </span>
            </summary>
            <div className="mt-4">{content}</div>
        </details>
    );
}

export default RiskExplanation;
