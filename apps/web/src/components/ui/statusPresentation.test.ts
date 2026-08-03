import { describe, expect, it } from 'vitest';
import { AppointmentStatus, QueueStatus, RiskLevel } from '../../types';
import {
    appointmentStatusPresentation,
    getAppointmentStatusLabel,
    getQueueStatusLabel,
    queueStatusPresentation,
    riskPresentation,
} from './statusPresentation';

describe('statusPresentation', () => {
    it('standardizes appointment and queue labels for user-facing badges', () => {
        expect(getAppointmentStatusLabel(AppointmentStatus.IN_QUEUE)).toBe('In Queue');
        expect(getAppointmentStatusLabel(AppointmentStatus.NO_SHOW)).toBe('No Show');
        expect(getQueueStatusLabel(QueueStatus.NO_SHOW)).toBe('No Show');
    });

    it('keeps final states and risk states on semantic tones', () => {
        expect(appointmentStatusPresentation[AppointmentStatus.COMPLETED].tone).toBe('success');
        expect(queueStatusPresentation[QueueStatus.CANCELLED].tone).toBe('neutral');
        expect(riskPresentation[RiskLevel.HIGH]).toEqual({
            label: 'High Risk',
            tone: 'danger',
            description: 'High no-show risk',
        });
    });
});
