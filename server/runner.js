import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const MAX_SOURCE = 24000;
const MAX_OUTPUT = 64000;
const TIMEOUT_MS = 3500;
const compilerCli = join(process.cwd(), 'node_modules', 'plainscript-lang', 'src', 'cli.js');

function rejectUnsafeSource(source) {
  const blocked = [
    /from\s+["']node:/i,
    /import\s*\(/i,
    /require\s*\(/i,
    /process\./i,
    /child_process/i,
    /readFile|writeFile|unlink|mkdir/i,
    /fetch\s*\(/i,
    /Deno\.|Bun\./i,
  ];
  return blocked.find((pattern) => pattern.test(source))?.source ?? null;
}

export async function runPlainScript(source) {
  if (typeof source !== 'string' || source.trim().length === 0) {
    return { ok: false, error: 'Write a PlainScript program before running it.' };
  }
  if (source.length > MAX_SOURCE) {
    return { ok: false, error: `Keep playground programs under ${MAX_SOURCE.toLocaleString()} characters.` };
  }
  const blockedPattern = rejectUnsafeSource(source);
  if (blockedPattern) {
    return { ok: false, error: 'This playground only allows language and standard-library examples. File, process, network, and dynamic imports are disabled.' };
  }

  const directory = await mkdtemp(join(tmpdir(), 'learnplainscript-'));
  const entry = join(directory, 'main.pln');
  await writeFile(join(directory, 'package.json'), JSON.stringify({ type: 'module' }), 'utf8');
  await writeFile(entry, source, 'utf8');
  await symlink(join(process.cwd(), 'node_modules'), join(directory, 'node_modules'), 'dir');

  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [compilerCli, 'run', entry], {
      cwd: directory,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=64',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const started = Date.now();
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rm(directory, { recursive: true, force: true }).catch(() => {});
      resolve({ ...result, durationMs: Date.now() - started });
    };
    const trimOutput = (value) => value.length > MAX_OUTPUT ? `${value.slice(0, MAX_OUTPUT)}\n… output truncated` : value;
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish({ ok: false, error: 'The program took too long to finish. Check for an infinite loop.' });
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT) child.kill('SIGKILL');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > MAX_OUTPUT) child.kill('SIGKILL');
    });
    child.on('error', (error) => finish({ ok: false, error: error.message }));
    child.on('close', (code) => {
      if (code === 0) finish({ ok: true, output: trimOutput(stdout), diagnostics: trimOutput(stderr) });
      else finish({ ok: false, error: trimOutput(stderr || stdout || `Program exited with code ${code}.`) });
    });
  });
}
