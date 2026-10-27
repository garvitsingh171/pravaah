import { spawnSync } from 'node:child_process';

const { assertSecurityTestDatabase } = await import('../tests/security/testDatabaseGuard.ts');
const databaseUrl = assertSecurityTestDatabase();
const action = process.argv[2];
const commands = {
    migrate: ['prisma', ['migrate', 'deploy']],
    test: ['vitest', ['run', '--config', 'vitest.security.config.ts']],
};
if (!Object.hasOwn(commands, action)) throw new Error('Use migrate or test');
const [binary, args] = commands[action];
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [binary, ...args], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
