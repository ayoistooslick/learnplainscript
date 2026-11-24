import test from 'node:test';
import assert from 'node:assert/strict';
import packageJson from '../package.json' with { type: 'json' };
import { chapters, availableLessons, plainWords, projects } from '../src/content.js';
import { runPlainScript } from '../server/runner.js';

test('curriculum has the requested 20 chapters and a useful supported path', () => {
  assert.equal(chapters.length, 20);
  assert.ok(availableLessons.length >= 20);
  assert.ok(availableLessons.every((lesson) => lesson.example && lesson.challenge && lesson.quiz));
  assert.ok(availableLessons.every((lesson) => lesson.commonMistakes?.length && lesson.exercise));
  assert.equal(chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => lesson.comingSoon).length, 0);
});

test('the learning product uses the verified PlainScript 2.3.1 package', () => {
  assert.equal(packageJson.dependencies['plainscript-lang'], '2.3.1');
});

test('every lesson has a plain-language summary for new readers', () => {
  assert.ok(availableLessons.every((lesson) => (plainWords[lesson.id] || '').length > 40));
});

test('project content is present', () => {
  assert.equal(projects.length, 3);
  assert.ok(projects.every((project) => project.requirements.length > 0 && project.criteria));
});

test('runner executes PlainScript through the published compiler', async () => {
  const result = await runPlainScript('#syntax 2.1\n\nimport { print } from "std/io"\nprint("test output")');
  assert.equal(result.ok, true);
  assert.equal(result.output.trim(), 'test output');
});

test('runner executes a PlainScript 2.3 class', async () => {
  const result = await runPlainScript('import { print } from "std/io"\nclass Counter\n    value: number\n    constructor(start: number)\n        this.value = start\n    end\n    function next() -> number\n        this.value += 1\n        return this.value\n    end\nend\nlet counter = new Counter(2)\nprint(counter.next())');
  assert.equal(result.ok, true, result.error);
  assert.equal(result.output.trim(), '3');
});

test('runner returns compiler feedback for invalid source', async () => {
  const result = await runPlainScript('#syntax 2.1\n\nvalue count: number is "not a number"');
  assert.equal(result.ok, false);
  assert.match(result.error, /error|number|type/i);
});
