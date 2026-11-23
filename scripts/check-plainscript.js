import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { homepageSpecimen, playgroundExamples } from '../src/examples.js';
import { runPlainScript } from '../server/runner.js';

const cli = resolve('node_modules/plainscript-lang/src/cli.js');
let failed = false;

for (const fixture of ['plainscript/lesson_math.pln', 'plainscript/lesson_23_class.pln']) {
  const result = spawnSync(process.execPath, [cli, 'check', fixture], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `PlainScript check failed for ${fixture}.`);
    process.exit(result.status || 1);
  }
  console.log(`PlainScript 2.3.1 check passed: ${fixture}`);
}

const specimens = [...playgroundExamples, { id: 'homepage specimen', code: homepageSpecimen }];
for (const specimen of specimens) {
  const result = await runPlainScript(specimen.code);
  if (!result.ok) {
    failed = true;
    console.error(`Playground check failed: ${specimen.id}\n${result.error}`);
  } else {
    console.log(`Playground check passed: ${specimen.id}`);
  }
}

if (failed) process.exit(1);
