import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, Menu, Play, RotateCcw, X, BookOpen, ClipboardList, LayoutDashboard, GraduationCap, Terminal, FolderKanban, TrendingUp } from 'lucide-react';
import { availableLessons, chapters, flashcards, projects } from './content.js';
import { homepageSpecimen, playgroundExamples } from './examples.js';
import { CodeSpecimen, Inline, Tokens } from './highlight.jsx';
import { Editor } from './editor.jsx';
import { Output, useRunner } from './runner.jsx';
import { Whiteboard } from './board.jsx';
import { PredictRun, TryIt } from './interactive.jsx';
import './styles.css';

// The classroom scene is a separate chunk: phones and reduced-motion
// visitors do not pay for Three.js until the room is on screen.
const ClassroomScene = lazy(() => import('./scene.jsx'));

const STORAGE_KEY = 'learnplainscript.progress.v1';
const defaultProgress = {
  completedLessons: [],
  completedChallenges: [],
  quizScores: {},
  examAnswers: {},
  lastLesson: 'why-plainscript',
  flashcardIndex: 0,
  reviewedCards: [],
  notes: {},
};

const PLATES = {
  portrait: { src: '/plates/plate-portrait.jpg', title: 'Second sight', medium: 'riso / halftone', alt: 'Halftone portrait with violet and ember riso windows printed across the eyes' },
  eye: { src: '/plates/plate-eye.jpg', title: 'Close reading', medium: 'duotone / grain', alt: 'Halftone eye printed in ember and violet on warm paper' },
  figure: { src: '/plates/plate-figure.jpg', title: 'Turned away', medium: 'photocopy / halftone', alt: 'Halftone figure turned away against black' },
  chrome: { src: '/plates/plate-chrome.jpg', title: 'Machine surface', medium: 'render / halftone', alt: 'Chrome knot with violet rim light on black' },
  hands: { src: '/plates/plate-hands.jpg', title: 'Hand to hand', medium: 'screenprint / halftone', alt: 'Two halftone hands reaching toward each other with violet and ember ink' },
  voice: { src: '/plates/plate-voice.jpg', title: 'Speaking plainly', medium: 'riso / duotone', alt: 'Halftone mouth with a violet and ember riso plate across the lips' },
  sheet: { src: '/plates/plate-sheet.jpg', title: 'The sheet', medium: 'screenprint / halftone', alt: 'Two halftone hands folding a printed sheet over violet and ember ink plates' },
  type: { src: '/plates/plate-type.jpg', title: 'Sort P', medium: 'letterpress / halftone', alt: 'A violet letterpress P inked on a dark metal block with ember powder' },
};

const CHAPTER_PLATES = ['portrait','sheet','voice','type','chrome','hands','eye','figure','type','sheet','chrome','voice','hands','eye','figure','portrait','sheet','hands','chrome','voice'];
const CROPS = ['50% 32%', '50% 45%', '40% 50%', '58% 38%', '50% 55%'];
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];

function plateForChapter(number) { return CHAPTER_PLATES[(Number(number) - 1) % CHAPTER_PLATES.length] || 'figure'; }

/* ---------- progress ---------- */
function loadProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...defaultProgress, ...saved } : defaultProgress;
  } catch { return defaultProgress; }
}
function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}
  }, [progress]);
  const completeLesson = (id) => setProgress((c) => ({ ...c, completedLessons: c.completedLessons.includes(id) ? c.completedLessons : [...c.completedLessons, id], lastLesson: id }));
  const completeChallenge = (id) => setProgress((c) => ({ ...c, completedChallenges: c.completedChallenges.includes(id) ? c.completedChallenges : [...c.completedChallenges, id] }));
  const saveQuiz = (id, score) => setProgress((c) => ({ ...c, quizScores: { ...c.quizScores, [id]: score }, lastLesson: id }));
  const recordExam = (id, correct) => setProgress((c) => ({ ...c, examAnswers: { ...c.examAnswers, [id]: correct } }));
  const markReviewed = (id) => setProgress((c) => ({ ...c, reviewedCards: c.reviewedCards.includes(id) ? c.reviewedCards : [...c.reviewedCards, id] }));
  const setCardIndex = (index) => setProgress((c) => ({ ...c, flashcardIndex: index }));
  const saveNote = (key, value) => setProgress((c) => ({ ...c, notes: { ...c.notes, [key]: value } }));
  const resetProgress = () => setProgress(defaultProgress);
  return { progress, completeLesson, completeChallenge, saveQuiz, recordExam, markReviewed, setCardIndex, saveNote, resetProgress };
}

