import { AppointmentStatus } from '../../types';

export const DEFAULT_APPOINTMENT_PAGE_SIZE = 15;
export const MAX_APPOINTMENT_PAGE = 500;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AppointmentListQuery = {
    date: string;
    doctorId: string;
    patientId: string;
    status: AppointmentStatus | '';
    page: number;
    limit: number;
};

const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const positiveInteger = (value: string | null, maximum: number, fallback: number) =>
    value && /^[1-9]\d*$/.test(value) && Number(value) <= maximum ? Number(value) : fallback;

export function readAppointmentListQuery(search: string, today: string): AppointmentListQuery {
    const params = new URLSearchParams(search);
    const date = params.get('date');
    const status = params.get('status');
    const doctorId = params.get('doctorId') ?? '';
    const patientId = params.get('patientId') ?? '';
    return {
        date: date === 'all' ? '' : date && validDate(date) ? date : today,
        doctorId: uuidPattern.test(doctorId) ? doctorId : '',
        patientId: uuidPattern.test(patientId) ? patientId : '',
        status: Object.values(AppointmentStatus).includes(status as AppointmentStatus)
            ? (status as AppointmentStatus)
            : '',
        page: positiveInteger(params.get('page'), MAX_APPOINTMENT_PAGE, 1),
        limit: positiveInteger(params.get('limit'), 100, DEFAULT_APPOINTMENT_PAGE_SIZE),
    };
}

export function writeAppointmentListQuery(
    search: string,
    query: AppointmentListQuery,
    today: string
): string {
    const params = new URLSearchParams(search);
    for (const key of [
        'date',
        'doctorId',
        'patientId',
        'status',
        'page',
        'limit',
        'sort',
        'search',
    ]) {
        params.delete(key);
    }
    if (query.date !== today) params.set('date', query.date || 'all');
    if (query.doctorId) params.set('doctorId', query.doctorId);
    if (query.patientId) params.set('patientId', query.patientId);
    if (query.status) params.set('status', query.status);
    if (query.page !== 1) params.set('page', String(query.page));
    if (query.limit !== DEFAULT_APPOINTMENT_PAGE_SIZE) params.set('limit', String(query.limit));
    return params.toString();
}
