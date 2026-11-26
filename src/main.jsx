import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, Check, Menu, Play, RotateCcw, X,
} from 'lucide-react';
import { availableLessons, chapters, plainWords, projects } from './content.js';
import { homepageSpecimen, playgroundExamples } from './examples.js';
import { CodeSpecimen, Inline, Tokens } from './highlight.jsx';
import { Editor } from './editor.jsx';
import { Output, useRunner } from './runner.jsx';
import { Whiteboard } from './board.jsx';
import { PredictRun, TryIt } from './interactive.jsx';
import {
  GardenHeader, GardenDrawer, GardenTabs, GardenFooter, GardenHome, GardenIndex,
  GardenMark, RelatedNotes, StageBadge, bedForLesson, stageForLesson,
} from './garden.jsx';
import './styles.css';
import './garden.css';

const STORAGE_KEY = 'learnplainscript.progress.v1';
const THEME_KEY = 'learnplainscript.theme.v1';
const defaultProgress = {
  completedLessons: [],
  completedChallenges: [],
  quizScores: {},
  examAnswers: {},
  lastLesson: 'why-plainscript',
  notes: {},
};

const ART = {
  cover: '/art/plate-type-case.svg',
  classroom: '/art/student-desk.svg',
  basics: '/art/lesson-basics.svg',
  data: '/art/lesson-data.svg',
  building: '/art/lesson-building.svg',
};

const DATELINE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date());

const EDITION = 'Vol. II · No. 22';

const SECTIONS = [
  { to: '/', label: 'Front page' },
  { to: '/learn', label: 'Lessons' },
  { to: '/playground', label: 'Playground' },
  { to: '/whiteboard', label: 'Lecture board' },
  { to: '/quiz', label: 'Practice test' },
  { to: '/projects', label: 'Projects' },
  { to: '/progress', label: 'My progress' },
];

/* ---------- progress ---------- */
function loadProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaultProgress;
    return {
      ...defaultProgress,
      ...saved,
      completedLessons: Array.isArray(saved.completedLessons) ? saved.completedLessons : [],
      completedChallenges: Array.isArray(saved.completedChallenges) ? saved.completedChallenges : [],
      examAnswers: saved.examAnswers && typeof saved.examAnswers === 'object' ? saved.examAnswers : {},
    };
  } catch { return defaultProgress; }
}

function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* private browsing */ }
  }, [progress]);
  const completeLesson = (id) => setProgress((c) => ({
    ...c,
    completedLessons: c.completedLessons.includes(id) ? c.completedLessons : [...c.completedLessons, id],
    lastLesson: id,
  }));
  const completeChallenge = (id) => setProgress((c) => ({
    ...c,
    completedChallenges: c.completedChallenges.includes(id) ? c.completedChallenges : [...c.completedChallenges, id],
  }));
  const saveQuiz = (id, score) => setProgress((c) => ({
    ...c, quizScores: { ...c.quizScores, [id]: score }, lastLesson: id,
  }));
  const saveNote = (key, value) => setProgress((c) => ({ ...c, notes: { ...c.notes, [key]: value } }));
  const recordExam = (id, correct) => setProgress((c) => ({ ...c, examAnswers: { ...c.examAnswers, [id]: correct } }));
  const resetProgress = () => setProgress(defaultProgress);
  return { progress, completeLesson, completeChallenge, saveQuiz, saveNote, recordExam, resetProgress };
}

function initialTheme() {
  const current = document.documentElement.dataset.theme;
  if (current === 'dark' || current === 'light') return current;
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* private browsing */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useTheme() {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#181a15' : '#f7f4ec');
    try { window.localStorage.setItem(THEME_KEY, theme); } catch { /* private browsing */ }
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme((value) => (value === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggleTheme };
}

function nextLessonFor(progress) {
  return availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id))
    || availableLessons[availableLessons.length - 1];
}

function lessonPosition(lesson) {
  return availableLessons.findIndex((item) => item.id === lesson.id) + 1;
}

function isActive(path, to) {
  if (to === '/') return path === '/';
  if (to === '/learn') return path === '/learn' || path.startsWith('/learn/');
  return path === to;
}