/* ---------- shared ---------- */
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, className: `reveal${shown ? ' in' : ''}` };
}
function Reveal({ children, className = '' }) {
  const reveal = useReveal();
  return <div ref={reveal.ref} className={`${reveal.className} ${className}`.trim()}>{children}</div>;
}
function Wordmark({ navigate }) {
  return (
    <button type="button" className="top-brand" onClick={() => navigate('/')}>
      <span className="wm-square" aria-hidden="true" /> LearnPlainScript<span className="dot">.</span>
    </button>
  );
}
function NavLink({ active, onClick, children, prefix, icon: Icon }) {
  return (
    <button type="button" className={`nav-link${active ? ' active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {Icon && <Icon size={15} strokeWidth={1.7} aria-hidden="true" />}
      {prefix && <span className="nx">{prefix}</span>}
      <span>{children}</span>
    </button>
  );
}
function Rail({ path, navigate, progress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const items = [
    { to: '/', label: 'Classroom', icon: LayoutDashboard },
    { to: '/learn', label: 'Notebook', icon: BookOpen },
    { to: '/whiteboard', label: 'Whiteboard', icon: GraduationCap },
    { to: '/quiz', label: 'Practice', icon: ClipboardList },
    { to: '/playground', label: 'Playground', icon: Terminal },
    { to: '/projects', label: 'Assignments', icon: FolderKanban },
    { to: '/progress', label: 'My Progress', icon: TrendingUp },
  ];
  return (
    <aside className="rail" aria-label="Course contents">
      <div className="rail-head">
        <span className="rail-issue">An interactive classroom · PlainScript 2.3.1</span>
        <Wordmark navigate={navigate} />
        <p className="rail-sub">Read · run · keep<br />MMXXVI</p>
      </div>
      <nav className="rail-nav" aria-label="Learning contents">
        <div className="nav-group">
          <div className="nav-label">Rooms</div>
          {items.map((it) => (
            <NavLink key={it.to} active={path === it.to || (it.to === '/learn' && path.startsWith('/learn/'))} onClick={() => navigate(it.to)} icon={it.icon}>{it.label}</NavLink>
          ))}
        </div>
        <div className="nav-group">
          <div className="nav-label">Lessons</div>
          {availableLessons.map((lesson) => (
            <NavLink key={lesson.id} prefix={lesson.chapterNumber} active={path === `/learn/${lesson.id}`} onClick={() => navigate(`/learn/${lesson.id}`)}>{lesson.title}</NavLink>
          ))}
        </div>
      </nav>
      <div className="rail-foot">
        <div className="rail-progress">
          <div className="rail-progress__label"><span>Read</span><b>{percent}%</b></div>
          <div className="rail-progress__track"><i style={{ width: `${percent}%` }} /></div>
          <small>{done} of {availableLessons.length} lessons</small>
        </div>
        <div className="rail-links">
          <a href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source ↗</a>
          <span className="sep">/</span>
          <a href="https://plainscript.vercel.app/" target="_blank" rel="noreferrer">Docs ↗</a>
        </div>
        <p>PlainScript 2.3.1 · MIT<br />Independent companion.</p>
      </div>
    </aside>
  );
}
function Shell({ path, navigate, progress, railOpen, setRailOpen, crumb, pageMeta, children }) {
  const [reading, setReading] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setReading(max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [path]);
  useEffect(() => { document.body.classList.toggle('nav-open', railOpen); return () => document.body.classList.remove('nav-open'); }, [railOpen]);
  useEffect(() => {
    if (!railOpen) return undefined;
    const close = (event) => { if (event.key === 'Escape') setRailOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [railOpen, setRailOpen]);
  const go = (to) => { setRailOpen(false); navigate(to); };
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <button type="button" className={`scrim${railOpen ? ' on' : ''}`} onClick={() => setRailOpen(false)} aria-label="Close contents" tabIndex={railOpen ? 0 : -1} />
      <Rail path={path} navigate={go} progress={progress} />
      <div className="main">
        <header className="top">
          <button type="button" className="nav-toggle" onClick={() => setRailOpen(true)} aria-expanded={railOpen} aria-controls="rail">
            <Menu size={16} strokeWidth={1.7} aria-hidden="true" /> <span>Rooms</span>
          </button>
          <Wordmark navigate={go} />
          <span className="crumb">{crumb ? <><b>{crumb[0]}</b><span className="slash">/</span>{crumb[1]}</> : <><b>LearnPlainScript</b><span className="slash">/</span>Course</>}</span>
          <span className="top-page">p. {pageMeta}</span>
          <div className="progress" aria-hidden="true"><span style={{ width: `${reading}%` }} /></div>
        </header>
        <main id="main" className="page">
          {children}
          <Colophon navigate={go} />
        </main>
      </div>
    </div>
  );
}
function Colophon({ navigate }) {
  return (
    <footer className="end">
      <div className="end-mark" aria-hidden="true">∎</div>
      <div className="end-grid">
        <div className="end-brand">
          <b>LearnPlainScript<span>.</span></b>
          <p>An interactive classroom for PlainScript 2.3.1. Independent companion. Set in Fraunces, Newsreader, Space Grotesk and IBM Plex Mono.</p>
        </div>
        <nav className="end-links" aria-label="Project links">
          <button type="button" onClick={() => navigate('/learn')}>Notebook</button>
          <button type="button" onClick={() => navigate('/whiteboard')}>Whiteboard</button>
          <button type="button" onClick={() => navigate('/playground')}>Playground</button>
          <a href="https://plainscript.vercel.app/" target="_blank" rel="noreferrer">Official docs</a>
          <a href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source</a>
        </nav>
        <div className="end-fine">
          <span>Plates from the PlainScript manual, MIT.</span>
          <span>New plates made for this course.</span>
          <span>One stylesheet, no trackers.</span>
        </div>
      </div>
      <div className="end-turn">
        <span>Return to the classroom</span>
        <button type="button" onClick={() => navigate('/')}>Open the classroom <span aria-hidden="true">→</span></button>
      </div>
    </footer>
  );
}

/* ---------- code tabs ---------- */
const CODE_TABS = [{ id: 'src', label: 'hello.pln' }, { id: 'out', label: 'hello.js' }, { id: 'cli', label: 'terminal' }];
function CodeTabs() {
  const [active, setActive] = useState('src');
  const source = `#syntax 2.1\n\nimport { print } from "std/io"\n\ndefine greet(name: text) returns text\n    return "Hello, {name}."\nend\n\nprint(greet("world"))`;
  const output = `import { print } from "./std/io.js";\n\nfunction greet(name) {\n  return \`Hello, \${name}.\`;\n}\n\nprint(greet("world"));`;
  const terminal = `$ plainscript run hello.pln\nHello, world.`;
  return (
    <div className="code-tabs">
      <div className="tablist" role="tablist" aria-label="Language specimen">
        {CODE_TABS.map((tab) => (<button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} className={active === tab.id ? 'on' : ''} onClick={() => setActive(tab.id)}>{tab.label}</button>))}
      </div>
      {active === 'src' && <pre className="tabpanel"><code><Tokens code={source} /></code></pre>}
      {active === 'out' && <pre className="tabpanel"><code><Tokens code={output} /></code></pre>}
      {active === 'cli' && <pre className="tabpanel tabpanel-cli"><code>{terminal}</code></pre>}
    </div>
  );
}

/* ---------- classroom homepage ---------- */
function Classroom({ navigate, progress }) {
  const done = progress.completedLessons.length;
  const nextLesson = availableLessons.find((l) => !progress.completedLessons.includes(l.id)) || availableLessons[0];
  const nextIndex = availableLessons.findIndex((l) => l.id === nextLesson.id) + 1;
  const challengesDone = progress.completedChallenges.length;
  const examDone = Object.keys(progress.examAnswers).length;
  const examCorrect = Object.values(progress.examAnswers).filter(Boolean).length;
  const reviewed = progress.reviewedCards.length;

  return (
    <div className="classroom">
      <section className="entrance">
        <div>
          <p className="entrance-kicker">LearnPlainScript · Classroom 01</p>
          <h1>Welcome to the classroom.</h1>
          <p className="entrance-lede">A place to read PlainScript 2.3.1, run real programs, and keep the syntax close at hand. No account needed — your progress stays in this browser.</p>
          <div className="entrance-meta">
            <span><b>{done}</b> of {availableLessons.length} lessons read</span>
            <span><b>{challengesDone}</b> challenges passed</span>
            <span><b>{examCorrect}</b> / {examDone} exam correct</span>
          </div>
        </div>
        <div className="continue-card">
          <span className="cc-label">Continue learning</span>
          <h3>{done === 0 ? 'Lesson 01 is waiting.' : done === availableLessons.length ? 'Every lesson is read.' : nextLesson.title}</h3>
          <p className="cc-meta">{nextLesson.chapter} · {nextLesson.duration} · PlainScript 2.3.1</p>
          <button type="button" className="btn-solid" onClick={() => navigate(`/learn/${nextLesson.id}`)}>
            {done === 0 ? 'Begin lesson 01' : 'Return to your bookmark'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <Reveal>
        <section className="scene-section">
          <div className="scene-copy">
            <p className="section-kicker">Room 01</p>
            <h2 className="section-title">Step into the room.</h2>
            <p>The classroom is a real place in this browser: a chalkboard with today’s concept, a desk with your notebook open, and the compiler within reach. Move your pointer to look around.</p>
            <div className="scene-actions">
              <button type="button" className="btn-solid" onClick={() => navigate(`/learn/${nextLesson.id}`)}>Take your seat <span aria-hidden="true">→</span></button>
              <button type="button" className="btn-line" onClick={() => navigate('/whiteboard')}>Open the board</button>
            </div>
            <p className="scene-caption">Rendered with Three.js · paused when off screen · still under reduced motion</p>
          </div>
          <div className="scene-frame" role="img" aria-label="A three-dimensional classroom with a chalkboard, desk, notebook and warm window light.">
            <Suspense fallback={<div className="scene-fallback scene-fallback--loading"><span>Preparing the room…</span></div>}>
              <ClassroomScene />
            </Suspense>
            <div className="scene-badge"><span>3D classroom</span><span>Pointer to look</span></div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="desk-section">
          <div>
            <p className="section-kicker">The desk</p>
            <h2 className="section-title">Your notebook.</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '46ch' }}>Open the notebook to the page you left. Recent materials, assignments, and the chapters you have finished live here.</p>
            <ul className="desk-list">
              <li><span>Current lesson</span><b>{nextLesson.title}</b></li>
              <li><span>Chapters finished</span><b>{chapters.filter((c) => c.lessons.every((l) => progress.completedLessons.includes(l.id))).length} / {chapters.length}</b></li>
              <li><span>Exercises passed</span><b>{challengesDone} / {availableLessons.length}</b></li>
              <li><span>Cards reviewed</span><b>{reviewed} / {flashcards.length}</b></li>
            </ul>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-solid small" onClick={() => navigate(`/learn/${nextLesson.id}`)}>Open notebook</button>
              <button type="button" className="btn-line" onClick={() => navigate('/whiteboard')}>Open whiteboard</button>
            </div>
          </div>
          <div className="desk-notebook">
            <span className="nb-label">Notebook · page {String(nextIndex).padStart(2, '0')}</span>
            <h3>{nextLesson.title}</h3>
            <p>{nextLesson.intro}</p>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: 'var(--muted)' }}>Chapter {nextLesson.chapterNumber} · {nextLesson.chapter} · {nextLesson.duration}</p>
            <div style={{ marginTop: '1rem' }}>
              <CodeSpecimen code={nextLesson.example} file={`${nextLesson.id}.pln`} />
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <p className="section-kicker">The whiteboard</p>
          <h2 className="section-title">Today's concept.</h2>
          <div className="whiteboard-card">
            <div className="wb-head">
              <span className="wb-title">Variables and bindings</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--chalk-dim)' }}>Lesson 03 · live board</span>
            </div>
            <p className="wb-concept">A name is a handle to a value.</p>
            <p className="wb-line"><span className="wb-highlight">value</span> message is "PlainScript reads like structured English."</p>
            <p className="wb-line"><span className="wb-highlight">set</span> count to 0</p>
            <p className="wb-line"><span className="wb-highlight">set</span> count to count + 1</p>
            <div className="wb-demo">
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--chalk-dim)', margin: '0 0 0.4rem' }}>Try it on the board:</p>
              <HomeLab compact />
            </div>
            <div className="wb-action">
              <button type="button" className="btn-solid" onClick={() => navigate('/whiteboard')}>Enter the live classroom <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="desk-section">
          <div className="noticeboard">
            <h3>Class noticeboard</h3>
            <div className="notice-item"><span className="notice-date">Now</span><span className="notice-text">PlainScript 2.3.1 is the current language. All lessons, specimens, and the compiler use 2.3.1.</span></div>
            <div className="notice-item"><span className="notice-date">New</span><span className="notice-text">Chapter 03 covers classes, generators, and native JSX as 2.3 features.</span></div>
            <div className="notice-item"><span className="notice-date">Tip</span><span className="notice-text">Break a specimen on purpose, read the diagnostic, then repair it. That is the lesson.</span></div>
            <div className="notice-item"><span className="notice-date">Info</span><span className="notice-text">Progress is stored in this browser. No account is required to begin.</span></div>
          </div>
          <div>
            <p className="section-kicker">Learning progress</p>
            <h2 className="section-title">Where you stand.</h2>
            <div className="progress-grid">
              <div className="stat-card"><span className="sc-label">Lessons read</span><div className="sc-value">{done}</div><div className="sc-sub">of {availableLessons.length}</div></div>
              <div className="stat-card"><span className="sc-label">Chapters done</span><div className="sc-value">{chapters.filter((c) => c.lessons.every((l) => progress.completedLessons.includes(l.id))).length}</div><div className="sc-sub">of {chapters.length}</div></div>
              <div className="stat-card"><span className="sc-label">Challenges</span><div className="sc-value">{challengesDone}</div><div className="sc-sub">of {availableLessons.length}</div></div>
              <div className="stat-card"><span className="sc-label">Exam score</span><div className="sc-value">{examCorrect}</div><div className="sc-sub">of {examDone} answered</div></div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-line" onClick={() => navigate('/progress')}>Open full progress →</button>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section>
          <p className="section-kicker">The syllabus</p>
          <h2 className="section-title">Twenty chapters, in reading order.</h2>
          <ChapterLedger progress={progress} navigate={navigate} />
        </section>
      </Reveal>
    </div>
  );
}

