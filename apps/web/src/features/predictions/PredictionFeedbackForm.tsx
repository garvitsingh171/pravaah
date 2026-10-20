import { useEffect, useState, type FormEvent } from 'react';
import { ApiClientError } from '../../lib/apiClient';
import {
    getPredictionFeedback,
    savePredictionFeedback,
    type PredictionFeedback,
    type PredictionFeedbackAction,
    type PredictionFeedbackUsefulness,
} from './predictionFeedbackApi';

const usefulnessOptions: { value: PredictionFeedbackUsefulness; label: string }[] = [
    { value: 'USEFUL', label: 'Useful' },
    { value: 'NOT_USEFUL', label: 'Not useful' },
    { value: 'UNSURE', label: 'Unsure' },
];
const actionOptions: { value: PredictionFeedbackAction; label: string }[] = [
    { value: 'CONTACTED_PATIENT', label: 'Contacted patient' },
    { value: 'REMINDER_SENT', label: 'Reminder sent' },
    { value: 'ATTENDANCE_CONFIRMED', label: 'Attendance intention confirmed' },
    { value: 'RESCHEDULED_APPOINTMENT', label: 'Rescheduling arranged' },
    { value: 'MONITORED_APPOINTMENT', label: 'Monitored appointment' },
    { value: 'NO_ACTION', label: 'No action' },
    { value: 'OTHER', label: 'Other' },
];

export default function PredictionFeedbackForm({ predictionId }: { predictionId?: string | null }) {
    const [opened, setOpened] = useState(false);
    const [feedback, setFeedback] = useState<PredictionFeedback | null>(null);
    const [usefulness, setUsefulness] = useState<PredictionFeedbackUsefulness | ''>('');
    const [actionTaken, setActionTaken] = useState<PredictionFeedbackAction | ''>('');
    const [note, setNote] = useState('');
    const [loadedPredictionId, setLoadedPredictionId] = useState<string | null>(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!opened || !predictionId || loadedPredictionId === predictionId) return;
        const controller = new AbortController();
        getPredictionFeedback(predictionId, controller.signal).then((loaded) => {
            if (controller.signal.aborted) return;
            setFeedback(loaded);
            setUsefulness(loaded?.usefulness ?? '');
            setActionTaken(loaded?.actionTaken ?? '');
            setNote(loaded?.note ?? '');
            setError('');
            setLoadedPredictionId(predictionId);
        }).catch((cause: unknown) => {
            if (!controller.signal.aborted) {
                setError(cause instanceof Error ? cause.message : 'Could not load feedback.');
            }
        });
        return () => controller.abort();
    }, [opened, predictionId, loadedPredictionId, loadAttempt]);

    if (!predictionId) return <p className="mt-4 text-sm text-slate-500">Feedback is unavailable because this risk assessment has no prediction run ID.</p>;

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!predictionId || !usefulness || !actionTaken || saving) return;
        setSaving(true);
        setError('');
        setMessage('');
        try {
            const saved = await savePredictionFeedback(predictionId, {
                usefulness,
                actionTaken,
                ...(note.trim() ? { note: note.trim() } : {}),
            });
            setFeedback(saved);
            setMessage('Feedback saved. This records staff feedback only; it does not change the appointment or queue.');
        } catch (cause) {
            setError(cause instanceof ApiClientError || cause instanceof Error ? cause.message : 'Could not save feedback. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4" aria-label="Recommendation feedback">
            <button type="button" aria-expanded={opened} onClick={() => setOpened((value) => !value)} className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                {opened ? 'Hide feedback' : feedback ? 'View or update feedback' : 'Was this recommendation useful?'}
            </button>
            {opened ? loadedPredictionId !== predictionId ? error ? (
                <div className="mt-3 space-y-2">
                    <p role="alert" className="text-sm text-red-700">Could not load your saved feedback: {error}</p>
                    <button type="button" onClick={() => { setError(''); setLoadAttempt((attempt) => attempt + 1); }} className="text-sm font-semibold text-blue-700 underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Retry loading feedback</button>
                </div>
            ) : <p role="status" className="mt-3 text-sm text-slate-600">Loading your feedback…</p> : (
                <form className="mt-4 space-y-4" onSubmit={submit}>
                    <fieldset>
                        <legend className="text-sm font-semibold text-slate-800">Was the recommendation useful?</legend>
                        <div className="mt-2 flex flex-wrap gap-4">
                            {usefulnessOptions.map((option) => <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="radio" name={`usefulness-${predictionId}`} value={option.value} checked={usefulness === option.value} onChange={() => setUsefulness(option.value)} required />
                                {option.label}
                            </label>)}
                        </div>
                    </fieldset>
                    <label className="block text-sm font-semibold text-slate-800">Action reported
                        <select className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal" value={actionTaken} onChange={(event) => setActionTaken(event.target.value as PredictionFeedbackAction | '')} required>
                            <option value="">Choose an action</option>
                            {actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-semibold text-slate-800">Optional note
                        <textarea className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} aria-describedby={`feedback-note-count-${predictionId}`} />
                        <span id={`feedback-note-count-${predictionId}`} className="mt-1 block text-xs font-normal text-slate-500">{note.length}/500 characters. Avoid sensitive patient details.</span>
                    </label>
                    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
                    {message ? <p role="status" className="text-sm text-green-700">{message}</p> : null}
                    <button type="submit" disabled={saving || !usefulness || !actionTaken} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : feedback ? 'Update Feedback' : 'Save Feedback'}</button>
                </form>
            ) : null}
        </section>
    );
}