/* ---------- marks and shared pieces ---------- */
function PressMark({ size = 22, className = '' }) {
  return (
    <svg className={`press-mark ${className}`} width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 1.8v10.4M20 27.8v10.4M1.8 20h10.4M27.8 20h10.4M7.2 7.2l7.4 7.4M25.4 25.4l7.4 7.4M32.8 7.2l-7.4 7.4M14.6 25.4l-7.4 7.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function Meter({ value, className = '' }) {
  return (
    <div className={`meter ${className}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function Wordmark({ navigate, compact = false }) {
  return (
    <button type="button" className={`wordmark${compact ? ' wordmark--compact' : ''}`} onClick={() => navigate('/')} aria-label="LearnPlainScript, front page">
      <PressMark size={compact ? 19 : 27} />
      <span className="wordmark-type">LearnPlain<em>Script</em></span>
    </button>
  );
}

function PageHead({ kicker, title, deck, children, split = false }) {
  return (
    <header className={`page-head${split ? ' page-head--split' : ''}`}>
      <div className="page-head__main">
        <p className="eyebrow">{kicker}</p>
        <h1 className="page-title">{title}</h1>
        {deck && <p className="page-deck">{deck}</p>}
      </div>
      {children && <div className="page-head__aside">{children}</div>}
    </header>
  );
}

function SectionMast({ label, title, deck, aside }) {
  return (
    <header className="section-mast">
      <div className="section-mast__main">
        {label && <p className="folio-label">{label}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="section-mast__aside">
        {deck && <p className="section-deck">{deck}</p>}
        {aside}
      </div>
    </header>
  );
}

/* ---------- masthead and navigation ---------- */
function Masthead({ path, navigate, progress, onMenu, reading }) {
  const next = nextLessonFor(progress);
  const started = progress.completedLessons.length > 0;
  return (
    <header className="masthead">
      <div className="masthead-rail">
        <span>{EDITION}</span>
        <span className="masthead-dateline">{DATELINE} · The classroom edition</span>
        <span>PlainScript 2.3.1 · Free</span>
      </div>
      <div className="masthead-main">
        <Wordmark navigate={navigate} />
        <p className="masthead-motto">An independent journal<br />for people learning to code.</p>
        <div className="masthead-actions">
          <button type="button" className="button button--ink button--small" onClick={() => navigate(`/learn/${next.id}`)}>
            {started ? 'Continue learning' : 'Start lesson 01'} <ArrowRight size={13} aria-hidden="true" />
          </button>
          <button type="button" className="menu-button" onClick={onMenu} aria-label="Open the section menu">
            <Menu size={18} strokeWidth={1.7} aria-hidden="true" /><span>Menu</span>
          </button>
        </div>
      </div>
      <div className="nav-bar">
        <nav className="section-nav" aria-label="Sections">
          {SECTIONS.map((item) => (
            <button
              key={item.to}
              type="button"
              className={`nav-item${isActive(path, item.to) ? ' is-active' : ''}`}
              onClick={() => navigate(item.to)}
              aria-current={isActive(path, item.to) ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <span className="nav-end">{availableLessons.length} lessons · no account</span>
        <span className="nav-progress" aria-hidden="true"><i style={{ width: `${reading}%` }} /></span>
      </div>
    </header>
  );
}

function Drawer({ open, onClose, navigate, progress, theme, onToggleTheme }) {
  const next = nextLessonFor(progress);
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const isDark = theme === 'dark';
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <div className={`drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="drawer-scrim" onClick={onClose} aria-label="Close the menu" tabIndex={open ? 0 : -1} />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="The section menu">
        <div className="drawer-head">
          <Wordmark navigate={navigate} compact />
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close the menu"><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="drawer-theme">
          <div className="drawer-theme__copy">
            <span className="drawer-label">Reading mode</span>
            <span className="drawer-theme__name">{isDark ? 'Night edition' : 'Day edition'}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Switch to the day edition' : 'Switch to the night edition'}
            className={`theme-switch${isDark ? ' is-night' : ''}`}
            onClick={onToggleTheme}
          >
            <span className={isDark ? '' : 'is-on'}>Day</span>
            <span className="theme-switch__track" aria-hidden="true"><span className="theme-switch__thumb" /></span>
            <span className={isDark ? 'is-on' : ''}>Night</span>
          </button>
        </div>
        <p className="drawer-label">Sections</p>
        <nav className="drawer-nav" aria-label="All sections">
          {SECTIONS.map((item, index) => (
            <button
              key={item.to}
              type="button"
              className={isActive(location.pathname.replace(/\/+$/, '') || '/', item.to) ? 'is-active' : ''}
              onClick={() => navigate(item.to)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="drawer-edition">
          <p className="drawer-label">Your place in the course</p>
          <p className="drawer-percent">{percent}<span>%</span></p>
          <p className="drawer-meta">{done} of {availableLessons.length} lessons finished</p>
          <Meter value={percent} />
          <button type="button" className="drawer-next" onClick={() => navigate(`/learn/${next.id}`)}>
            <span>{done ? 'Continue with' : 'Begin with'}</span>
            <b>{next.title}</b>
          </button>
          <button type="button" className="button button--red button--small" onClick={() => navigate(`/learn/${next.id}`)}>
            Open the lesson <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-foot">
          <p>Progress is saved in this browser. No accounts, no trackers.</p>
          <a href="https://ayoistooslick.github.io/plainscript" target="_blank" rel="noreferrer">Official PlainScript documentation ↗</a>
        </div>
      </div>
    </div>
  );
}

function MobileTabs({ path, navigate }) {
  const tabs = [
    { to: '/', label: 'Front', short: '01' },
    { to: '/learn', label: 'Lessons', short: '02' },
    { to: '/playground', label: 'Playground', short: '03' },
    { to: '/whiteboard', label: 'Board', short: '04' },
  ];
  return (
    <nav className="mobile-tabs" aria-label="Quick navigation">
      {tabs.map((tab) => {
        const active = isActive(path, tab.to);
        return (
          <button key={tab.to} type="button" className={active ? 'on' : ''} onClick={() => navigate(tab.to)} aria-current={active ? 'page' : undefined}>
            <span className="tab-no">{tab.short}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Shell({ path, navigate, progress, railOpen, setRailOpen, theme, onToggleTheme, children }) {
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
  useEffect(() => {
    document.body.classList.toggle('nav-open', railOpen);
    return () => document.body.classList.remove('nav-open');
  }, [railOpen]);
  const go = useCallback((to) => { setRailOpen(false); navigate(to); }, [navigate, setRailOpen]);
  const closeRail = useCallback(() => setRailOpen(false), [setRailOpen]);
  return (
    <div className="app g-app">
      <a className="skip" href="#main">{'Skip to content'}</a>
      <GardenHeader path={path} navigate={go} progress={progress} onMenu={() => setRailOpen(true)} reading={reading} menuOpen={railOpen} />
      <main id="main" className="page g-page">{children}</main>
      <GardenFooter navigate={go} />
      <GardenTabs path={path} navigate={go} />
      <GardenDrawer
        open={railOpen}
        onClose={closeRail}
        navigate={go}
        progress={progress}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}

function Colophon({ navigate }) {
  return (
    <footer className="colophon">
      <div className="colophon-top">
        <Wordmark navigate={navigate} compact />
        <p>An independent classroom for PlainScript 2.3.1, printed on the web. Written for people starting from zero.</p>
        <PressMark size={30} />
      </div>
      <div className="colophon-grid">
        <div>
          <p className="colophon-label">Sections</p>
          <nav className="colophon-nav" aria-label="Footer navigation">
            {SECTIONS.slice(1).map((item) => (
              <button key={item.to} type="button" onClick={() => navigate(item.to)}>{item.label}</button>
            ))}
          </nav>
        </div>
        <div>
          <p className="colophon-label">The classroom</p>
          <p className="colophon-copy">{availableLessons.length} short lessons in reading order, each with a real program you can change and run. Progress saves in this browser only. No accounts, no trackers, no advertising.</p>
        </div>
        <div>
          <p className="colophon-label">Imprint</p>
          <p className="colophon-copy">PlainScript 2.3.1 is an independent, MIT-licensed language created by Ayodele Ayokunle David. Every runnable specimen here is compiled by the published <code>plainscript-lang</code> package.</p>
          <a className="colophon-link" href="https://ayoistooslick.github.io/plainscript" target="_blank" rel="noreferrer">The official documentation ↗</a>
        </div>
      </div>
      <div className="imprint">
        <span>LearnPlainScript · {EDITION} · {DATELINE}</span>
        <span>Set in Fraunces, Newsreader and IBM Plex Mono.</span>
        <span>Independent companion · not affiliated with the language author.</span>
      </div>
    </footer>
  );
}

/* ---------- the front page ---------- */
function ContinueBand({ progress, navigate }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  return (
    <section className="continue-band" aria-label="Continue learning">
      <span className="continue-label"><PressMark size={14} /> Your place in the course</span>
      <Meter value={percent} className="continue-meter" />
      <span className="continue-count">{done} / {availableLessons.length} finished</span>
      <div className="continue-next">
        <span>{done === 0 ? 'Begin with' : 'Continue with'}</span>
        <b>{next.title}</b>
      </div>
      <button type="button" className="button button--red button--small" onClick={() => navigate(`/learn/${next.id}`)}>
        {done === 0 ? 'Open lesson 01' : 'Continue'} <ArrowRight size={13} aria-hidden="true" />
      </button>
    </section>
  );
}

function Spotlight({ navigate }) {
  const items = [
    { tag: 'Cover story', title: 'Why PlainScript reads differently', lesson: 'why-plainscript', meta: 'Chapter 01 · 8 min' },
    { tag: 'The object model', title: 'Classes with real semantics', lesson: 'classes', meta: 'Chapter 19 · 8 min' },
    { tag: 'Language desk', title: 'Generators and lazy iteration', lesson: 'generators', meta: 'Chapter 19 · 8 min' },
    { tag: 'Commentary', title: 'Failure is part of the contract', lesson: 'typed-errors', meta: 'Chapter 20 · 8 min' },
  ];
  return (
    <aside className="spotlight" aria-label="Spotlight">
      <h2 className="spotlight-head">Spotlight</h2>
      {items.map((item) => (
        <button key={item.lesson} type="button" className="spotlight-item" onClick={() => navigate(`/learn/${item.lesson}`)}>
          <span className="spotlight-tag">{item.tag}</span>
          <span className="spotlight-title">{item.title}</span>
          <span className="spotlight-meta">{item.meta}</span>
        </button>
      ))}
    </aside>
  );
}

function CoverStory({ navigate }) {
  const lesson = availableLessons.find((item) => item.id === 'why-plainscript') || availableLessons[0];
  return (
    <article className="cover-story">
      <div className="cover-top">
        <figure className="cover-figure">
          <div className="plate">
            <img src={ART.cover} alt="A letterpress type case with compartments of metal letters and a composing stick." width="900" height="620" />
          </div>
          <figcaption><span>Plate I</span> The type case, arranged. Every word is set by hand before it can be read.</figcaption>
        </figure>
        <div className="cover-headline">
          <p className="story-tag">Cover story · Lesson 01</p>
          <h2 className="cover-title">
            <button type="button" onClick={() => navigate(`/learn/${lesson.id}`)}>
              A language that reads<br /><em>like a sentence.</em>
            </button>
          </h2>
          <p className="cover-deck">{lesson.intro}</p>
          <p className="byline">From the classroom desk <span>·</span> {lesson.duration} <span>·</span> PlainScript 2.3.1</p>
        </div>
      </div>
      <p className="cover-text">{plainWords['why-plainscript']}</p>
      <p className="cover-text">You will write a real program in the first five minutes, run it against the same compiler the language ships with, and read the answer on screen. Nothing to install. No account. Nothing you can break.</p>
      <div className="cover-actions">
        <button type="button" className="button button--ink" onClick={() => navigate(`/learn/${lesson.id}`)}>
          Begin lesson 01 <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="link-button" onClick={() => navigate('/learn')}>Read the full contents →</button>
      </div>
    </article>
  );
}

function RightRail({ progress, navigate }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  return (
    <aside className="front-rail" aria-label="Your edition">
      <div className="rail-edition">
        <div className="rail-heading">
          <span className="rail-kicker">Your edition</span>
          <PressMark size={16} />
        </div>
        <p className="edition-percent">{percent}<span>%</span></p>
        <p className="edition-meta">{done} of {availableLessons.length} lessons finished</p>
        <Meter value={percent} />
        <p className="edition-next-label">{done === 0 ? 'Begin with' : 'Pick up at'}</p>
        <button type="button" className="edition-next" onClick={() => navigate(`/learn/${next.id}`)}>{next.title}</button>
        <p className="edition-lesson-meta">Lesson {String(lessonPosition(next)).padStart(2, '0')} · {next.duration}</p>
        <button type="button" className="button button--red button--small edition-button" onClick={() => navigate(`/learn/${next.id}`)}>
          {done === 0 ? 'Open lesson 01' : 'Continue reading'} <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
      <blockquote className="rail-quote">
        <PressMark size={20} />
        <p>“Read the sentence. Then run it.”</p>
        <footer>The classroom motto<span>Issued with every lesson.</span></footer>
      </blockquote>
      <div className="rail-note">
        <span className="rail-kicker">A note from the desk</span>
        <p>Every runnable example in this edition is compiled and executed with the published <code>plainscript-lang@2.3.1</code> package before it reaches you.</p>
      </div>
    </aside>
  );
}

function StoryCard({ art, tag, title, deck, meta, onClick }) {
  return (
    <article className="story-card">
      <button type="button" className="story-card__image" onClick={onClick} aria-label={title}>
        <div className="plate"><img src={art} alt="" loading="lazy" /></div>
      </button>
      <p className="story-tag">{tag}</p>
      <h3 className="story-title"><button type="button" onClick={onClick}>{title}</button></h3>
      <p className="story-deck">{deck}</p>
      <p className="story-meta">{meta}</p>
    </article>
  );
}

function StoryRow({ navigate }) {
  const stories = [
    { id: 'functions', art: ART.basics, tag: 'Foundations', deck: 'A function is a named piece of work with typed inputs and one clear output.', },
    { id: 'records', art: ART.data, tag: 'Data', deck: 'Records group related values under named fields and let the checker follow their shape.', },
    { id: 'toolchain', art: ART.building, tag: 'The workbench', deck: 'Check, format, test, build, then ship. A real project is a sequence of honest steps.', },
  ];
  return (
    <div className="story-row">
      {stories.map((story) => {
        const lesson = availableLessons.find((item) => item.id === story.id);
        if (!lesson) return null;
        return (
          <StoryCard
            key={story.id}
            art={story.art}
            tag={story.tag}
            title={lesson.title}
            deck={story.deck}
            meta={`Chapter ${lesson.chapterNumber} · ${lesson.duration}`}
            onClick={() => navigate(`/learn/${lesson.id}`)}
          />
        );
      })}
    </div>
  );
}

function HomeLab() {
  const [code, setCode] = useState(homepageSpecimen);
  const { result, run, reset } = useRunner();
  return (
    <div className="nb-cell nb-cell--front">
      <div className="nb-gutter"><span>In</span><b>[ ]</b></div>
      <div className="nb-body">
        <Editor code={code} onChange={setCode} label="hello.pln" minHeight="230px" onRun={() => run(code)} />
        <div className="nb-actions">
          <button type="button" className="button button--red button--small" onClick={() => run(code)} disabled={result.status === 'running'}>
            <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run the program'}
          </button>
          <button type="button" className="icon-button" onClick={() => { setCode(homepageSpecimen); reset(); }} aria-label="Reset the example">
            <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <span className="keyboard-note">⌘ / Ctrl + Enter</span>
        </div>
        <Output result={result} compact />
      </div>
    </div>
  );
}

function OpenClassroom({ navigate }) {
  return (
    <section className="open-classroom">
      <div className="open-copy">
        <p className="eyebrow">The open classroom</p>
        <h2 className="open-title">A first program,<br /><em>ready to run.</em></h2>
        <p className="open-deck">This is not a picture of a program. Change the words inside the quotation marks, press Run, and the published PlainScript compiler will answer.</p>
        <ol className="lab-steps">
          <li><span>01</span><div><b>Read it first</b><p>One import, one function, one call. Read the three lines in order.</p></div></li>
          <li><span>02</span><div><b>Change one thing</b><p>Rename the reader, or rewrite the greeting. Leave the quotation marks alone.</p></div></li>
          <li><span>03</span><div><b>Read the output</b><p>The answer arrives from the real 2.3.1 compiler, not a simulation.</p></div></li>
        </ol>
        <button type="button" className="link-button" onClick={() => navigate('/playground')}>Open the full playground →</button>
      </div>
      <div className="open-cell">
        <div className="open-cell__head">
          <span>Demonstration</span>
          <span>hello.pln</span>
        </div>
        <HomeLab />
        <p className="open-cell__note">Programs stop after 3.5 seconds. Output is capped at 64 KB. File, network and process access are removed before the program runs.</p>
      </div>
    </section>
  );
}

function CurriculumStrip({ progress, navigate }) {
  return (
    <section className="curriculum-strip">
      <SectionMast
        label="The course"
        title={<>The whole syllabus,<br /><em>in reading order.</em></>}
        deck={`${availableLessons.length} short lessons. Start at the top, finish one, then take the next. Every lesson ends with something you can run.`}
        aside={<button type="button" className="button button--line button--small" onClick={() => navigate('/learn')}>Open the contents <ArrowRight size={13} aria-hidden="true" /></button>}
      />
      <LessonPath progress={progress} navigate={navigate} compact />
    </section>
  );
}

function FrontNotes({ navigate }) {
  const updates = [
    { no: '01', title: 'Classes with real semantics', text: 'Constructors, methods, this, inheritance, super, static and readonly fields. They compile to native JavaScript classes.', lesson: 'classes' },
    { no: '02', title: 'Generators, typed errors, BigInt', text: 'Lazy sequences, declared throws contracts, and the 2.3 additions that make larger programs honest.', lesson: 'generators' },
    { no: '03', title: 'A toolchain, not a toy', text: 'Incremental builds, a bundler, an optimiser and ten standard-library modules. Checking stays separate from running.', lesson: 'toolchain' },
  ];
  return (
    <section className="front-notes">
      <div className="notes-column notes-column--wide">
        <p className="eyebrow">The language desk</p>
        <h2 className="notes-title">PlainScript 2.3.1,<br /><em>in brief.</em></h2>
        <div className="update-list">
          {updates.map((update) => (
            <article key={update.no} className="update-item">
              <span className="update-no">{update.no}</span>
              <div>
                <h3>{update.title}</h3>
                <p>{update.text}</p>
                <button type="button" className="link-button" onClick={() => navigate(`/learn/${update.lesson}`)}>Read the lesson →</button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="notes-column notices-column">
        <p className="eyebrow">Classroom notices</p>
        <h2 className="notes-title">Good to know.</h2>
        <ul className="notice-list">
          <li><span>No account</span><p>The whole course is open. Progress is kept in this browser and nowhere else.</p></li>
          <li><span>No installation</span><p>Every example runs on the server against the published compiler. You only need a browser.</p></li>
          <li><span>No pretending</span><p>Examples that need a React project are marked as reading specimens. They are never faked.</p></li>
        </ul>
        <div className="notice-seal">
          <PressMark size={24} />
          <p>Twenty-two lessons<br />One clear path<br />PlainScript 2.3.1</p>
        </div>
      </div>
    </section>
  );
}

function Classroom({ navigate, progress }) {
  return (
    <div className="front-page">
      <section className="latest-section">
        <header className="section-mast section-mast--front">
          <div className="section-mast__main">
            <p className="folio-label">The classroom edition · {DATELINE}</p>
            <h1 className="front-title">Latest <em>lessons</em></h1>
          </div>
          <div className="section-mast__aside">
            <p className="section-deck">A first lesson in reading code, the newest notes from the language desk, and the exercises for this edition. Start anywhere — the path will keep your place.</p>
          </div>
        </header>
        <ContinueBand progress={progress} navigate={navigate} />
        <div className="edition-grid">
          <Spotlight navigate={navigate} />
          <CoverStory navigate={navigate} />
          <RightRail progress={progress} navigate={navigate} />
        </div>
        <StoryRow navigate={navigate} />
      </section>
      <OpenClassroom navigate={navigate} />
      <CurriculumStrip progress={progress} navigate={navigate} />
      <FrontNotes navigate={navigate} />
    </div>
  );
}

/* ---------- shared lesson path ---------- */
function LessonPath({ progress, navigate, compact = false, limit }) {
  const done = progress.completedLessons;
  const next = nextLessonFor(progress);
  const nextIndex = availableLessons.findIndex((lesson) => lesson.id === next.id);
  const start = compact ? Math.max(0, nextIndex - 1) : 0;
  const end = compact ? start + 5 : (limit || availableLessons.length);
  const list = availableLessons.slice(start, end);
  return (
    <div className="lesson-index">
      <ol>
        {list.map((lesson) => {
          const isDone = done.includes(lesson.id);
          const isNext = lesson.id === next.id;
          return (
            <li key={lesson.id} className={`lesson-row${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}>
              <button type="button" className="lesson-row__link" onClick={() => navigate(`/learn/${lesson.id}`)}>
                <span className="lesson-row__no">{isDone ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : String(lessonPosition(lesson)).padStart(2, '0')}</span>
                <span className="lesson-row__title">{lesson.title}</span>
                <span className="lesson-row__meta">Chapter {lesson.chapterNumber} · {lesson.duration}</span>
                <span className="lesson-row__state">{isDone ? 'Read' : isNext ? 'Next' : ''}</span>
                <ArrowRight size={14} strokeWidth={1.7} aria-hidden="true" className="lesson-row__arrow" />
              </button>
            </li>
          );
        })}
      </ol>
      {compact && (
        <button type="button" className="lesson-index__more button button--line button--small" onClick={() => navigate('/learn')}>
          See all {availableLessons.length} lessons <ArrowRight size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- all lessons ---------- */
function Curriculum({ navigate, progress, resetProgress }) {
  const done = progress.completedLessons;
  const percent = Math.round((done.length / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  return (
    <div className="contents-page">
      <PageHead
        kicker="The course · Contents"
        title={<>The whole course,<br /><em>in reading order.</em></>}
        deck="Twenty-two short lessons, gathered into chapters. Read one, run its program, answer the check, then take the next. Finished lessons are marked in the margin."
        split
      >
        <div className="contents-folio">
          <span className="folio-label">This edition</span>
          <p>{availableLessons.length} lessons<br />{chapters.length} chapters<br />8 minutes each</p>
          <PressMark size={24} />
        </div>
      </PageHead>
      <div className="contents-summary">
        <div className="contents-summary__stat">
          <span>Your place</span>
          <b>{done.length} of {availableLessons.length}</b>
        </div>
        <Meter value={percent} className="contents-summary__meter" />
        <span className="contents-summary__percent">{percent}% finished</span>
        <button type="button" className="button button--red button--small" onClick={() => navigate(`/learn/${next.id}`)}>
          {done.length === 0 ? 'Start lesson 01' : 'Continue'} <ArrowRight size={13} aria-hidden="true" />
        </button>
        {done.length > 0 && <button type="button" className="link-button contents-reset" onClick={resetProgress}>Reset progress</button>}
      </div>
      <div className="chapter-grid">
        {chapters.map((chapter) => (
          <section className="chapter-block" key={chapter.number}>
            <header className="chapter-head">
              <span className="chapter-no">{chapter.number}</span>
              <div>
                <h2>{chapter.title}</h2>
                <p>{chapter.summary}</p>
              </div>
            </header>
            <ol className="chapter-lessons">
              {chapter.lessons.map((lesson) => {
                const isDone = done.includes(lesson.id);
                const isNext = lesson.id === next.id;
                return (
                  <li key={lesson.id}>
                    <button type="button" className={`chapter-lesson${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`} onClick={() => navigate(`/learn/${lesson.id}`)}>
                      <span className="chapter-lesson__mark">{isDone ? <Check size={12} strokeWidth={2.6} aria-hidden="true" /> : isNext ? '→' : '·'}</span>
                      <span className="chapter-lesson__title">{lesson.title}</span>
                      <span className="chapter-lesson__meta">{lesson.duration}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      <p className="contents-note">
        Every runnable example is checked against <code>plainscript-lang@2.3.1</code>.
        Topics such as files, databases and HTTP are explained as boundaries of the runtime, not invented as portable syntax.
      </p>
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
  useEffect(() => { setCode(challenge?.starter || lesson.example); setHint(false); reset(); }, [lesson.id, lesson.example, challenge, reset]);
  const execute = async () => {
    if (!runnable) return;
    const payload = await run(code);
    if (payload?.ok) {
      const normalise = (value) => (value || '').trim().replace(/\s+/g, ' ');
      if (normalise(payload.output) === normalise(challenge.expectedOutput)) completeChallenge(lesson.id);
    }
  };
  return (
    <section className="desk-panel">
      <header className="desk-panel__head">
        <span className="panel-no">01 · Exercise</span>
        <h3>{done ? 'The compiler agrees.' : 'Change the code yourself.'}</h3>
      </header>
      <p className="panel-prompt"><Inline text={challenge?.prompt || ''} /></p>
      <div className="nb-cell">
        <div className="nb-gutter"><span>In</span><b>[ ]</b></div>
        <div className="nb-body">
          <Editor code={code} onChange={setCode} label={`${lesson.id}.pln`} onRun={execute} diagnostics={result.status === 'error' ? result.error : ''} />
          <div className="nb-actions">
            <button type="button" className="button button--red button--small" onClick={execute} disabled={!runnable || result.status === 'running'}>
              <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run the program'}
            </button>
            <button type="button" className="icon-button" onClick={() => { setCode(challenge?.starter || lesson.example); reset(); }} aria-label="Reset the code">
              <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button type="button" className="link-button" onClick={() => setHint((value) => !value)}>{hint ? 'Hide hint' : 'Show hint'}</button>
          </div>
          {!runnable && <p className="panel-note">This example needs a whole project around it, so it is read rather than run here.</p>}
          {hint && challenge?.hint && <p className="hint-box"><Inline text={challenge.hint} /></p>}
          <Output result={result} compact />
          {done && <p className="practice-success"><Check size={12} strokeWidth={2.5} aria-hidden="true" /> Challenge recorded in this browser.</p>}
        </div>
      </div>
    </section>
  );
}

function LessonQuiz({ lesson, savedScore, saveQuiz }) {
  const quiz = lesson.quiz;
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  useEffect(() => setSelected(null), [lesson.id]);
  const choose = (index) => {
    if (answered) return;
    setSelected(index);
    saveQuiz(lesson.id, index === quiz.answer ? 1 : 0);
  };
  return (
    <section className="desk-panel">
      <header className="desk-panel__head">
        <span className="panel-no">02 · Check</span>
        <h3>{quiz.question}</h3>
      </header>
      <div className="quiz-options" role="group" aria-label="Answer options">
        {quiz.options.map((option, index) => {
          const state = !answered ? '' : index === quiz.answer ? 'correct' : index === selected ? 'incorrect' : 'muted';
          return (
            <button key={option} type="button" className={state} onClick={() => choose(index)} disabled={answered} aria-pressed={selected === index}>
              <span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback ${selected === quiz.answer ? 'correct' : 'incorrect'}`}>
          <b>{selected === quiz.answer ? 'Correct.' : 'Not quite — here is why.'}</b>
          <p><Inline text={quiz.explanation} /></p>
          {selected !== quiz.answer && <button type="button" className="link-button" onClick={() => setSelected(null)}>Try again</button>}
        </div>
      )}
      {!answered && savedScore === 1 && <p className="quiz-prior">You answered this correctly on an earlier visit.</p>}
    </section>
  );
}

function LessonPage({ lesson, navigate, progress, completeLesson, completeChallenge, saveQuiz }) {
  const index = availableLessons.findIndex((item) => item.id === lesson.id);
  const previous = availableLessons[index - 1];
  const next = availableLessons[index + 1];
  const isComplete = progress.completedLessons.includes(lesson.id);
  const percent = Math.round(((index + (isComplete ? 1 : 0)) / availableLessons.length) * 100);
  useEffect(() => { window.scrollTo(0, 0); }, [lesson.id]);
  const contents = [
    ['overview', 'What you will learn'],
    ['idea', 'The idea'],
    ['predict', 'Guess what it prints'],
    ['try-it', 'Try it yourself'],
    ['words', 'The words, close up'],
    ['mistakes', 'Common mistakes'],
  ];
  const bed = bedForLesson(lesson);
  const stage = stageForLesson(lesson);
  return (
    <article className="lesson">
      <div className="lesson-topline">
        <button type="button" className="back-link" onClick={() => navigate('/learn')}>
          <ArrowLeft size={14} aria-hidden="true" /> The garden
        </button>
        <span className="lesson-topline__count">Lesson {String(index + 1).padStart(2, '0')} of {String(availableLessons.length).padStart(2, '0')}</span>
        <div className="lesson-topline__meter"><Meter value={percent} /></div>
      </div>

      <header className="lesson-head">
        <div className="lesson-head__main">
          <div className="lesson-kicker">
            <p className="eyebrow">Chapter {lesson.chapterNumber} · {lesson.chapter}</p>
            <StageBadge stage={stage} />
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>
          {bed && (
            <p className="lesson-bed-path">
              <button type="button" onClick={() => navigate('/learn')}>The garden</button>
              <span>/</span>
              <button type="button" onClick={() => navigate(`/learn?bed=${bed.id}`)}>{bed.title}</button>
            </p>
          )}
          <p className="lesson-deck"><Inline text={lesson.intro} /></p>
          <p className="lesson-byline">
            <span>Lesson {String(index + 1).padStart(2, '0')}</span>
            <span>{lesson.duration}</span>
            <span>PlainScript 2.3.1</span>
            <span className={isComplete ? 'is-finished' : ''}>{isComplete ? 'Finished' : 'Reading copy'}</span>
          </p>
        </div>
        <aside className="lesson-folio" aria-label="Lesson folio">
          <span className="lesson-folio__no">{String(index + 1).padStart(2, '0')}</span>
          <span className="lesson-folio__label">Lesson</span>
          <div className="lesson-folio__rule" />
          <dl>
            <div><dt>Chapter</dt><dd>{lesson.chapterNumber}</dd></div>
            <div><dt>Reading time</dt><dd>{lesson.duration}</dd></div>
            <div><dt>Compiler</dt><dd>2.3.1</dd></div>
          </dl>
          <p className={`lesson-folio__state${isComplete ? ' is-finished' : ''}`}>
            {isComplete ? <><Check size={12} strokeWidth={2.6} aria-hidden="true" /> Marked finished</> : 'Not finished yet'}
          </p>
        </aside>
      </header>

      <aside className="g-audience">
        <span className="g-eyebrow">Assumed audience</span>
        <p>Someone who can use a browser and is happy to read carefully. No prior PlainScript, and no installation, is required.</p>
      </aside>

      <div className="lesson-grid">
        <div className="lesson-article">
          <section className="lesson-sec" id="overview">
            <h2 className="sec-title"><span>01</span>What you will learn</h2>
            <ul className="objectives">
              {lesson.objectives.map((objective) => <li key={objective}><Inline text={objective} /></li>)}
            </ul>
          </section>

          <section className="lesson-sec" id="idea">
            <h2 className="sec-title"><span>02</span>The idea</h2>
            <p className="prose dropcap"><Inline text={lesson.explanation} /></p>
          </section>

          {plainWords[lesson.id] && (
            <aside className="pullquote" aria-label="In plain words">
              <span className="pullquote__label">In plain words</span>
              <p><Inline text={plainWords[lesson.id]} /></p>
            </aside>
          )}

          <section className="lesson-sec" id="predict">
            <h2 className="sec-title"><span>03</span>Guess what it prints</h2>
            <p className="prose">Before you run it, write down what you think the program will print. Guessing first is how the idea sticks.</p>
            <PredictRun lesson={lesson} />
          </section>

          <section className="lesson-sec" id="try-it">
            <h2 className="sec-title"><span>04</span>Try it yourself</h2>
            <p className="prose">Now change the example. Run it as many times as you like — the compiler is the honest one here.</p>
            {lesson.expectedOutput
              ? <TryIt lesson={lesson} />
              : (
                <>
                  <CodeSpecimen code={lesson.example} file={`${lesson.id}.pln`} />
                  <p className="specimen-note">This example needs a React project around it, so it is read rather than run in the browser.</p>
                </>
              )}
          </section>

          <section className="lesson-sec" id="words">
            <h2 className="sec-title"><span>05</span>The words, close up</h2>
            <div className="syntax-list">
              {lesson.syntax.map(([term, description]) => (
                <div className="syntax-row" key={term}>
                  <code className="syntax-term"><Tokens code={term.replace(/`/g, '')} /></code>
                  <span><Inline text={description} /></span>
                </div>
              ))}
            </div>
          </section>

          <section className="lesson-sec" id="mistakes">
            <h2 className="sec-title"><span>06</span>Common mistakes</h2>
            <ul className="mistakes">
              {lesson.commonMistakes.map((mistake) => <li key={mistake}><Inline text={mistake} /></li>)}
            </ul>
            <div className="exercise-box">
              <span className="exercise-box__label">Exercise</span>
              <p><Inline text={lesson.exercise} /></p>
            </div>
          </section>
        </div>

        <aside className="lesson-margin">
          <div className="margin-card">
            <span className="margin-label">On this page</span>
            <ol className="margin-contents">
              {contents.map(([anchor, label], itemIndex) => (
                <li key={anchor}><a href={`#${anchor}`}><span>{String(itemIndex + 1).padStart(2, '0')}</span>{label}</a></li>
              ))}
            </ol>
          </div>
          <div className="margin-card">
            <span className="margin-label">At a glance</span>
            <dl className="margin-facts">
              <div><dt>Chapter</dt><dd>{lesson.chapterNumber} · {lesson.chapter}</dd></div>
              <div><dt>Time</dt><dd>{lesson.duration}</dd></div>
              <div><dt>Language</dt><dd>PlainScript 2.3.1</dd></div>
            </dl>
          </div>
          <div className="margin-progress">
            <span className="margin-label">Your place</span>
            <p>{progress.completedLessons.length} of {availableLessons.length} lessons finished</p>
            <Meter value={Math.round((progress.completedLessons.length / availableLessons.length) * 100)} />
          </div>
          {bed && (
            <div className="margin-card">
              <span className="margin-label">Tended in</span>
              <p className="margin-bed">{bed.title}</p>
              <button type="button" className="link-button" onClick={() => navigate(`/learn?bed=${bed.id}`)}>See the whole bed →</button>
            </div>
          )}
        </aside>
      </div>

      <section className="exercises" id="exercises">
        <div className="exercises-head">
          <p className="eyebrow">The bench</p>
          <h2>Your turn <em>at the desk.</em></h2>
          <p>One small program to change and one question to answer. Your work stays in this browser; nothing is sent anywhere except the program you choose to run.</p>
        </div>
        <div className="exercise-panels">
          <LessonPractice lesson={lesson} progress={progress} completeChallenge={completeChallenge} />
          <LessonQuiz lesson={lesson} savedScore={progress.quizScores[lesson.id]} saveQuiz={saveQuiz} />
        </div>
      </section>

      <RelatedNotes lesson={lesson} navigate={navigate} />

      <div className={`lesson-signoff${isComplete ? ' is-finished' : ''}`}>
        <PressMark size={22} />
        <div>
          <b>{isComplete ? 'Lesson finished.' : 'Finished reading?'}</b>
          <p>{isComplete ? 'Saved in this browser. You can always read it again.' : 'Mark the lesson when the idea feels clear. You can undo it by resetting your progress on the contents page.'}</p>
        </div>
        {!isComplete
          ? <button type="button" className="button button--ink button--small" onClick={() => completeLesson(lesson.id)}>Mark as finished</button>
          : <span className="lesson-signoff__folio">{String(index + 1).padStart(2, '0')} / {String(availableLessons.length).padStart(2, '0')}</span>}
      </div>

      <nav className="lesson-turn" aria-label="Lesson navigation">
        {previous ? (
          <button type="button" className="turn-prev" onClick={() => navigate(`/learn/${previous.id}`)}>
            <span>← Previous lesson</span>
            <b>{previous.title}</b>
          </button>
        ) : <span className="turn-prev is-empty" aria-hidden="true" />}
        <button type="button" className="turn-next" onClick={() => navigate(next ? `/learn/${next.id}` : '/learn')}>
          <span>{next ? 'Next lesson' : 'The course is finished'}</span>
          <b>{next ? next.title : 'Return to the contents'}</b>
          <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </nav>
    </article>
  );
}

/* ---------- playground ---------- */
function Playground({ navigate }) {
  const [exampleId, setExampleId] = useState(playgroundExamples[0].id);
  const example = useMemo(
    () => playgroundExamples.find((item) => item.id === exampleId) || playgroundExamples[0],
    [exampleId],
  );
  const [code, setCode] = useState(example.code);
  const { result, run, reset } = useRunner();
  const choose = (item) => { setExampleId(item.id); setCode(item.code); reset(); };
  return (
    <div className="workshop">
      <PageHead
        kicker="The workshop · Open editor"
        title={<>Write a program.<br /><em>Read the answer.</em></>}
        deck="A full editor for when you want to try your own PlainScript. Choose a specimen, change it, and press Run. Nothing is saved, so experiment freely."
        split
      >
        <div className="workshop-stamp">
          <PressMark size={22} />
          <span>Real compiler<br />plainscript-lang 2.3.1</span>
        </div>
      </PageHead>
      <div className="workshop-grid">
        <aside className="workshop-index" aria-label="Example programs">
          <span className="index-label">The specimens</span>
          {playgroundExamples.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={exampleId === item.id} className={exampleId === item.id ? 'on' : ''} onClick={() => choose(item)}>
              <span className="specimen-no">{String(index + 1).padStart(2, '0')}</span>
              <span className="specimen-label">{item.label}</span>
            </button>
          ))}
          <p className="workshop-index__note">Every specimen is executed against the compiler when the course is checked.</p>
        </aside>
        <div className="workshop-main">
          <label className="workshop-picker">
            <span>Choose a specimen</span>
            <select
              value={exampleId}
              onChange={(event) => {
                const item = playgroundExamples.find((entry) => entry.id === event.target.value);
                if (item) choose(item);
              }}
            >
              {playgroundExamples.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <div className="workshop-specimen-head">
            <span className="story-tag">Now editing</span>
            <h2>{example.label}</h2>
            <p>{example.note}</p>
          </div>
          <div className="nb-cell">
            <div className="nb-gutter"><span>In</span><b>[ ]</b></div>
            <div className="nb-body">
              <Editor code={code} onChange={setCode} label={`${example.id}.pln`} minHeight="430px" onRun={() => run(code)} />
              <div className="nb-actions">
                <button type="button" className="button button--red" onClick={() => run(code)} disabled={result.status === 'running'}>
                  <Play size={14} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Compiling…' : 'Run program'}
                </button>
                <button type="button" className="icon-button" onClick={() => { setCode(example.code); reset(); }} aria-label="Reset to the example">
                  <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <span className="keyboard-note">⌘ / Ctrl + Enter</span>
              </div>
              <Output result={result} />
            </div>
          </div>
          <div className="workshop-notes">
            <div><span>Time limit</span><p>Programs stop after 3.5 seconds. Infinite loops are ended for you.</p></div>
            <div><span>Output cap</span><p>Sixty-four kilobytes. A program cannot flood the page.</p></div>
            <div><span>The sandbox</span><p>File, network and process imports are removed before the program runs.</p></div>
          </div>
        </div>
      </div>
      <p className="workshop-foot">
        Need an explanation first? The <button type="button" className="link-button" onClick={() => navigate('/learn')}>lessons</button> teach each idea in order, and the <button type="button" className="link-button" onClick={() => navigate('/quiz')}>practice test</button> checks what stuck.
      </p>
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
  const choose = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === current.quiz.answer;
    if (correct) setScore((value) => value + 1);
    recordExam(current.lesson.id, correct);
  };
  const advance = () => {
    if (index + 1 >= questions.length) { setFinished(true); return; }
    setIndex((value) => value + 1);
    setSelected(null);
  };
  const restart = () => { setIndex(0); setSelected(null); setScore(0); setFinished(false); };

  if (finished) {
    const total = questions.length;
    return (
      <div className="exam-page result-page">
        <PageHead
          kicker="The practice test · Result"
          title={<>You scored<br /><em>{score} of {total}.</em></>}
          deck={score === total
            ? 'Every question correct. The playground is the better test now — try building something small.'
            : 'A score is a map, not a verdict. The lessons behind the questions you missed are still open, and you can take this again whenever you like.'}
        />
        <Meter value={Math.round((score / total) * 100)} className="result-meter" />
        <div className="result-actions">
          <button type="button" className="button button--ink" onClick={restart}>Take it again</button>
          <button type="button" className="button button--line" onClick={() => navigate('/learn')}>Back to the contents</button>
        </div>
        <div className="result-list">
          {questions.map(({ lesson }) => {
            const answer = progress.examAnswers[lesson.id];
            return (
              <button type="button" key={lesson.id} className={answer ? 'correct' : 'incorrect'} onClick={() => navigate(`/learn/${lesson.id}`)}>
                <span>{lesson.chapterNumber}</span><b>{lesson.title}</b><em>{answer ? 'correct' : 'try again'}</em>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="exam-page">
      <PageHead
        kicker="The practice test · One sitting"
        title={<>One question from<br /><em>every lesson.</em></>}
        deck={`${questions.length} questions. There is no timer and no score kept against you — each answer explains itself. Not ready? Start with lesson 01 first.`}
        split
      >
        <div className="exam-folio">
          <span className="folio-label">Question</span>
          <b>{String(index + 1).padStart(2, '0')} <span>/ {String(questions.length).padStart(2, '0')}</span></b>
          <Meter value={percent} />
        </div>
      </PageHead>
      <div className="exam-layout">
        <article className="exam-sheet">
          <header className="exam-sheet__head">
            <span>Chapter {current.lesson.chapterNumber} · {current.lesson.chapter}</span>
            <button type="button" className="link-button" onClick={() => navigate(`/learn/${current.lesson.id}`)}>Read this lesson ↗</button>
          </header>
          <h2>{current.quiz.question}</h2>
          <div className="exam-options" role="group" aria-label="Answer options">
            {current.quiz.options.map((option, optionIndex) => {
              const state = selected === null ? '' : optionIndex === current.quiz.answer ? 'correct' : optionIndex === selected ? 'incorrect' : 'muted';
              return (
                <button key={option} type="button" className={state} onClick={() => choose(optionIndex)} disabled={selected !== null} aria-pressed={selected === optionIndex}>
                  <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className={`quiz-feedback ${selected === current.quiz.answer ? 'correct' : 'incorrect'}`}>
              <b>{selected === current.quiz.answer ? 'Correct.' : `The answer is ${String.fromCharCode(65 + current.quiz.answer)}.`}</b>
              <p><Inline text={current.quiz.explanation} /></p>
              <button type="button" className="button button--ink button--small" onClick={advance}>
                {index + 1 >= questions.length ? 'See my result' : 'Next question'} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          )}
        </article>
        <aside className="exam-margin" aria-label="Notes on this test">
          <div className="margin-card">
            <span className="margin-label">In this sitting</span>
            <dl className="margin-facts">
              <div><dt>Correct so far</dt><dd>{score}</dd></div>
              <div><dt>Source</dt><dd>{current.lesson.chapter}</dd></div>
              <div><dt>Answering</dt><dd>Lesson {current.lesson.chapterNumber}</dd></div>
            </dl>
          </div>
          <div className="margin-card">
            <span className="margin-label">The rules</span>
            <p className="exam-rule">There is no timer. Each answer explains itself, and a wrong answer links back to the lesson that teaches it.</p>
          </div>
          <div className="exam-margin__seal">
            <PressMark size={22} />
            <p>One question from every lesson. No score is kept against you.</p>
          </div>
        </aside>
      </div>
      <div className="exam-dots" aria-hidden="true">
        {questions.map((question, dotIndex) => (
          <span key={question.lesson.id} className={dotIndex < index ? 'past' : dotIndex === index ? 'now' : ''} />
        ))}
      </div>
    </div>
  );
}

/* ---------- projects ---------- */
function Projects({ navigate }) {
  return (
    <div className="projects-page">
      <PageHead
        kicker="Mini projects · Open briefs"
        title={<>Build something<br /><em>of your own.</em></>}
        deck="Lessons teach one word at a time. A project asks you to use a few of them together. None of these has one correct answer — each has a clear test you can apply yourself."
        split
      >
        <div className="workshop-stamp">
          <PressMark size={22} />
          <span>Three briefs<br />No deadline</span>
        </div>
      </PageHead>
      <div className="project-index">
        {projects.map((project) => (
          <article className="project-entry" key={project.id}>
            <div className="project-number">{project.number}</div>
            <div className="project-main">
              <p className="project-meta"><span>{project.level}</span><i>·</i><span>{project.concepts.join(' / ')}</span></p>
              <h2>{project.title}</h2>
              <p className="project-description">{project.description}</p>
              <div className="project-columns">
                <div><b>What it needs</b><ul>{project.requirements.map((item) => <li key={item}><Inline text={item} /></li>)}</ul></div>
                <div><b>How to start</b><p><Inline text={project.starting} /></p></div>
                <div><b>Finished when</b><p><Inline text={project.criteria} /></p></div>
              </div>
              <div className="project-actions">
                <button type="button" className="link-button" onClick={() => navigate('/playground')}>Open the playground →</button>
                <button type="button" className="link-button" onClick={() => navigate('/learn')}>Find the lessons →</button>
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
  const next = nextLessonFor(progress);
  const examDone = Object.keys(progress.examAnswers).length;
  const examCorrect = Object.values(progress.examAnswers).filter(Boolean).length;
  const checksPassed = progress.completedChallenges.length;
  return (
    <div className="progress-page">
      <PageHead
        kicker="My progress · Saved locally"
        title={<>Your ledger,<br /><em>{done} of {availableLessons.length}.</em></>}
        deck="Progress is saved in this browser only. Clearing your browser data will reset it. There is no account, no server copy and no one watching the numbers."
        split
      >
        <div className="ledger-seal">
          <PressMark size={24} />
          <p>{percent}% of the course<br />read in this browser</p>
        </div>
      </PageHead>
      <div className="ledger">
        <div className="ledger-stat"><span>Lessons finished</span><b>{done}</b><small>of {availableLessons.length}</small></div>
        <div className="ledger-stat"><span>Coding exercises</span><b>{checksPassed}</b><small>of {availableLessons.length}</small></div>
        <div className="ledger-stat"><span>Practice test</span><b>{examCorrect}</b><small>of {examDone} answered</small></div>
        <div className="ledger-stat"><span>Course read</span><b>{percent}<i>%</i></b><small>of the edition</small></div>
      </div>
      <div className="progress-next">
        <span className="folio-label">Up next</span>
        <b>{next.title}</b>
        <span>Lesson {String(lessonPosition(next)).padStart(2, '0')} · {next.duration}</span>
        <button type="button" className="button button--red button--small" onClick={() => navigate(`/learn/${next.id}`)}>
          Continue <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
      <SectionMast
        label="The full ledger"
        title={<>Every lesson,<br /><em>one line each.</em></>}
        deck="A tick means you marked the lesson finished. A challenge tick means the compiler produced the lesson's expected output."
      />
      <LessonPath progress={progress} navigate={navigate} />
      {done > 0 && <div className="danger-zone"><button type="button" className="link-button" onClick={resetProgress}>Reset all progress</button></div>}
    </div>
  );
}

/* ---------- not found ---------- */
function NotFound({ navigate }) {
  return (
    <div className="not-found">
      <GardenMark size={38} />
      <p className="eyebrow">Off the path</p>
      <h1 className="page-title">This path has<br /><em>gone to seed.</em></h1>
      <p className="page-deck">The link may be old. The garden is the reliable place to start again.</p>
      <div className="not-found__actions">
        <button type="button" className="button button--ink" onClick={() => navigate('/learn')}>Wander the garden</button>
        <button type="button" className="button button--line" onClick={() => navigate('/')}>The front page</button>
      </div>
    </div>
  );
}

/* ---------- app ---------- */
function routePath() { return window.location.pathname.replace(/\/+$/, '') || '/'; }

function App() {
  const [path, setPath] = useState(routePath);
  const [search, setSearch] = useState(() => window.location.search);
  const [railOpen, setRailOpen] = useState(false);
  const progressState = useProgress();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    const onPop = () => { setPath(routePath()); setSearch(window.location.search); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((to) => {
    const current = `${path}${window.location.search}`;
    if (to === current) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    window.history.pushState({}, '', to);
    setPath(routePath());
    setSearch(window.location.search);
    window.scrollTo(0, 0);
  }, [path]);

  let view;
  let title = 'LearnPlainScript · A garden for readable code';

  if (path === '/') {
    view = <GardenHome navigate={navigate} progress={progressState.progress} />;
  } else if (path === '/learn') {
    view = (
      <GardenIndex
        navigate={navigate}
        progress={progressState.progress}
        resetProgress={progressState.resetProgress}
        initialBed={new URLSearchParams(search).get('bed') || 'all'}
      />
    );
    title = 'The Garden · LearnPlainScript';
  } else if (path.startsWith('/learn/')) {
    const lesson = availableLessons.find((item) => item.id === path.slice('/learn/'.length));
    if (lesson) {
      view = (
        <LessonPage
          lesson={lesson}
          navigate={navigate}
          progress={progressState.progress}
          completeLesson={progressState.completeLesson}
          completeChallenge={progressState.completeChallenge}
          saveQuiz={progressState.saveQuiz}
        />
      );
        title = `${lesson.title} · LearnPlainScript`;
    } else {
      view = <NotFound navigate={navigate} />;
      title = 'Page not found · LearnPlainScript';
    }
  } else if (path === '/whiteboard') {
    view = (
      <Whiteboard
        navigate={navigate}
        progress={progressState.progress}
        saveNote={progressState.saveNote}
        saveQuiz={progressState.saveQuiz}
      />
    );
    title = 'The lecture board · LearnPlainScript';
  } else if (path === '/playground') {
    view = <Playground navigate={navigate} />;
    title = 'The potting shed · LearnPlainScript';
  } else if (path === '/quiz') {
    view = <Examination progress={progressState.progress} recordExam={progressState.recordExam} navigate={navigate} />;
    title = 'Practice · LearnPlainScript';
  } else if (path === '/projects') {
    view = <Projects navigate={navigate} />;
    title = 'Projects · LearnPlainScript';
  } else if (path === '/progress') {
    view = <Progress progress={progressState.progress} navigate={navigate} resetProgress={progressState.resetProgress} />;
    title = 'Your progress · LearnPlainScript';
  } else {
    view = <NotFound navigate={navigate} />;
    title = 'Page not found · LearnPlainScript';
  }

  useEffect(() => { document.title = title; }, [title]);
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [path]);
  return (
    <Shell
      path={path}
      navigate={navigate}
      progress={progressState.progress}
      railOpen={railOpen}
      setRailOpen={setRailOpen}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {view}
    </Shell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
