const topicMap = {
  'why-plainscript': ['foundations', 'language design'],
  'first-program': ['foundations', 'functions'],
  'syntax-structure': ['syntax', 'foundations'],
  values: ['values', 'state'],
  types: ['types', 'values'],
  operators: ['expressions', 'syntax'],
  'control-flow': ['control flow', 'syntax'],
  functions: ['functions', 'foundations'],
  records: ['records', 'data'],
  iteration: ['collections', 'data'],
  modules: ['modules', 'interop'],
  errors: ['error handling', 'reliability'],
  async: ['async', 'interop'],
  regex: ['text', 'standard library'],
  jsx: ['jsx', 'interop'],
  react: ['react', 'interop'],
  interop: ['interop', 'modules'],
  bridges: ['interop', 'reliability'],
  classes: ['objects', 'state'],
  generators: ['collections', 'async'],
  'typed-errors': ['error handling', 'reliability'],
  toolchain: ['tooling', 'reliability'],
};

const stageMap = {
  'why-plainscript': 'evergreen',
  'first-program': 'evergreen',
  'syntax-structure': 'evergreen',
  values: 'evergreen',
  types: 'evergreen',
  operators: 'evergreen',
  'control-flow': 'evergreen',
  functions: 'evergreen',
  records: 'evergreen',
  iteration: 'evergreen',
  modules: 'evergreen',
  errors: 'budding',
  async: 'budding',
  regex: 'budding',
  jsx: 'budding',
  react: 'budding',
  interop: 'budding',
  bridges: 'seedling',
  classes: 'budding',
  generators: 'budding',
  'typed-errors': 'budding',
  toolchain: 'evergreen',
};

export const gardenStages = [
  { id: 'evergreen', label: 'Evergreen', description: 'Established material with a settled path.' },
  { id: 'budding', label: 'Budding', description: 'A growing area with room for more examples.' },
  { id: 'seedling', label: 'Seedling', description: 'A small first look at a larger idea.' },
];

export function lessonTopics(lesson) {
  return topicMap[lesson.id] || [lesson.chapter.toLowerCase()];
}

export function lessonStage(lesson) {
  return stageMap[lesson.id] || 'evergreen';
}

export function relatedLessons(lesson, lessons) {
  const topics = new Set(lessonTopics(lesson));
  return lessons
    .filter((candidate) => candidate.id !== lesson.id)
    .map((candidate) => ({ lesson: candidate, score: lessonTopics(candidate).filter((topic) => topics.has(topic)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.lesson.id.localeCompare(b.lesson.id))
    .slice(0, 4)
    .map(({ lesson: candidate }) => candidate);
}

export function topicList(lessons) {
  return [...new Set(lessons.flatMap(lessonTopics))].sort((a, b) => a.localeCompare(b));
}
