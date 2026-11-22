import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const result = spawnSync(process.execPath, [
  resolve('node_modules/plainscript-lang/src/cli.js'),
  'check',
  'plainscript/lesson_math.pln',
], { encoding: 'utf8' });

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'PlainScript check failed.');
  process.exit(result.status || 1);
}
console.log('PlainScript 2.2.0 check passed.');
