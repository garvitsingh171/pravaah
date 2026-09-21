import { z } from 'zod';

const normalizeEmptyValue = (value: unknown, emptyValue: undefined | null): unknown => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmedValue = value.trim();

    return trimmedValue || emptyValue;
};

export const optionalNormalizedText = (maxLength: number, label: string) =>
    z.preprocess(
        (value) => normalizeEmptyValue(value, undefined),
        z
            .string()
            .max(maxLength, `${label} must be ${maxLength} characters or fewer`)
            .optional()
    );

export const nullableNormalizedText = (maxLength: number, label: string) =>
    z.preprocess(
        (value) => normalizeEmptyValue(value, null),
        z
            .string()
            .max(maxLength, `${label} must be ${maxLength} characters or fewer`)
            .nullable()
            .optional()
    );

export const normalizedText = (maxLength: number, label: string) =>
    z.preprocess(
        (value) => (typeof value === 'string' ? value.trim() : value),
        z
            .string()
            .min(1, `${label} is required`)
            .max(maxLength, `${label} must be ${maxLength} characters or fewer`)
    );

export const countryWithDefaultIndia = z.preprocess(
    (value) => normalizeEmptyValue(value, undefined),
    z
        .string()
        .max(100, 'Country must be 100 characters or fewer')
        .default('India')
);

export const refineIndiaPincode = (
    data: {
        country?: string | null | undefined;
        pincode?: string | null | undefined;
    },
    context: z.RefinementCtx
): void => {
    if (
        data.country?.trim().toLowerCase() === 'india' &&
        data.pincode !== undefined &&
        data.pincode !== null &&
        !/^\d{6}$/.test(data.pincode)
    ) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['pincode'],
            message: 'Indian pincodes must contain exactly 6 digits',
        });
    }
};
