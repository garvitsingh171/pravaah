import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../generated/prisma/client.js';
import { withTransientDatabaseTransactionRetry } from './databaseRetry.js';

const transientTransactionError = () => ({
    code: 'P2024',
    message: 'Timed out fetching a new connection from the connection pool.',
});

describe('withTransientDatabaseTransactionRetry', () => {
    it('retries when the database rejects transaction acquisition', async () => {
        const transaction = vi
            .fn()
            .mockRejectedValueOnce(transientTransactionError())
            .mockImplementationOnce(
                async (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
                    callback({} as Prisma.TransactionClient)
            );
        const operation = vi.fn().mockResolvedValue('created');

        await expect(
            withTransientDatabaseTransactionRetry(
                (callback) => transaction(callback),
                async (tx) => operation(tx)
            )
        ).resolves.toBe('created');

        expect(transaction).toHaveBeenCalledTimes(2);
        expect(operation).toHaveBeenCalledTimes(1);
    }, 5_000);

    it('does not retry after the transaction callback has started', async () => {
        const transaction = vi.fn(
            async (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
                await callback({} as Prisma.TransactionClient);
                throw transientTransactionError();
            }
        );

        await expect(
            withTransientDatabaseTransactionRetry(
                (callback) => transaction(callback),
                async () => 'created'
            )
        ).rejects.toMatchObject({ code: 'P2024' });

        expect(transaction).toHaveBeenCalledTimes(1);
    });
});
