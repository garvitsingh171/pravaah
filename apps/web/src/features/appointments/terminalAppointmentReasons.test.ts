import { describe, expect, it } from 'vitest';
import { AppointmentStatus } from '../../types';
import { getTerminalReasonDisplay } from './terminalAppointmentReasons';

describe('getTerminalReasonDisplay', () => {
    it('renders saved structured reason and note labels', () => {
        expect(
            getTerminalReasonDisplay({
                status: AppointmentStatus.CANCELLED,
                cancellationReason: 'PATIENT_REQUEST',
                cancellationNote: 'Patient called reception.',
            })
        ).toEqual({
            label: 'Patient requested cancellation',
            note: 'Patient called reception.',
        });
        expect(
            getTerminalReasonDisplay({
                status: AppointmentStatus.NO_SHOW,
                noShowReason: 'UNKNOWN',
            })
        ).toEqual({ label: 'Reason unknown', note: null });
    });

    it('distinguishes legacy null from explicit UNKNOWN', () => {
        expect(
            getTerminalReasonDisplay({
                status: AppointmentStatus.NO_SHOW,
                noShowReason: null,
            })
        ).toEqual({ label: 'Reason not recorded', note: null });
    });
});
