import { describe, expect, it } from 'vitest';
import { AppointmentStatus } from '../../types';
import { readAppointmentListQuery, writeAppointmentListQuery } from './appointmentListQuery';

const today = '2026-10-28';
const doctorId = '11111111-1111-4111-8111-111111111111';

describe('appointment list URL state', () => {
    it('restores supported criteria and leaves unrelated parameters intact', () => {
        const search = `?date=2026-10-27&status=CONFIRMED&doctorId=${doctorId}&page=3&limit=50&view=compact`;
        const query = readAppointmentListQuery(search, today);
        expect(query).toEqual({
            date: '2026-10-27',
            doctorId,
            patientId: '',
            status: AppointmentStatus.CONFIRMED,
            page: 3,
            limit: 50,
        });
        expect(writeAppointmentListQuery(search, query, today)).toContain('view=compact');
    });

    it('normalizes invalid and unsupported values without forwarding them to the API', () => {
        const query = readAppointmentListQuery(
            '?date=2026-02-30&status=UNKNOWN&doctorId=other-clinic&page=999&limit=0&sort=recent&search=private',
            today
        );
        expect(query).toEqual({
            date: today,
            doctorId: '',
            patientId: '',
            status: '',
            page: 1,
            limit: 15,
        });
        expect(writeAppointmentListQuery('', query, today)).toBe('');
    });

    it('represents all dates explicitly and omits default page values', () => {
        const query = readAppointmentListQuery('?date=all&page=2', today);
        expect(query.date).toBe('');
        expect(writeAppointmentListQuery('', { ...query, page: 1 }, today)).toBe('date=all');
    });
});
