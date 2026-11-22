import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, availableLessons, flashcards, projects } from '../src/content.js';
import { runPlainScript } from '../server/runner.js';

test('curriculum has the requested 20 chapters and a useful supported path', () => {
  assert.equal(chapters.length, 20);
  assert.ok(availableLessons.length >= 15);
  assert.ok(availableLessons.every((lesson) => lesson.example && lesson.challenge && lesson.quiz));
  assert.ok(chapters.some((chapter) => chapter.lessons.some((lesson) => lesson.comingSoon)));
});

test('review and project content is present', () => {
  assert.equal(flashcards.length, 7);
  assert.equal(projects.length, 3);
  assert.ok(projects.every((project) => project.requirements.length > 0 && project.criteria));
});

test('runner executes PlainScript through the published compiler', async () => {
  const result = await runPlainScript('#syntax 2.1\n\nimport { print } from "std/io"\nprint("test output")');
  assert.equal(result.ok, true);
  assert.equal(result.output.trim(), 'test output');
});

test('runner returns compiler feedback for invalid source', async () => {
  const result = await runPlainScript('#syntax 2.1\n\nvalue count: number is "not a number"');
  assert.equal(result.ok, false);
  assert.match(result.error, /error|number|type/i);
});
