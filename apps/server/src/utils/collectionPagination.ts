import { z } from 'zod';

const positiveInteger = z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive integer')
    .transform(Number);

export const MAX_COLLECTION_PAGE = 500;

export const pageSchema = positiveInteger.pipe(z.number().int().min(1).max(MAX_COLLECTION_PAGE));
export const limitSchema = positiveInteger.pipe(z.number().int().min(1).max(100));

export const paginationQueryFields = {
    page: pageSchema.default(1),
    limit: limitSchema.default(20),
};

export const paginationOffset = ({ page, limit }: { page: number; limit: number }) =>
    (page - 1) * limit;
