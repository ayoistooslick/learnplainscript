import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Trash2 } from 'lucide-react';
import { availableLessons } from './content.js';
import { Inline } from './highlight.jsx';
import { useRunner } from './runner.jsx';

/* ------------------------------------------------------------------
   The live board.

   Every board page is a sequence of strokes rather than a slide. The
   lesson data comes from src/content.js unchanged; the board only
   decides how to present it. Diagrams are drawn with animated SVG
   strokes, code is typed onto the board, the quiz is answerable on the
   board, and the specimen can be executed by the published compiler.
   Annotations are real pointer strokes, kept per lesson in this browser.
------------------------------------------------------------------- */

const MARKERS = [
  { id: 'chalk', label: 'Chalk', color: '#E8EFE6' },
  { id: 'mint', label: 'Mint', color: '#D9E7D2' },
  { id: 'amber', label: 'Amber', color: '#F0C882' },
  { id: 'coral', label: 'Coral', color: '#E8927A' },
];

const INK_KEY = 'learnplainscript.board.ink.v1';
const PAGE_LABELS = {
  title: 'Welcome',
  objectives: 'Objectives',
  concept: 'The idea',
  syntax: 'Syntax',
  example: 'Specimen',
  mistakes: 'Common mistakes',
  exercise: 'Exercise',
  question: 'Check',
};

