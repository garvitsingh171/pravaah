import { describe, expect, it } from 'vitest';
import { listPatientsQuerySchema } from '../modules/patients/patient.validation.js';
import { listAppointmentsQuerySchema } from '../modules/appointments/appointment.validation.js';

describe.each([
    ['patients', listPatientsQuerySchema],
    ['appointments', listAppointmentsQuerySchema],
])('%s collection pagination validation', (_name, schema) => {
    it('defaults and accepts the maximum bounded page size', () => {
        expect(schema.parse({})).toMatchObject({ page: 1, limit: 20 });
        expect(schema.parse({ page: '500', limit: '100' })).toMatchObject({
            page: 500,
            limit: 100,
        });
    });

    it.each(['0', '-1', '1.5', 'abc', 'Infinity', 'NaN', '9007199254740992', '501', '01'])(
        'rejects invalid page %s',
        (page) => expect(schema.safeParse({ page }).success).toBe(false)
    );

    it.each(['0', '-10', '101', '100000', '1.5', 'abc', '9007199254740992'])(
        'rejects invalid limit %s',
        (limit) => expect(schema.safeParse({ limit }).success).toBe(false)
    );

    it('rejects arrays and unknown fields', () => {
        expect(schema.safeParse({ page: ['1', '2'] }).success).toBe(false);
        expect(schema.safeParse({ limit: ['20', '100'] }).success).toBe(false);
        expect(schema.safeParse({ sort: 'id' }).success).toBe(false);
    });
});
