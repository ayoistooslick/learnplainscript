import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const cli = resolve('node_modules/plainscript-lang/src/cli.js');
for (const fixture of ['plainscript/lesson_math.pln', 'plainscript/lesson_23_class.pln']) {
  const result = spawnSync(process.execPath, [cli, 'check', fixture], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `PlainScript check failed for ${fixture}.`);
    process.exit(result.status || 1);
  }
  console.log(`PlainScript 2.3.1 check passed: ${fixture}`);
}