function loadInk() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(INK_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function buildPages(lesson) {
  return [
    { kind: 'title', title: lesson.title, chapter: lesson.chapter, num: lesson.chapterNumber },
    { kind: 'objectives', items: lesson.objectives },
    { kind: 'concept', text: lesson.explanation },
    { kind: 'syntax', rows: lesson.syntax },
    { kind: 'example', code: lesson.example, expected: lesson.expectedOutput },
    { kind: 'mistakes', items: lesson.commonMistakes },
    { kind: 'exercise', text: lesson.exercise, starter: lesson.challenge?.starter || lesson.example, hint: lesson.challenge?.hint, expected: lesson.expectedOutput },
    { kind: 'question', quiz: lesson.quiz },
  ];
}

function diagramFor(lesson) {
  const text = `${lesson.title} ${lesson.explanation} ${lesson.id}`.toLowerCase();
  if (/class|constructor|object model/.test(text)) return 'class';
  if (/record|field|shape/.test(text)) return 'record';
  if (/list|map|collection|array/.test(text)) return 'list';
  if (/loop|each|while|generator/.test(text)) return 'loop';
  if (/when|condition|branch|flow|optional|nothing|error/.test(text)) return 'branch';
  return 'flow';
}

function Typewriter({ text, speed = 9 }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown('');
    setDone(false);
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{shown}{!done && <span className="caret" />}</span>;
}

/* A small library of hand-drawn-looking diagrams. Each shape is a stroke
   that draws itself when it enters the page. */
function BoardDiagram({ variant = 'flow' }) {
  const stroke = (delay) => ({
    className: 'wb-stroke',
    style: { animationDelay: `${delay}s` },
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    pathLength: 1,
  });
  const label = (x, y, text, delay) => (
    <text x={x} y={y} className="wb-diagram-label" style={{ animationDelay: `${delay}s` }} textAnchor="middle">{text}</text>
  );
  const arrow = (x1, y1, x2, y2) => (
    <>
      <path d={`M${x1} ${y1} L${x2} ${y2}`} {...stroke(0.55)} />
      <path d={`M${x2 - 9} ${y2 - 5} L${x2} ${y2} L${x2 - 9} ${y2 + 5}`} {...stroke(0.75)} />
    </>
  );

  if (variant === 'branch') {
    return (
      <div className="wb-diagram wb-diagram--board" aria-hidden="true">
        <svg viewBox="0 0 360 150" role="presentation">
          <rect x="12" y="52" width="92" height="46" rx="4" {...stroke(0.1)} />
          {label(58, 80, 'when', 0.25)}
          <path d="M104 75 L140 75 L140 32" {...stroke(0.3)} />
          <path d="M104 75 L140 75 L140 118" {...stroke(0.34)} />
          {arrow(140, 32, 178, 32)}
          {arrow(140, 118, 178, 118)}
          <rect x="182" y="12" width="150" height="42" rx="4" {...stroke(0.5)} />
          {label(257, 38, 'condition is true', 0.62)}
          <rect x="182" y="96" width="150" height="42" rx="4" {...stroke(0.56)} />
          {label(257, 122, 'otherwise … end', 0.68)}
        </svg>
      </div>
    );
  }

  if (variant === 'loop') {
    return (
      <div className="wb-diagram wb-diagram--board" aria-hidden="true">
        <svg viewBox="0 0 360 150" role="presentation">
          <rect x="18" y="34" width="118" height="50" rx="4" {...stroke(0.1)} />
          {label(77, 64, 'for each item', 0.24)}
          {arrow(136, 59, 186, 59)}
          <rect x="190" y="34" width="142" height="50" rx="4" {...stroke(0.45)} />
          {label(261, 64, 'body runs', 0.6)}
          <path d="M261 84 C261 126, 77 126, 77 90" {...stroke(0.7)} />
          <path d="M70 96 L77 88 L84 96" {...stroke(0.9)} />
          {label(169, 140, 'until the list is exhausted', 1.05)}
        </svg>
      </div>
    );
  }

  if (variant === 'record') {
    return (
      <div className="wb-diagram wb-diagram--board" aria-hidden="true">
        <svg viewBox="0 0 360 150" role="presentation">
          <rect x="40" y="12" width="180" height="124" rx="4" {...stroke(0.1)} />
          {label(130, 34, 'type Person', 0.24)}
          <path d="M54 46 L206 46" {...stroke(0.32)} />
          {label(130, 70, 'name: text', 0.44)}
          {label(130, 98, 'age: number', 0.56)}
          {label(130, 126, 'end', 0.68)}
          {arrow(224, 74, 266, 74)}
          <rect x="270" y="50" width="76" height="48" rx="4" {...stroke(0.84)} />
          {label(308, 79, '{ … }', 0.98)}
        </svg>
      </div>
    );
  }

  if (variant === 'class') {
    return (
      <div className="wb-diagram wb-diagram--board" aria-hidden="true">
        <svg viewBox="0 0 360 150" role="presentation">
          <rect x="54" y="10" width="230" height="132" rx="4" {...stroke(0.1)} />
          {label(169, 34, 'class Counter', 0.24)}
          <path d="M66 46 L272 46" {...stroke(0.3)} />
          {label(169, 70, 'value: number', 0.44)}
          <path d="M66 84 L272 84" {...stroke(0.5)} />
          {label(169, 106, 'next() → number', 0.62)}
          {label(169, 130, 'new Counter(2)', 0.76)}
          <path d="M284 76 L318 76" {...stroke(0.9)} />
          {label(330, 80, '3', 1.02)}
        </svg>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="wb-diagram wb-diagram--board" aria-hidden="true">
        <svg viewBox="0 0 360 150" role="presentation">
          {[0, 1, 2].map((index) => (
            <g key={index}>
              <rect x={38 + index * 78} y="42" width="62" height="52" rx="3" {...stroke(0.1 + index * 0.12)} />
              {label(69 + index * 78, 74, ['1', '2', '3'][index], 0.24 + index * 0.12)}
            </g>
          ))}
          {arrow(284, 68, 326, 68)}
          {label(318, 110, 'map(… * 2)', 0.78)}
          {label(180, 128, 'one value, transformed for each item', 0.94)}
        </svg>
      </div>
    );
  }

  return (
    <div className="wb-diagram wb-diagram--board" aria-hidden="true">
      <svg viewBox="0 0 360 150" role="presentation">
        <rect x="10" y="44" width="86" height="52" rx="4" {...stroke(0.1)} />
        {label(53, 75, 'value', 0.24)}
        {arrow(98, 70, 140, 70)}
        <rect x="144" y="34" width="92" height="72" rx="4" {...stroke(0.48)} />
        {label(190, 64, 'checker', 0.6)}
        {label(190, 88, 'reads type', 0.68)}
        {arrow(238, 70, 276, 70)}
        <rect x="280" y="44" width="70" height="52" rx="4" {...stroke(0.82)} />
        {label(315, 75, 'output', 0.96)}
        {label(180, 134, 'the contract is checked before anything runs', 1.1)}
      </svg>
    </div>
  );
}

function InkLayer({ paths, draft, enabled, onPointerDown, onPointerMove, onPointerUp }) {
  const points = (path) => path.points.map(([x, y]) => `${x * 1000},${y * 700}`).join(' ');
  return (
    <svg
      className={`wb-ink${enabled ? ' is-live' : ''}`}
      viewBox="0 0 1000 700"
      preserveAspectRatio="none"
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {paths.map((path, index) => (
        <polyline
          key={index}
          points={points(path)}
          fill="none"
          stroke={path.color}
          strokeWidth={path.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.92"
        />
      ))}
      {draft && (
        <polyline
          points={points(draft)}
          fill="none"
          stroke={draft.color}
          strokeWidth={draft.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

// The number of strokes a page writes. PageBody renders exactly this many
// elements, so playback and the toolbar readout stay in step with the board.
function strokeCount(page) {
  switch (page.kind) {
    case 'title': return 5;
    case 'objectives': return 1 + page.items.length;
    case 'concept': return 2;
    case 'syntax': return 1 + page.rows.length;
    case 'example': return 3;
    case 'mistakes': return 2 + page.items.length;
    case 'exercise': return 3;
    case 'question': return 4;
    default: return 1;
  }
}

function PageBody({ page, lesson, revealed, result, run, reset, quizChoice, chooseQuiz, diagram }) {
  const shown = (nodes) => nodes.slice(0, revealed);
  const running = result.status === 'running';
  const output = result.status === 'ok' ? result.output : result.status === 'error' ? result.error : '';

  if (page.kind === 'title') {
    return shown([
      <p className="wb-hand wb-kicker" key="a">Chapter {page.num} · {page.chapter}</p>,
      <h2 className="wb-hand wb-big" key="b">{page.title}</h2>,
      <p className="wb-hand" key="c">Welcome to lesson {page.num}. Read the board, then try the bench.</p>,
      <BoardDiagram key="d" variant={diagram} />,
      <p className="wb-hand wb-dim" key="e">Your notes are saved beneath the board. Press → for the next stroke.</p>,
    ]);
  }

  if (page.kind === 'objectives') {
    return shown([
      <p className="wb-hand wb-kicker" key="k">By the end of this lesson</p>,
      ...page.items.map((item, index) => (
        <p className="wb-hand wb-bullet" key={index}><Inline text={item} /></p>
      )),
    ]);
  }

  if (page.kind === 'concept') {
    return shown([
      <p className="wb-hand wb-concept" key="a"><Inline text={page.text} /></p>,
      <BoardDiagram key="b" variant={diagram} />,
    ]);
  }

  if (page.kind === 'syntax') {
    return shown([
      <p className="wb-hand wb-kicker" key="k">Each line, close up</p>,
      ...page.rows.map(([term, description], index) => (
        <p className="wb-hand wb-syntax" key={index}>
          <code className="wb-chip">{term.replace(/`/g, '')}</code>
          <span><Inline text={description} /></span>
        </p>
      )),
    ]);
  }

  if (page.kind === 'example') {
    return shown([
      <div className="wb-code-block" key="code"><Typewriter text={page.code} speed={9} /></div>,
      page.expected ? <p className="wb-hand" key="exp">Expected output: <code>{page.expected}</code></p> : <span key="exp" />,
      <div className="wb-run-row" key="run">
        <button type="button" className="wb-board-btn" onClick={() => run(lesson.example)} disabled={running}>
          <Play size={12} strokeWidth={2.4} aria-hidden="true" /> {running ? 'Running on the compiler…' : 'Run this on the board'}
        </button>
        {result.status !== 'idle' && <pre className={`wb-board-output ${result.status === 'error' ? 'is-error' : ''}`}>{output || 'The program finished without printing anything.'}</pre>}
      </div>,
    ]);
  }

  if (page.kind === 'mistakes') {
    return shown([
      <p className="wb-hand wb-kicker" key="k">Read these before you run it</p>,
      ...page.items.map((item, index) => (
        <p className="wb-hand wb-bullet wb-bullet--warn" key={index}><Inline text={item} /></p>
      )),
      <p className="wb-hand wb-dim" key="note">Break the specimen on purpose, read the diagnostic, then repair it.</p>,
    ]);
  }

  if (page.kind === 'exercise') {
    return shown([
      <p className="wb-hand" key="a"><Inline text={page.text} /></p>,
      <div className="wb-run-row" key="b">
        <button type="button" className="wb-board-btn" onClick={() => run(page.starter)} disabled={running}>
          <Play size={12} strokeWidth={2.4} aria-hidden="true" /> {running ? 'Running…' : 'Run the starter'}
        </button>
        <button type="button" className="wb-board-btn wb-board-btn--quiet" onClick={reset}>Clear</button>
        {result.status !== 'idle' && <pre className={`wb-board-output ${result.status === 'error' ? 'is-error' : ''}`}>{output || 'No output.'}</pre>}
      </div>,
      page.hint ? <p className="wb-hand wb-dim" key="hint">Hint: <Inline text={page.hint} /></p> : <span key="hint" />,
    ]);
  }

  if (page.kind === 'question') {
    return shown([
      <p className="wb-hand wb-question" key="q"><Inline text={page.quiz.question} /></p>,
      <div className="wb-board-options" key="options">
        {page.quiz.options.map((option, index) => {
          const answered = quizChoice !== null;
          const state = !answered ? '' : index === page.quiz.answer ? 'is-correct' : index === quizChoice ? 'is-wrong' : 'is-muted';
          return (
            <button
              key={option}
              type="button"
              className={`wb-board-option ${state}`}
              onClick={() => chooseQuiz(index)}
              disabled={answered}
            >
              <span>{String.fromCharCode(65 + index)}</span> {option}
            </button>
          );
        })}
      </div>,
      <div className="wb-board-feedback" key="feedback">
        {quizChoice === null ? (
          <p className="wb-hand wb-dim">Answer on the board. The lesson check is not graded elsewhere; this one is just for you.</p>
        ) : (
          <>
            <p className="wb-hand wb-check">{quizChoice === page.quiz.answer ? 'Correct.' : 'Not quite.'}</p>
            <p className="wb-hand wb-dim"><Inline text={page.quiz.explanation} /></p>
          </>
        )}
      </div>,
      <p className="wb-hand wb-dim" key="turn">Turn the page, then take the bench in the notebook.</p>,
    ]);
  }

  return null;
}

export function Whiteboard({ navigate, progress, saveNote, saveQuiz }) {
  const [lessonId, setLessonId] = useState(progress.lastLesson || availableLessons[0].id);
  const lesson = availableLessons.find((item) => item.id === lessonId) || availableLessons[0];
  const pages = buildPages(lesson);
  const diagram = diagramFor(lesson);

  const [pageIndex, setPageIndex] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [marker, setMarker] = useState(MARKERS[0]);
  const [tool, setTool] = useState('chalk');
  const [inkMode, setInkMode] = useState(false);
  const [note, setNote] = useState(progress.notes?.[lessonId] || '');
  const [quizChoice, setQuizChoice] = useState(null);
  // Ink is stored with the lesson it belongs to, so changing lesson cannot
  // write one board's annotations over another's.
  const [ink, setInk] = useState(() => ({ lesson: lessonId, paths: loadInk()[lessonId] || [] }));
  const paths = ink.lesson === lessonId ? ink.paths : [];
  const [draft, setDraft] = useState(null);
  const draftRef = useRef(null);
  const { result, run, reset } = useRunner();

  useEffect(() => {
    setNote(progress.notes?.[lessonId] || '');
    setPageIndex(0);
    setRevealed(1);
    setPlaying(false);
    setQuizChoice(null);
    setInk({ lesson: lessonId, paths: loadInk()[lessonId] || [] });
    setDraft(null);
    draftRef.current = null;
    reset();
    // progress.notes is read once per lesson, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, reset]);

  useEffect(() => {
    if (ink.lesson !== lessonId) return;
    try {
      const all = loadInk();
      all[ink.lesson] = ink.paths;
      window.localStorage.setItem(INK_KEY, JSON.stringify(all));
    } catch {
      // Annotations are a convenience; private browsing can refuse storage.
    }
  }, [ink, lessonId]);

  const page = pages[pageIndex];
  const total = strokeCount(page);
  const stateRef = useRef({ pageIndex, revealed, total });
  stateRef.current = { pageIndex, revealed, total };

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const current = stateRef.current;
      if (current.revealed < current.total) setRevealed(current.revealed + 1);
      else if (current.pageIndex < pages.length - 1) { setPageIndex(current.pageIndex + 1); setRevealed(1); setQuizChoice(null); reset(); }
      else setPlaying(false);
    }, 1900);
    return () => clearInterval(id);
  }, [playing, pages.length, reset]);

  const goToPage = (index) => {
    const next = Math.max(0, Math.min(pages.length - 1, index));
    setPageIndex(next);
    setRevealed(1);
    setQuizChoice(null);
    reset();
    return next;
  };

  const nextStroke = () => {
    if (revealed < total) { setRevealed(revealed + 1); return; }
    if (pageIndex < pages.length - 1) goToPage(pageIndex + 1);
  };

  const previousStroke = () => {
    if (pageIndex === 0 && revealed === 1) return;
    if (revealed > 1) { setRevealed(revealed - 1); return; }
    const previousIndex = pageIndex - 1;
    if (previousIndex >= 0) {
      setPageIndex(previousIndex);
      setRevealed(strokeCount(pages[previousIndex]));
      setQuizChoice(null);
      reset();
    }
  };

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); nextStroke(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); previousStroke(); }
      else if (event.key === ' ') { event.preventDefault(); setPlaying((value) => !value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const chooseQuiz = (index) => {
    if (quizChoice !== null) return;
    setQuizChoice(index);
    if (saveQuiz) saveQuiz(lesson.id, index === page.quiz.answer ? 1 : 0);
  };

  const pointerPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    ];
  };

  const startInk = (event) => {
    if (!inkMode) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const path = { color: marker.color, width: tool === 'marker' ? 8 : 3, points: [pointerPoint(event)] };
    draftRef.current = path;
    setDraft(path);
  };

  const moveInk = (event) => {
    if (!inkMode || !draftRef.current) return;
    const point = pointerPoint(event);
    const points = draftRef.current.points;
    const last = points[points.length - 1];
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < 0.004) return;
    const path = { ...draftRef.current, points: [...points, point] };
    draftRef.current = path;
    setDraft(path);
  };

  const endInk = () => {
    if (!draftRef.current) return;
    const path = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (path.points.length > 1) {
      setInk((current) => current.lesson === lessonId
        ? { lesson: current.lesson, paths: [...current.paths, path].slice(-250) }
        : current);
    }
  };

  return (
    <div className="whiteboard-page board-page">
      <div className="running-head"><span>Live classroom · Whiteboard</span><span>{lesson.title}</span></div>
      <div className="board-intro">
        <h1 className="page-title">The board,<br /><em>in strokes.</em></h1>
        <p>A teaching surface, not a slideshow. Content is written onto the board one stroke at a time. Draw on it with four markers, run the specimen against the real compiler, answer the check on the board, and keep notes underneath.</p>
      </div>

      <div className="board-toolbar" role="toolbar" aria-label="Whiteboard controls">
        <select className="wb-select" value={lessonId} onChange={(event) => setLessonId(event.target.value)} aria-label="Choose lesson">
          {availableLessons.map((item) => <option key={item.id} value={item.id}>{item.chapterNumber}. {item.title}</option>)}
        </select>
        <button type="button" className="btn-solid small" onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={12} strokeWidth={2.2} aria-hidden="true" /> : <Play size={12} strokeWidth={2.2} aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="btn-line small" onClick={nextStroke} disabled={pageIndex === pages.length - 1 && revealed >= total}>
          Next stroke <ChevronRight size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button type="button" className="btn-line small" onClick={previousStroke} disabled={pageIndex === 0 && revealed === 1}>
          <ChevronLeft size={13} strokeWidth={2.2} aria-hidden="true" /> Back
        </button>
        <span className="board-counter">
          {PAGE_LABELS[page.kind]} · page {pageIndex + 1}/{pages.length} · stroke {Math.min(revealed, total)}/{total}
        </span>

        <div className="marker-tray" role="group" aria-label="Marker colour">
          {MARKERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`marker-chip ${marker.id === item.id ? 'on' : ''}`}
              style={{ '--marker': item.color }}
              onClick={() => { setMarker(item); setInkMode(true); }}
              aria-label={`${item.label} marker`}
              aria-pressed={marker.id === item.id}
            ><span /></button>
          ))}
          <button type="button" className={`marker-style ${tool === 'chalk' ? 'on' : ''}`} onClick={() => setTool('chalk')} aria-pressed={tool === 'chalk'}>Chalk</button>
          <button type="button" className={`marker-style ${tool === 'marker' ? 'on' : ''}`} onClick={() => setTool('marker')} aria-pressed={tool === 'marker'}>Marker</button>
        </div>

        <button type="button" className={`btn-line small ${inkMode ? 'is-on' : ''}`} onClick={() => setInkMode((value) => !value)} aria-pressed={inkMode}>
          {inkMode ? 'Drawing on' : 'Draw on board'}
        </button>
        <button type="button" className="icon-btn" onClick={() => setInk({ lesson: lessonId, paths: [] })} aria-label="Clear board annotations" title="Clear annotations"><Trash2 size={14} strokeWidth={1.8} aria-hidden="true" /></button>
        <button type="button" className="icon-btn" onClick={() => setZoom((value) => !value)} aria-label={zoom ? 'Zoom out' : 'Zoom in'}>{zoom ? '−' : '+'}</button>
        <button type="button" className="link-quiet" onClick={() => navigate(`/learn/${lesson.id}`)}>Read the lesson ↗</button>
      </div>

      <div className={`wb-stage board-stage${zoom ? ' is-zoomed' : ''}${inkMode ? ' is-inking' : ''}`}>
        <div className="board-inner" key={`${lessonId}-${pageIndex}`}>
          <div className="wb-page-title">{PAGE_LABELS[page.kind]}</div>
          <div className="board-body">
            <PageBody
              page={page}
              lesson={lesson}
              revealed={revealed}
              result={result}
              run={run}
              reset={reset}
              quizChoice={quizChoice}
              chooseQuiz={chooseQuiz}
              diagram={diagram}
            />
          </div>
          <div className="wb-progress" aria-hidden="true">
            {pages.map((_, index) => <span key={index} className={index === pageIndex ? 'on' : index < pageIndex ? 'done' : ''} />)}
          </div>
        </div>
        <InkLayer
          paths={paths}
          draft={draft}
          enabled={inkMode}
          onPointerDown={startInk}
          onPointerMove={moveInk}
          onPointerUp={endInk}
        />
        {inkMode && <span className="board-ink-hint">Draw directly on the board · {paths.length} annotations</span>}
      </div>

      <div className="board-under">
        <div className="wb-notes">
          <p className="board-label">Your notes</p>
          <textarea value={note} onChange={(event) => { setNote(event.target.value); saveNote(lessonId, event.target.value); }} placeholder="Write what you notice on the board…" />
          <p className="board-note-hint">Saved in this browser for this lesson.</p>
        </div>
        <div className="board-help">
          <p className="board-label">At the board</p>
          <ul>
            <li><kbd>→</kbd> writes the next stroke</li>
            <li><kbd>←</kbd> steps back</li>
            <li><kbd>Space</kbd> plays or pauses</li>
            <li>Play advances a stroke every two seconds</li>
            <li>Drawings are kept per lesson in this browser</li>
            <li>The compiler is the same 2.3.1 build as the playground</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