function HomeLab({ compact = false }) {
  const [code, setCode] = useState(homepageSpecimen);
  const { result, run } = useRunner();
  return (
    <div className="home-lab" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(code); } }}>
      {!compact && <div className="home-lab__note"><p className="hl-label">try-it.pln</p><p>Edit the greeting, then run it.</p><span className="hl-hint">⌘/Ctrl + Enter</span></div>}
      <Editor code={code} onChange={setCode} label="try-it.pln" minHeight={compact ? '180px' : '250px'} />
      <div className="home-lab__actions" style={{ marginTop: '0.6rem' }}>
        <button type="button" className="btn-solid small" onClick={() => run(code)} disabled={result.status === 'running'}><Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run'}</button>
        <button type="button" className="icon-btn" onClick={() => setCode(homepageSpecimen)} aria-label="Reset"><RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <div style={{ marginTop: '0.6rem' }}><Output result={result} compact /></div>
    </div>
  );
}

/* ---------- curriculum ledger ---------- */
function ChapterLedger({ progress, navigate, withLessons = false }) {
  return (
    <div className={`ledger${withLessons ? ' ledger-full' : ''}`}>
      {chapters.map((chapter) => {
        const lessonsDone = chapter.lessons.filter((l) => progress.completedLessons.includes(l.id)).length;
        const allDone = lessonsDone === chapter.lessons.length;
        const first = chapter.lessons[0];
        return (
          <article className="ledger-row" key={chapter.number}>
            <div className="ledger-no">{chapter.number}</div>
            <div className="ledger-main">
              {withLessons ? (
                <>
                  <div className="ledger-title"><h3>{chapter.title}</h3><span className={allDone ? 'is-read' : ''}>{allDone ? 'read' : `${lessonsDone}/${chapter.lessons.length}`}</span></div>
                  <p className="ledger-summary">{chapter.summary}</p>
                  <div className="ledger-lessons">
                    {chapter.lessons.map((lesson) => {
                      const isDone = progress.completedLessons.includes(lesson.id);
                      return (
                        <button key={lesson.id} type="button" className={isDone ? 'is-read' : ''} onClick={() => navigate(`/learn/${lesson.id}`)}>
                          <span className="ll-mark">{isDone ? <Check size={11} strokeWidth={2.6} aria-hidden="true" /> : '§'}</span>
                          <span className="ll-title">{lesson.title}</span>
                          <span className="ll-meta">{lesson.duration}{progress.quizScores[lesson.id] === 1 ? ' · check passed' : ''}</span>
                          <span className="ll-arrow" aria-hidden="true">→</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <button type="button" className="ledger-link" onClick={() => navigate(`/learn/${first.id}`)}>
                  <span className="ledger-title"><h3>{chapter.title}</h3><span className={allDone ? 'is-read' : ''}>{allDone ? 'read' : 'unread'}</span></span>
                  <span className="ledger-summary">{chapter.summary}</span>
                </button>
              )}
            </div>
            <div className="ledger-side">
              <span className="ls-count">{chapter.lessons.length}</span>
              <span className="ls-label">{chapter.lessons.length === 1 ? 'lesson' : 'lessons'}</span>
              <button type="button" className="ledger-go" onClick={() => navigate(`/learn/${first.id}`)} aria-label={`Open ${chapter.title}`}>→</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
function Curriculum({ navigate, progress, resetProgress }) {
  const done = progress.completedLessons.length;
  const next = availableLessons.find((l) => !progress.completedLessons.includes(l.id)) || availableLessons[0];
  return (
    <div className="contents">
      <div className="running-head"><span>01 Contents</span><span>{availableLessons.length} lessons · PlainScript 2.3.1</span></div>
      <div className="contents-head">
        <h1 className="page-title">Notebook contents.</h1>
        <p>Twenty chapters read as a sequence. Each is a short article with a specimen, a bench, and one question. Begin anywhere; the browser remembers where you stopped.</p>
      </div>
      <div className="contents-bar">
        <div><b>{String(done).padStart(2, '0')}</b><span>read</span></div>
        <div><b>{String(availableLessons.length - done).padStart(2, '0')}</b><span>remaining</span></div>
        <div className="cb-next"><span>Next</span><b>{next.title}</b></div>
        <button type="button" className="btn-solid" onClick={() => navigate(`/learn/${next.id}`)}>{done === 0 ? 'Open lesson 01' : 'Continue'} <span aria-hidden="true">→</span></button>
        {done > 0 && <button type="button" className="link-quiet" onClick={resetProgress}>Reset progress</button>}
      </div>
      <ChapterLedger progress={progress} navigate={navigate} withLessons />
      <p className="contents-note">Lessons are checked against <code>plainscript-lang@2.3.1</code>. Platform topics — files, databases, HTTP — are described as runtime boundaries rather than invented as portable syntax.</p>
    </div>
  );
}

/* ---------- lesson ---------- */
function LessonPractice({ lesson, progress, completeChallenge }) {
  const challenge = lesson.challenge;
  const [code, setCode] = useState(challenge?.starter || lesson.example);
  const [hint, setHint] = useState(false);
  const { result, run, reset } = useRunner();
  const runnable = Boolean(challenge?.expectedOutput);
  const done = progress.completedChallenges.includes(lesson.id);
  useEffect(() => { setCode(challenge?.starter || lesson.example); setHint(false); reset(); }, [lesson.id]);
  const execute = async () => {
    if (!runnable) return;
    const payload = await run(code);
    if (payload?.ok) {
      const normalise = (v) => (v || '').trim().replace(/\s+/g, ' ');
      if (normalise(payload.output) === normalise(challenge.expectedOutput)) completeChallenge(lesson.id);
    }
  };
  return (
    <section className="bench-panel practice">
      <div className="panel-label"><span>01</span> Practice</div>
      <div className="panel-head"><h3>{done ? 'The compiler agrees.' : 'Change the specimen.'}</h3><span className="panel-chip">2.3.1</span></div>
      <p className="panel-prompt"><Inline text={challenge?.prompt || ''} /></p>
      <Editor code={code} onChange={setCode} label={`${lesson.id}.pln`} />
      <div className="practice-controls">
        <button type="button" className="btn-solid small" onClick={execute} disabled={!runnable || result.status === 'running'}><Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run'}</button>
        <button type="button" className="icon-btn" onClick={() => { setCode(challenge?.starter || lesson.example); reset(); }} aria-label="Reset the specimen"><RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" /></button>
        <button type="button" className="link-quiet" onClick={() => setHint((v) => !v)}>{hint ? 'Hide hint' : 'Hint'}</button>
      </div>
      {!runnable && <p className="practice-note">This specimen needs a project boundary, so it is read rather than executed here.</p>}
      {hint && challenge?.hint && <p className="hint-box"><Inline text={challenge.hint} /></p>}
      <Output result={result} compact />
      {done && <p className="practice-success"><Check size={12} strokeWidth={2.5} aria-hidden="true" /> Challenge recorded in this browser.</p>}
    </section>
  );
}
function LessonQuiz({ lesson, savedScore, saveQuiz }) {
  const quiz = lesson.quiz;
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  useEffect(() => setSelected(null), [lesson.id]);
  const choose = (index) => { if (answered) return; setSelected(index); saveQuiz(lesson.id, index === quiz.answer ? 1 : 0); };
  return (
    <section className="bench-panel check">
      <div className="panel-label"><span>02</span> Check</div>
      <div className="panel-head"><h3>{quiz.question}</h3></div>
      <div className="quiz-options" role="group" aria-label="Answer options">
        {quiz.options.map((option, index) => {
          const state = !answered ? '' : index === quiz.answer ? 'correct' : index === selected ? 'incorrect' : 'muted';
          return (<button key={option} type="button" className={state} onClick={() => choose(index)} disabled={answered} aria-pressed={selected === index}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>);
        })}
      </div>
      {answered && (<div className={`quiz-feedback ${selected === quiz.answer ? 'correct' : 'incorrect'}`}><b>{selected === quiz.answer ? 'Correct.' : 'Not quite.'}</b><p><Inline text={quiz.explanation} /></p>{selected !== quiz.answer && <button type="button" className="link-quiet" onClick={() => setSelected(null)}>Try again</button>}</div>)}
      {!answered && savedScore === 1 && <p className="quiz-prior">You answered this correctly on an earlier visit.</p>}
    </section>
  );
}
function LessonPage({ lesson, navigate, progress, completeLesson, completeChallenge, saveQuiz }) {
  const index = availableLessons.findIndex((item) => item.id === lesson.id);
  const previous = availableLessons[index - 1];
  const next = availableLessons[index + 1];
  const isComplete = progress.completedLessons.includes(lesson.id);
  const plateKey = plateForChapter(lesson.chapterNumber);
  const crop = CROPS[index % CROPS.length];
  const roman = ROMAN[(Number(lesson.chapterNumber) - 1) % ROMAN.length];
  useEffect(() => { window.scrollTo(0, 0); }, [lesson.id]);
  return (
    <article className="lesson">
      <div className="running-head"><span>Chapter {lesson.chapterNumber} · {lesson.chapter}</span><span>Lesson {String(index + 1).padStart(2, '0')} / {String(availableLessons.length).padStart(2, '0')} · {lesson.duration}</span></div>
      <header className="lesson-head">
        <div className="lesson-head__type">
          <span className="lesson-tag">Chapter {lesson.chapterNumber} · Plate {roman}</span>
          <h1>{lesson.title}</h1>
          <p className="lesson-standfirst"><Inline text={lesson.intro} /></p>
          <div className="lesson-meta"><span>{lesson.duration}</span><span>PlainScript 2.3.1</span><span className={isComplete ? 'is-read' : ''}>{isComplete ? 'read' : 'unread'}</span></div>
        </div>
        <figure className="lesson-plate">
          <img src={PLATES[plateKey].src} alt={PLATES[plateKey].alt} style={{ objectPosition: crop }} width="1024" height="1024" />
          <figcaption><span>Plate {roman}</span><span>{PLATES[plateKey].title}</span></figcaption>
        </figure>
      </header>
      <div className="lesson-body prose">
        <section className="lesson-sec"><h2>What you will learn</h2><ul className="objectives">{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul></section>
        <section className="lesson-sec"><h2>The idea</h2><p><Inline text={lesson.explanation} /></p></section>
        {lesson.expectedOutput && (
          <section className="lesson-sec lesson-sec--interactive">
            <h2>Before you run it</h2>
            <p>Commit to an answer first. The compiler will tell you the truth in a moment.</p>
            <PredictRun lesson={lesson} />
          </section>
        )}
        <section className="lesson-sec"><h2>Syntax, close up</h2><div className="syntax-table">{lesson.syntax.map(([term, description]) => (<div className="syntax-row" key={term}><code className="syntax-term"><Tokens code={term.replace(/`/g, '')} /></code><span><Inline text={description} /></span></div>))}</div></section>
        <section className="lesson-sec"><h2>The specimen</h2><p>Read it once for the shape, then again for the names. It is editable: change a line and run it without leaving the lesson.</p>{lesson.expectedOutput ? (<TryIt lesson={lesson} />) : (<><CodeSpecimen code={lesson.example} file={`${lesson.id}.pln`} /><p className="tryit-static-note">This specimen needs a React project boundary, so it is read rather than executed in the browser runner.</p></>)}</section>
        <section className="lesson-sec lesson-sec--tight"><div className="exercise"><span className="exercise-label">Exercise</span><p><Inline text={lesson.exercise} /></p></div></section>
        <section className="lesson-sec"><h2>Common mistakes</h2><ul className="mistakes">{lesson.commonMistakes.map((m) => <li key={m}><Inline text={m} /></li>)}</ul></section>
        <blockquote className="lesson-quote">The compiler checks the source before it runs. When a line feels unclear, give it a name or a type instead of hiding the decision.<cite>Margin note · PlainScript 2.3.1</cite></blockquote>
      </div>
      <section className="bench">
        <div className="bench-head"><div className="section-kicker">The bench</div><div className="bench-head__copy"><h2>Put the lesson under the compiler.</h2><p>A specimen to change and one question to answer. Your work stays in this browser.</p></div></div>
        <div className="bench-grid">
          <LessonPractice lesson={lesson} progress={progress} completeChallenge={completeChallenge} />
          <LessonQuiz lesson={lesson} savedScore={progress.quizScores[lesson.id]} saveQuiz={saveQuiz} />
        </div>
      </section>
      <div className={`signoff${isComplete ? ' is-read' : ''}`}>
        <span className="signoff-mark">{isComplete ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : '○'}</span>
        <div className="signoff-copy"><b>{isComplete ? 'Lesson read' : 'Finished reading?'}</b><small>{isComplete ? 'Recorded in this browser.' : 'Mark the lesson when the idea feels clear. It is reversible.'}</small></div>
        {!isComplete ? <button type="button" className="btn-solid small" onClick={() => completeLesson(lesson.id)}>Mark as read</button> : <span className="signoff-note">p. {String(index + 1).padStart(2, '0')} / {String(availableLessons.length).padStart(2, '0')}</span>}
      </div>
      <nav className="turn" aria-label="Lesson navigation">
        {previous ? (<button type="button" className="turn-prev" onClick={() => navigate(`/learn/${previous.id}`)}><span>← Previous</span><b>{previous.title}</b></button>) : <span className="turn-prev turn-empty" aria-hidden="true" />}
        <button type="button" className="turn-next" onClick={() => navigate(next ? `/learn/${next.id}` : '/learn')}><span>{next ? 'Turn to' : 'End of the book'}</span><b>{next ? next.title : 'Back to the contents'}</b><i aria-hidden="true">→</i></button>
      </nav>
    </article>
  );
}

/* ---------- playground ---------- */
function Playground({ navigate }) {
  const [exampleId, setExampleId] = useState(playgroundExamples[0].id);
  const example = playgroundExamples.find((i) => i.id === exampleId) || playgroundExamples[0];
  const [code, setCode] = useState(example.code);
  const { result, run, reset } = useRunner();
  const choose = (item) => { setExampleId(item.id); setCode(item.code); reset(); };
  return (
    <div className="lab">
      <div className="running-head"><span>Playground · The bench</span><span>plainscript-lang 2.3.1 · {playgroundExamples.length} specimens</span></div>
      <div className="lab-intro"><h1 className="page-title">The compiler,<br /><em>at the desk.</em></h1><p>A full editor for the language. {playgroundExamples.length} specimens cover the 2.1 dialect and the 2.3 object model; every one is executed against the published compiler before it ships.</p></div>
      <div className="lab-layout">
        <aside className="specimen-index" aria-label="Specimens">
          <span className="si-label">Specimens</span>
          {playgroundExamples.map((item) => (<button key={item.id} type="button" aria-pressed={exampleId === item.id} className={exampleId === item.id ? 'on' : ''} onClick={() => choose(item)}><span>{String(playgroundExamples.indexOf(item) + 1).padStart(2, '0')}</span>{item.label}</button>))}
          <p className="si-note">Every specimen is checked at build time.</p>
        </aside>
        <div className="lab-main">
          <div className="lab-toolbar"><span className="lab-toolbar__title">{String(playgroundExamples.indexOf(example) + 1).padStart(2, '0')} / {example.label}</span><span className="lab-toolbar__note">{example.note}</span></div>
          <div className="lab-editor-row">
            <div className="lab-editor-col">
              <Editor code={code} onChange={setCode} label={`${example.id}.pln`} minHeight="420px" />
              <div className="lab-controls">
                <button type="button" className="btn-solid" onClick={() => run(code)} disabled={result.status === 'running'}><Play size={14} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run program'}</button>
                <button type="button" className="icon-btn" onClick={() => { setCode(example.code); reset(); }} aria-label="Reset to the example"><RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" /></button>
                <span className="lab-shortcut">⌘/Ctrl + Enter</span>
              </div>
            </div>
            <div className="lab-console-col" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(code); } }}>
              <div className="console-head"><span>Console</span><span className={`run-state is-${result.status}`}>{result.status === 'idle' ? 'ready' : result.status}</span></div>
              <Output result={result} />
              <div className="lab-notes"><p>File, network, process and dynamic-import access are removed before execution.</p><p>Programs time out after 3.5 seconds. Output is capped at 64 KB.</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="lab-footnote"><p>Need context for a specimen? The <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>notebook</button> explains each idea, and the <button type="button" className="link-quiet" onClick={() => navigate('/quiz')}>practice room</button> checks the language across the course.</p></div>
    </div>
  );
}

/* ---------- examination ---------- */
function Examination({ progress, recordExam, navigate }) {
  const questions = availableLessons.map((lesson) => ({ lesson, quiz: lesson.quiz }));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = questions[index];
  const percent = Math.round((index / questions.length) * 100);
  const choose = (option) => { if (selected !== null) return; setSelected(option); const correct = option === current.quiz.answer; if (correct) setScore((v) => v + 1); recordExam(current.lesson.id, correct); };
  const advance = () => { if (index + 1 >= questions.length) { setFinished(true); return; } setIndex((v) => v + 1); setSelected(null); };
  const restart = () => { setIndex(0); setSelected(null); setScore(0); setFinished(false); };
  if (finished) {
    const total = questions.length;
    return (
      <div className="examination result">
        <div className="running-head"><span>Practice · Examination</span><span>Result</span></div>
        <h1 className="page-title">You scored<br /><em>{score} of {total}</em>.</h1>
        <p className="exam-lede">{score === total ? 'Every question answered correctly. The language is in your hands now — the bench is the better examination.' : 'A score is a map, not a verdict. The lessons behind the questions you missed are still open, and the compiler is patient.'}</p>
        <div className="result-meter"><i style={{ width: `${Math.round((score / total) * 100)}%` }} /></div>
        <div className="result-actions"><button type="button" className="btn-solid" onClick={restart}>Sit it again</button><button type="button" className="btn-line" onClick={() => navigate('/learn')}>Return to the notebook</button></div>
        <div className="result-list">{questions.map(({ lesson }) => { const answer = progress.examAnswers[lesson.id]; return (<button type="button" key={lesson.id} className={answer ? 'correct' : 'incorrect'} onClick={() => navigate(`/learn/${lesson.id}`)}><span>{lesson.chapterNumber}</span><b>{lesson.title}</b><em>{answer ? 'passed' : 'review'}</em></button>); })}</div>
      </div>
    );
  }
  return (
    <div className="examination">
      <div className="running-head"><span>Practice · Examination</span><span>{questions.length} questions · no timer</span></div>
      <div className="exam-head"><h1 className="page-title">The course,<br /><em>in questions.</em></h1><p className="exam-lede">One question from each lesson. Nothing is scored until you answer, and every answer explains itself. The examination can be retaken as often as you like.</p></div>
      <div className="exam-bar"><div className="exam-bar__track"><i style={{ width: `${percent}%` }} /></div><span>Question {String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span><span>{score} correct</span></div>
      <article className="exam-card">
        <div className="exam-source"><span>Chapter {current.lesson.chapterNumber}</span><span>{current.lesson.chapter}</span><button type="button" className="link-quiet" onClick={() => navigate(`/learn/${current.lesson.id}`)}>Read the lesson ↗</button></div>
        <h2>{current.quiz.question}</h2>
        <div className="quiz-options exam-options" role="group" aria-label="Answer options">
          {current.quiz.options.map((option, optionIndex) => {
            const state = selected === null ? '' : optionIndex === current.quiz.answer ? 'correct' : optionIndex === selected ? 'incorrect' : 'muted';
            return (<button key={option} type="button" className={state} onClick={() => choose(optionIndex)} disabled={selected !== null} aria-pressed={selected === optionIndex}><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>);
          })}
        </div>
        {selected !== null && (<div className={`quiz-feedback ${selected === current.quiz.answer ? 'correct' : 'incorrect'}`}><b>{selected === current.quiz.answer ? 'Correct.' : `The answer is ${String.fromCharCode(65 + current.quiz.answer)}.`}</b><p><Inline text={current.quiz.explanation} /></p><button type="button" className="btn-solid small" onClick={advance}>{index + 1 >= questions.length ? 'See the result' : 'Next question'} <span aria-hidden="true">→</span></button></div>)}
      </article>
      <div className="exam-dots" aria-hidden="true">{questions.map((q, di) => <span key={q.lesson.id} className={di < index ? 'past' : di === index ? 'now' : ''} />)}</div>
    </div>
  );
}

/* ---------- flashcards ---------- */
function Flashcards({ progress, markReviewed, setCardIndex, navigate }) {
  const [revealed, setRevealed] = useState(false);
  const card = flashcards[progress.flashcardIndex % flashcards.length];
  const reviewed = progress.reviewedCards.length;
  const move = (dir) => { setRevealed(false); setCardIndex((progress.flashcardIndex + dir + flashcards.length) % flashcards.length); };
  const reveal = () => { setRevealed(true); markReviewed(card.id); };
  return (
    <div className="flashcards">
      <div className="running-head"><span>Practice · Revision deck</span><span>{reviewed} of {flashcards.length} revealed</span></div>
      <div className="split-head"><h1 className="page-title">Keep the syntax<br /><em>close at hand.</em></h1><p>Seven cards for the words that shape the language. Read the question, say the answer, then turn the card over.</p></div>
      <div className="flashcard-layout">
        <button type="button" className={`flashcard${revealed ? ' revealed' : ''}`} onClick={() => (revealed ? setRevealed(false) : reveal())} aria-label={revealed ? 'Hide the answer' : 'Reveal the answer'}>
          <div className="flashcard-top"><span>Card {String((progress.flashcardIndex % flashcards.length) + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}</span><span>{revealed ? 'answer' : 'question'}</span></div>
          <div className="flashcard-body"><span className="flashcard-eyebrow">PlainScript 2.3.1</span><h2>{revealed ? card.answer : card.question}</h2><span className="flip-label">{revealed ? 'Click to hide' : 'Click to reveal'}</span></div>
          <div className="flashcard-foot"><span className="flashcard-dots">{flashcards.map((item, i) => <i key={item.id} className={i === progress.flashcardIndex % flashcards.length ? 'on' : progress.reviewedCards.includes(item.id) ? 'seen' : ''} />)}</span><span>hand-set · halftone</span></div>
        </button>
        <aside className="flashcard-side">
          <p className="section-kicker">The deck</p>
          <h3>Seven words that carry the language.</h3>
          <p>These cards are revision, not the lesson. If an answer is unfamiliar, the notebook has a specimen and an explanation waiting for it.</p>
          <div className="flashcard-controls"><button type="button" className="btn-line" onClick={() => move(-1)}>← Previous</button><button type="button" className="btn-solid small" onClick={() => move(1)}>Next card →</button></div>
          <ul className="deck-list">{flashcards.map((item, i) => <li key={item.id} className={progress.reviewedCards.includes(item.id) ? 'seen' : ''}><span>{String(i + 1).padStart(2, '0')}</span>{item.question.split(' ').slice(0, 6).join(' ')}…</li>)}</ul>
          <button type="button" className="link-quiet" onClick={() => navigate('/quiz')}>Take the examination →</button>
        </aside>
      </div>
    </div>
  );
}

/* ---------- projects ---------- */
function Projects({ navigate }) {
  return (
    <div className="projects">
      <div className="running-head"><span>Assignments · Commissions</span><span>{projects.length} briefs · open ended</span></div>
      <div className="split-head"><h1 className="page-title">Three briefs<br /><em>for the desk.</em></h1><p>Lessons teach a word at a time. A commission asks you to make something with several of them. None of these have a single correct answer; each has a clear criterion.</p></div>
      <div className="projects-list">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-number">{project.number}</div>
            <div className="project-main">
              <div className="project-meta"><span>{project.level}</span><i>·</i><span>{project.concepts.join(' / ')}</span></div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="project-columns">
                <div><b>Requirements</b><ul>{project.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><b>Starting point</b><p>{project.starting}</p></div>
                <div><b>Finished when</b><p>{project.criteria}</p></div>
              </div>
              <div className="project-actions">
                <button type="button" className="link-quiet" onClick={() => navigate('/playground')}>Open the bench →</button>
                <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>Find the related lessons →</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- progress ---------- */
function Progress({ progress, navigate, resetProgress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const examDone = Object.keys(progress.examAnswers).length;
  const examCorrect = Object.values(progress.examAnswers).filter(Boolean).length;
  return (
    <div className="progress-page">
      <div className="running-head"><span>My Progress</span><span>{percent}% complete</span></div>
      <h1 className="page-title">Where you stand.</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '60ch' }}>Your progress is stored in this browser. No account is required.</p>
      <div className="progress-grid" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card"><span className="sc-label">Lessons read</span><div className="sc-value">{done}</div><div className="sc-sub">of {availableLessons.length}</div></div>
        <div className="stat-card"><span className="sc-label">Chapters done</span><div className="sc-value">{chapters.filter((c) => c.lessons.every((l) => progress.completedLessons.includes(l.id))).length}</div><div className="sc-sub">of {chapters.length}</div></div>
        <div className="stat-card"><span className="sc-label">Challenges</span><div className="sc-value">{progress.completedChallenges.length}</div><div className="sc-sub">of {availableLessons.length}</div></div>
        <div className="stat-card"><span className="sc-label">Exam score</span><div className="sc-value">{examCorrect}</div><div className="sc-sub">of {examDone} answered</div></div>
        <div className="stat-card"><span className="sc-label">Cards reviewed</span><div className="sc-value">{progress.reviewedCards.length}</div><div className="sc-sub">of {flashcards.length}</div></div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.8rem' }}>Lessons</h2>
        <div className="progress-list">
          {availableLessons.map((l, i) => {
            const isDone = progress.completedLessons.includes(l.id);
            return (
              <div key={l.id} className={`progress-row${isDone ? ' done' : ''}`}>
                <span className="pr-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="pr-title">{l.title}</span>
                <span className="pr-status">{isDone ? 'read' : 'unread'}{progress.quizScores[l.id] === 1 ? ' · check passed' : ''}</span>
                <button type="button" className="link-quiet" onClick={() => navigate(`/learn/${l.id}`)}>Open →</button>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem' }}>
        <button type="button" className="btn-solid" onClick={() => navigate('/learn')}>Open notebook</button>
        {done > 0 && <button type="button" className="link-quiet" onClick={resetProgress}>Reset progress</button>}
      </div>
    </div>
  );
}

/* ---------- not found ---------- */
function NotFound({ navigate }) {
  return (
    <div className="not-found">
      <div className="running-head"><span>404 · Not in the book</span><span>Missing page</span></div>
      <h1 className="page-title">This page<br /><em>is not printed.</em></h1>
      <p className="not-found__lede">The address does not belong to a lesson, a specimen, or a plate. The contents are the reliable place to begin.</p>
      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
        <button type="button" className="btn-solid" onClick={() => navigate('/learn')}>Open the notebook →</button>
        <button type="button" className="btn-line" onClick={() => navigate('/')}>Return to the classroom</button>
      </div>
    </div>
  );
}

/* ---------- app ---------- */
function routePath() { return window.location.pathname.replace(/\/+$/, '') || '/'; }
function App() {
  const [path, setPath] = useState(routePath());
  const [railOpen, setRailOpen] = useState(false);
  const progressState = useProgress();
  useEffect(() => { const onPop = () => setPath(routePath()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  const navigate = useCallback((to) => { if (to === path) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } window.history.pushState({}, '', to); setPath(to); window.scrollTo(0, 0); }, [path]);
  let view; let crumb = ['LearnPlainScript', 'Classroom']; let pageMeta = '00'; let title = 'LearnPlainScript · The PlainScript classroom';
  if (path === '/') { view = <Classroom navigate={navigate} progress={progressState.progress} />; crumb = ['LearnPlainScript', 'Classroom']; pageMeta = 'Home'; title = 'LearnPlainScript · The PlainScript classroom'; }
  else if (path === '/learn') { view = <Curriculum navigate={navigate} progress={progressState.progress} resetProgress={progressState.resetProgress} />; crumb = ['LearnPlainScript', 'Notebook']; pageMeta = '01'; title = 'Notebook · LearnPlainScript'; }
  else if (path.startsWith('/learn/')) {
    const lesson = availableLessons.find((item) => item.id === path.slice('/learn/'.length));
    if (lesson) { view = <LessonPage lesson={lesson} navigate={navigate} progress={progressState.progress} completeLesson={progressState.completeLesson} completeChallenge={progressState.completeChallenge} saveQuiz={progressState.saveQuiz} />; const index = availableLessons.indexOf(lesson); crumb = [`Chapter ${lesson.chapterNumber}`, lesson.title]; pageMeta = `${String(index + 1).padStart(2, '0')} / ${availableLessons.length}`; title = `${lesson.title} · LearnPlainScript`; }
    else { view = <NotFound navigate={navigate} />; crumb = ['LearnPlainScript', '404']; pageMeta = '404'; title = 'Not found · LearnPlainScript'; }
  } else if (path === '/whiteboard') { view = <Whiteboard navigate={navigate} progress={progressState.progress} saveNote={progressState.saveNote} saveQuiz={progressState.saveQuiz} />; crumb = ['LearnPlainScript', 'Whiteboard']; pageMeta = 'WB'; title = 'Whiteboard · LearnPlainScript'; }
  else if (path === '/playground') { view = <Playground navigate={navigate} />; crumb = ['LearnPlainScript', 'Playground']; pageMeta = 'Lab'; title = 'Playground · LearnPlainScript'; }
  else if (path === '/quiz') { view = <Examination progress={progressState.progress} recordExam={progressState.recordExam} navigate={navigate} />; crumb = ['LearnPlainScript', 'Practice']; pageMeta = '02'; title = 'Practice · LearnPlainScript'; }
  else if (path === '/flashcards') { view = <Flashcards progress={progressState.progress} markReviewed={progressState.markReviewed} setCardIndex={progressState.setCardIndex} navigate={navigate} />; crumb = ['LearnPlainScript', 'Revision']; pageMeta = '03'; title = 'Revision · LearnPlainScript'; }
  else if (path === '/projects') { view = <Projects navigate={navigate} />; crumb = ['LearnPlainScript', 'Assignments']; pageMeta = '04'; title = 'Assignments · LearnPlainScript'; }
  else if (path === '/progress') { view = <Progress progress={progressState.progress} navigate={navigate} resetProgress={progressState.resetProgress} />; crumb = ['LearnPlainScript', 'Progress']; pageMeta = 'Me'; title = 'Progress · LearnPlainScript'; }
  else { view = <NotFound navigate={navigate} />; crumb = ['LearnPlainScript', '404']; pageMeta = '404'; title = 'Not found · LearnPlainScript'; }
  useEffect(() => { document.title = title; }, [title]);
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [path]);
  return (
    <Shell path={path} navigate={navigate} progress={progressState.progress} railOpen={railOpen} setRailOpen={setRailOpen} crumb={crumb} pageMeta={pageMeta}>{view}</Shell>
  );
}
createRoot(document.getElementById('root')).render(<App />);