import { randomUUID } from 'node:crypto';
import { chmod, link, mkdir, rm, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { prisma } from '../../../config/prisma.js';
import { visitDatasetCandidatePages } from './dataset-export.repository.js';
import { createDatasetAccumulator } from './dataset-export.service.js';
import { serializeDataset } from './dataset-export.serializer.js';
import { MINIMUM_EXPORT_COHORT } from './dataset-export.types.js';

function parseArguments(args: string[]) {
    const values = new Map<string, string>();
    let dryRun = false;
    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (!arg) throw new Error('INVALID_ARGUMENT');
        if (arg === '--dry-run') dryRun = true;
        else if (arg.startsWith('--') && args[i + 1] && !args[i + 1]!.startsWith('--'))
            values.set(arg.slice(2), args[++i]!);
        else throw new Error(`INVALID_ARGUMENT: ${arg}`);
    }
    const clinicId = values.get('clinic-id');
    const fromValue = values.get('from');
    const toValue = values.get('to');
    const output = values.get('output');
    const minimumCohortSize = Number(values.get('minimum-cohort-size') ?? MINIMUM_EXPORT_COHORT);
    const format = (values.get('format') ?? (output ? extname(output).slice(1) : 'csv')) as
        | 'csv'
        | 'jsonl';
    if (!clinicId || !fromValue || !toValue || !output)
        throw new Error('REQUIRED: --clinic-id --from --to --output');
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(clinicId)) throw new Error('INVALID_CLINIC_ID');
    const from = new Date(fromValue);
    const to = new Date(toValue);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from >= to)
        throw new Error('INVALID_REPORTING_PERIOD');
    if (!['csv', 'jsonl'].includes(format)) throw new Error('INVALID_FORMAT');
    if (
        !Number.isSafeInteger(minimumCohortSize) ||
        minimumCohortSize < MINIMUM_EXPORT_COHORT ||
        minimumCohortSize > 100_000
    ) {
        throw new Error(
            `INVALID_MINIMUM_COHORT_SIZE: minimum is ${MINIMUM_EXPORT_COHORT}, maximum is 100000`
        );
    }
    return { clinicId, from, to, output: resolve(output), format, dryRun, minimumCohortSize };
}

async function writePrivateFile(path: string, contents: string) {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, contents, { flag: 'wx', mode: 0o600 });
        await chmod(temporary, 0o600);
        await link(temporary, path); // Fails safely if the explicit destination already exists.
        await unlink(temporary);
    } catch (error) {
        await rm(temporary, { force: true });
        throw error;
    }
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    if (process.env.PRAVAAH_ML_EXPORT_AUTHORIZED_CLINIC_ID !== options.clinicId) {
        throw new Error(
            'CLINIC_EXPORT_AUTHORIZATION_REQUIRED: authorized clinic scope must exactly match --clinic-id'
        );
    }
    const accumulator = createDatasetAccumulator(options);
    await visitDatasetCandidatePages({ ...options, onPage: accumulator.add });
    const result = accumulator.finish();
    const reportPath = `${options.output}.manifest.json`;
    if (!options.dryRun) {
        await mkdir(dirname(options.output), { recursive: true, mode: 0o700 });
        await chmod(dirname(options.output), 0o700);
        await writePrivateFile(options.output, serializeDataset(result.rows, options.format));
        try {
            await writePrivateFile(reportPath, `${JSON.stringify(result.report, null, 2)}\n`);
        } catch (error) {
            await rm(options.output, { force: true });
            throw error;
        }
    }
    // Aggregate-only output: no candidate or source identifiers are logged.
    process.stdout.write(
        `${JSON.stringify({ dryRun: options.dryRun, report: result.report, ...(options.dryRun ? { outputWouldBe: options.output } : { output: options.output, manifest: reportPath }) }, null, 2)}\n`
    );
}

main()
    .catch(async (error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : 'EXPORT_FAILED'}\n`);
        await prisma.$disconnect();
        process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
