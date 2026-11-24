import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ClipboardList, GraduationCap,
  LayoutDashboard, Menu, Play, RotateCcw, Terminal, TrendingUp, X,
} from 'lucide-react';
import { availableLessons, plainWords, projects } from './content.js';
import { homepageSpecimen, playgroundExamples } from './examples.js';
import { CodeSpecimen, Inline, Tokens } from './highlight.jsx';
import { Editor } from './editor.jsx';
import { Output, useRunner } from './runner.jsx';
import { Whiteboard } from './board.jsx';
import { PredictRun, TryIt } from './interactive.jsx';
import './styles.css';

const STORAGE_KEY = 'learnplainscript.progress.v1';
const defaultProgress = {
  completedLessons: [],
  completedChallenges: [],
  quizScores: {},
  examAnswers: {},
  lastLesson: 'why-plainscript',
  notes: {},
};

const ART = {
  hero: '/art/student-desk.svg',
  basics: '/art/lesson-basics.svg',
  data: '/art/lesson-data.svg',
  building: '/art/lesson-building.svg',
};

function artForLesson(index) {
  if (index < 8) return { src: ART.basics, alt: 'A student writing on a chalkboard beside an open notebook.' };
  if (index < 16) return { src: ART.data, alt: 'A student sorting notes into stacks and drawing arrows between them.' };
  return { src: ART.building, alt: 'A student building a small web page on a laptop at a desk.' };
}

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
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}
  }, [progress]);
  const completeLesson = (id) => setProgress((c) => ({ ...c, completedLessons: c.completedLessons.includes(id) ? c.completedLessons : [...c.completedLessons, id], lastLesson: id }));
  const completeChallenge = (id) => setProgress((c) => ({ ...c, completedChallenges: c.completedChallenges.includes(id) ? c.completedChallenges : [...c.completedChallenges, id] }));
  const saveQuiz = (id, score) => setProgress((c) => ({ ...c, quizScores: { ...c.quizScores, [id]: score }, lastLesson: id }));
  const saveNote = (key, value) => setProgress((c) => ({ ...c, notes: { ...c.notes, [key]: value } }));
  const recordExam = (id, correct) => setProgress((c) => ({ ...c, examAnswers: { ...c.examAnswers, [id]: correct } }));
  const resetProgress = () => setProgress(defaultProgress);
  return { progress, completeLesson, completeChallenge, saveQuiz, saveNote, recordExam, resetProgress };
}

function nextLessonFor(progress) {
  return availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) || availableLessons[availableLessons.length - 1];
}
function lessonPosition(lesson) {
  return availableLessons.findIndex((item) => item.id === lesson.id) + 1;
}

/* ---------- shared ---------- */
function Wordmark({ navigate }) {
  return (
    <button type="button" className="top-brand" onClick={() => navigate('/')}>
      <span className="wm-square" aria-hidden="true" /> LearnPlainScript<span className="dot">.</span>
    </button>
  );
}

function NavLink({ active, onClick, children, icon: Icon, badge }) {
  return (
    <button type="button" className={`nav-link${active ? ' active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {Icon && <Icon size={16} strokeWidth={1.7} aria-hidden="true" />}
      <span>{children}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

function Rail({ path, navigate, progress, onClose, open }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  const rooms = [
    { to: '/', label: 'Start here', icon: LayoutDashboard },
    { to: '/learn', label: 'All lessons', icon: BookOpen, badge: `${done}/${availableLessons.length}` },
    { to: '/whiteboard', label: 'Whiteboard', icon: GraduationCap },
    { to: '/playground', label: 'Code playground', icon: Terminal },
    { to: '/quiz', label: 'Practice test', icon: ClipboardList },
  ];
  return (
    <aside className={`rail${open ? ' is-open' : ''}`} id="rail" aria-label="Site navigation">
      <div className="rail-head">
        <span className="rail-issue">PlainScript 2.3.1 · beginner classroom</span>
        <Wordmark navigate={navigate} />
        <p className="rail-sub">Short lessons. Real code.<br />No account needed.</p>
        <button type="button" className="rail-close" onClick={onClose} aria-label="Close menu"><X size={22} aria-hidden="true" /></button>
      </div>
      <nav className="rail-nav" aria-label="Main navigation">
        <div className="nav-group">
          {rooms.map((item) => (
            <NavLink
              key={item.to}
              active={path === item.to || (item.to === '/learn' && path.startsWith('/learn/'))}
              onClick={() => navigate(item.to)}
              icon={item.icon}
              badge={item.badge}
            >{item.label}</NavLink>
          ))}
        </div>
        <div className="rail-next">
          <span className="rail-next__label">{done === 0 ? 'Start with' : 'Up next'}</span>
          <b>{next.title}</b>
          <span className="rail-next__meta">Lesson {lessonPosition(next)} · {next.duration}</span>
          <div className="rail-progress__track"><i style={{ width: `${percent}%` }} /></div>
          <small>{done} of {availableLessons.length} lessons finished</small>
          <button type="button" className="btn-solid small" onClick={() => navigate(`/learn/${next.id}`)}>
            {done === 0 ? 'Open lesson 1' : 'Continue'} <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </nav>
      <div className="rail-foot">
        <NavLink active={path === '/progress'} onClick={() => navigate('/progress')} icon={TrendingUp}>My progress</NavLink>
        <NavLink active={path === '/projects'} onClick={() => navigate('/projects')} icon={BookOpen}>Mini projects</NavLink>
        <div className="rail-links">
          <a href="https://plainscript.vercel.app/" target="_blank" rel="noreferrer">Docs ↗</a>
          <span className="sep">/</span>
          <a href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source ↗</a>
        </div>
        <p>Independent companion. PlainScript 2.3.1 · MIT.</p>
      </div>
    </aside>
  );
}

function MobileTabs({ path, navigate }) {
  const tabs = [
    { to: '/', label: 'Start', icon: LayoutDashboard },
    { to: '/learn', label: 'Lessons', icon: BookOpen },
    { to: '/whiteboard', label: 'Board', icon: GraduationCap },
    { to: '/playground', label: 'Code', icon: Terminal },
  ];
  return (
    <nav className="mobile-tabs" aria-label="Quick navigation">
      {tabs.map((tab) => {
        const active = path === tab.to || (tab.to === '/learn' && path.startsWith('/learn/'));
        return (
          <button key={tab.to} type="button" className={active ? 'on' : ''} onClick={() => navigate(tab.to)} aria-current={active ? 'page' : undefined}>
            <tab.icon size={20} strokeWidth={1.7} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Shell({ path, navigate, progress, railOpen, setRailOpen, crumb, children }) {
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
  const go = useCallback((to) => { setRailOpen(false); navigate(to); }, [navigate, setRailOpen]);
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <button type="button" className={`scrim${railOpen ? ' on' : ''}`} onClick={() => setRailOpen(false)} aria-label="Close menu" tabIndex={railOpen ? 0 : -1} />
      <Rail path={path} navigate={go} progress={progress} onClose={() => setRailOpen(false)} open={railOpen} />
      <div className="main">
        <header className="top">
          <button type="button" className="nav-toggle" onClick={() => setRailOpen(true)} aria-expanded={railOpen} aria-controls="rail">
            <Menu size={17} strokeWidth={1.8} aria-hidden="true" /> <span>Menu</span>
          </button>
          <Wordmark navigate={go} />
          {crumb && <span className="crumb">{crumb}</span>}
          <div className="progress" aria-hidden="true"><span style={{ width: `${reading}%` }} /></div>
        </header>
        <main id="main" className="page">
          {children}
          <Colophon navigate={go} />
        </main>
      </div>
      <MobileTabs path={path} navigate={go} />
    </div>
  );
}

function Colophon({ navigate }) {
  return (
    <footer className="end">
      <div className="end-grid">
        <div className="end-brand">
          <b>LearnPlainScript<span>.</span></b>
          <p>A free classroom for PlainScript 2.3.1. Written for people starting from zero.</p>
        </div>
        <nav className="end-links" aria-label="Site links">
          <button type="button" onClick={() => navigate('/learn')}>All lessons</button>
          <button type="button" onClick={() => navigate('/whiteboard')}>Whiteboard</button>
          <button type="button" onClick={() => navigate('/playground')}>Code playground</button>
          <button type="button" onClick={() => navigate('/quiz')}>Practice test</button>
          <button type="button" onClick={() => navigate('/projects')}>Mini projects</button>
        </nav>
        <div className="end-fine">
          <span>Progress saves in this browser only.</span>
          <span>No accounts, no trackers, no ads.</span>
          <a href="https://plainscript.vercel.app/" target="_blank" rel="noreferrer">Official PlainScript docs ↗</a>
        </div>
      </div>
    </footer>
  );
}

/* ---------- shared learning path ---------- */
function LessonPath({ progress, navigate, compact = false }) {
  const done = progress.completedLessons;
  const next = nextLessonFor(progress);
  const nextIndex = availableLessons.indexOf(next);
  const start = compact ? Math.max(0, nextIndex - 1) : 0;
  const list = compact ? availableLessons.slice(start, start + 5) : availableLessons;
  return (
    <div className="path-wrap">
      <ol className="path" start={start + 1}>
        {list.map((lesson) => {
          const isDone = done.includes(lesson.id);
          const isNext = lesson.id === next.id;
          return (
            <li key={lesson.id} className={`path-row${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}>
              <button type="button" className="path-link" onClick={() => navigate(`/learn/${lesson.id}`)}>
                <span className="path-num" aria-hidden="true">{isDone ? <Check size={14} strokeWidth={2.6} /> : String(lessonPosition(lesson)).padStart(2, '0')}</span>
                <span className="path-copy">
                  <b>{lesson.title}</b>
                  <span>Chapter {lesson.chapterNumber} · {lesson.duration}</span>
                </span>
                <span className={`path-state${isNext ? ' is-next' : ''}`}>{isDone ? 'done' : isNext ? 'next' : ''}</span>
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" className="path-arrow" />
              </button>
            </li>
          );
        })}
      </ol>
      {compact && (
        <button type="button" className="btn-line path-more" onClick={() => navigate('/learn')}>
          See all {availableLessons.length} lessons <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ---------- homepage ---------- */
function Classroom({ navigate, progress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  const nextPosition = lessonPosition(next);
  const started = done > 0;
  const allDone = done === availableLessons.length;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">PlainScript · a classroom for beginners</p>
          <h1>Learn to code,<br /><em>one small step at a time.</em></h1>
          <p className="hero-lede">
            PlainScript reads almost like English. You will write a real program in your first five minutes,
            run it, and see the answer on screen. Nothing to install, no account, nothing you can break.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-solid big" onClick={() => navigate(`/learn/${next.id}`)}>
              {allDone ? 'Review the last lesson' : started ? `Continue lesson ${nextPosition}` : 'Start lesson 1'} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="btn-line" onClick={() => navigate('/learn')}>Browse all lessons</button>
          </div>
          <ul className="hero-facts">
            <li><b>{availableLessons.length}</b> short lessons</li>
            <li><b>8 min</b> per lesson</li>
            <li><b>Saved</b> in your browser</li>
          </ul>
        </div>
        <figure className="hero-art">
          <img src={ART.hero} alt="A teenage student at a desk with a laptop, notebook and a chalkboard behind them." width="800" height="600" />
          <figcaption>Lesson {nextPosition} is open on the desk.</figcaption>
        </figure>
      </section>

      <section className="resume-strip" aria-label="Your progress">
        <div className="resume-copy">
          <span className="resume-label">{allDone ? 'Course finished — well done' : started ? 'Pick up where you left off' : 'Your first lesson'}</span>
          <b>{next.title}</b>
          <span className="resume-meta">Lesson {nextPosition} of {availableLessons.length} · {next.duration}</span>
        </div>
        <div className="resume-track">
          <div className="resume-track__bar"><i style={{ width: `${percent}%` }} /></div>
          <small>{done} finished · {percent}%</small>
        </div>
        <button type="button" className="btn-solid small" onClick={() => navigate(`/learn/${next.id}`)}>
          {allDone ? 'Review' : started ? 'Keep going' : 'Begin'} <ArrowRight size={14} aria-hidden="true" />
        </button>
      </section>

      <section className="how">
        <div className="section-head">
          <h2>How a lesson works</h2>
          <p>Every lesson has the same three steps. You always know what to do next.</p>
        </div>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <h3>Read a little</h3>
            <p>One idea, explained in plain words, with a short example you can read line by line.</p>
          </li>
          <li>
            <span className="step-num">2</span>
            <h3>Run the code</h3>
            <p>Change the example and press Run. The real compiler tells you what your program does.</p>
          </li>
          <li>
            <span className="step-num">3</span>
            <h3>Answer one question</h3>
            <p>A single check at the end. If you miss it, you get the explanation and can try again.</p>
          </li>
        </ol>
      </section>

      <section className="try-now">
        <div className="section-head">
          <h2>Try it right now</h2>
          <p>This is a real program. Change the words inside the quotes, then press Run.</p>
        </div>
        <HomeLab />
      </section>

      <section className="path-section">
        <div className="section-head">
          <h2>{started ? 'Your place in the course' : 'The course, in order'}</h2>
          <p>Lessons build on each other. Go down the list one at a time — you can always come back.</p>
        </div>
        <LessonPath progress={progress} navigate={navigate} compact />
      </section>

      <section className="help-strip">
        <div>
          <h2>Stuck? That is normal.</h2>
          <p>
            Every lesson has a <b>Hint</b> button and a <b>Reset</b> button. Nothing you type here can break the site.
            If a message confuses you, read it out loud — most PlainScript errors say exactly which line to look at.
          </p>
        </div>
        <button type="button" className="btn-line" onClick={() => navigate('/learn/why-plainscript')}>
          Read the first lesson <ArrowRight size={14} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function HomeLab() {
  const [code, setCode] = useState(homepageSpecimen);
  const { result, run } = useRunner();
  return (
    <div className="home-lab">
      <div className="home-lab__head">
        <span className="hl-label">hello.pln</span>
        <span className="hl-hint">Tip: keep the quotation marks, change the words inside them.</span>
      </div>
      <Editor code={code} onChange={setCode} label="hello.pln" minHeight="220px" onRun={() => run(code)} />
      <div className="home-lab__actions">
        <button type="button" className="btn-solid small" onClick={() => run(code)} disabled={result.status === 'running'}>
          <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run my program'}
        </button>
        <button type="button" className="icon-btn" onClick={() => setCode(homepageSpecimen)} aria-label="Reset the example">
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <span className="tryit-shortcut">⌘/Ctrl + Enter</span>
      </div>
      <Output result={result} compact />
    </div>
  );
}

/* ---------- all lessons ---------- */
function Curriculum({ navigate, progress, resetProgress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLessonFor(progress);
  return (
    <div className="contents">
      <p className="kicker">Lesson list</p>
      <h1 className="page-title">All {availableLessons.length} lessons.</h1>
      <p className="page-lede">
        Start at lesson 1 and work downwards. Each lesson takes about eight minutes: read, run, answer one question.
        Finished lessons get a tick.
      </p>
      <div className="path-summary">
        <div className="path-summary__bar"><i style={{ width: `${percent}%` }} /></div>
        <span><b>{done}</b> of {availableLessons.length} finished</span>
        <button type="button" className="btn-solid small" onClick={() => navigate(`/learn/${next.id}`)}>
          {done === 0 ? 'Start lesson 1' : 'Continue'} <ArrowRight size={14} aria-hidden="true" />
        </button>
        {done > 0 && <button type="button" className="link-quiet" onClick={resetProgress}>Reset progress</button>}
      </div>
      <LessonPath progress={progress} navigate={navigate} />
      <p className="contents-note">
        Every example is checked against <code>plainscript-lang@2.3.1</code>. Topics such as files, databases and HTTP
        are explained as boundaries of the runtime, not invented as portable syntax.
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
      <div className="panel-label"><span>01</span> Your turn</div>
      <div className="panel-head"><h3>{done ? 'The compiler agrees.' : 'Change the code yourself.'}</h3><span className="panel-chip">2.3.1</span></div>
      <p className="panel-prompt"><Inline text={challenge?.prompt || ''} /></p>
      <Editor code={code} onChange={setCode} label={`${lesson.id}.pln`} onRun={execute} diagnostics={result.status === 'error' ? result.error : ''} />
      <div className="practice-controls">
        <button type="button" className="btn-solid small" onClick={execute} disabled={!runnable || result.status === 'running'}>
          <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run'}
        </button>
        <button type="button" className="icon-btn" onClick={() => { setCode(challenge?.starter || lesson.example); reset(); }} aria-label="Reset the code">
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button type="button" className="link-quiet" onClick={() => setHint((v) => !v)}>{hint ? 'Hide hint' : 'Show hint'}</button>
      </div>
      {!runnable && <p className="practice-note">This example needs a whole project around it, so it is read rather than run here.</p>}
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
      <div className="panel-label"><span>02</span> Quick check</div>
      <div className="panel-head"><h3>{quiz.question}</h3></div>
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
          {selected !== quiz.answer && <button type="button" className="link-quiet" onClick={() => setSelected(null)}>Try again</button>}
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
  const art = artForLesson(index);
  useEffect(() => { window.scrollTo(0, 0); }, [lesson.id]);
  return (
    <article className="lesson">
      <div className="lesson-topbar">
        <button type="button" className="link-quiet back-link" onClick={() => navigate('/learn')}>
          <ArrowLeft size={14} aria-hidden="true" /> All lessons
        </button>
        <span className="lesson-count">Lesson {index + 1} of {availableLessons.length}</span>
        <div className="mini-track" aria-hidden="true"><i style={{ width: `${((index + (isComplete ? 1 : 0)) / availableLessons.length) * 100}%` }} /></div>
      </div>

      <header className="lesson-head">
        <div className="lesson-head__type">
          <span className="lesson-tag">Chapter {lesson.chapterNumber} · {lesson.chapter}</span>
          <h1>{lesson.title}</h1>
          <p className="lesson-standfirst"><Inline text={lesson.intro} /></p>
          <div className="lesson-meta">
            <span>{lesson.duration}</span>
            <span>PlainScript 2.3.1</span>
            <span className={isComplete ? 'is-read' : ''}>{isComplete ? 'Finished' : 'Not finished yet'}</span>
          </div>
        </div>
        <figure className="lesson-art">
          <img src={art.src} alt={art.alt} width="800" height="600" loading="lazy" />
        </figure>
      </header>

      <div className="lesson-body prose">
        {plainWords[lesson.id] && (
          <aside className="plain-words" aria-label="In plain words">
            <span className="plain-words__label">In plain words</span>
            <p><Inline text={plainWords[lesson.id]} /></p>
          </aside>
        )}

        <section className="lesson-sec">
          <h2><span className="sec-num">1</span>What you will learn</h2>
          <ul className="objectives">{lesson.objectives.map((o) => <li key={o}><Inline text={o} /></li>)}</ul>
        </section>

        <section className="lesson-sec">
          <h2><span className="sec-num">2</span>The idea</h2>
          <p><Inline text={lesson.explanation} /></p>
        </section>

        <section className="lesson-sec">
          <h2><span className="sec-num">3</span>Guess what it prints</h2>
          <p>Before you run it, write down what you think the program will print. Guessing first is how the idea sticks.</p>
          <PredictRun lesson={lesson} />
        </section>

        <section className="lesson-sec">
          <h2><span className="sec-num">4</span>Try it yourself</h2>
          <p>Now change the example. Run it as many times as you like — the compiler is the honest one here.</p>
          {lesson.expectedOutput
            ? <TryIt lesson={lesson} />
            : <><CodeSpecimen code={lesson.example} file={`${lesson.id}.pln`} /><p className="tryit-static-note">This example needs a React project around it, so it is read rather than run in the browser.</p></>}
        </section>

        <section className="lesson-sec">
          <h2><span className="sec-num">5</span>The words, close up</h2>
          <div className="syntax-table">
            {lesson.syntax.map(([term, description]) => (
              <div className="syntax-row" key={term}>
                <code className="syntax-term"><Tokens code={term.replace(/`/g, '')} /></code>
                <span><Inline text={description} /></span>
              </div>
            ))}
          </div>
        </section>

        <section className="lesson-sec">
          <h2><span className="sec-num">6</span>Common mistakes</h2>
          <ul className="mistakes">{lesson.commonMistakes.map((m) => <li key={m}><Inline text={m} /></li>)}</ul>
          <div className="exercise">
            <span className="exercise-label">Exercise</span>
            <p><Inline text={lesson.exercise} /></p>
          </div>
        </section>
      </div>

      <section className="bench">
        <div className="bench-head">
          <div className="section-kicker">Practice</div>
          <div className="bench-head__copy">
            <h2>Your turn at the desk.</h2>
            <p>One small program to change and one question to answer. Your work stays in this browser.</p>
          </div>
        </div>
        <div className="bench-grid">
          <LessonPractice lesson={lesson} progress={progress} completeChallenge={completeChallenge} />
          <LessonQuiz lesson={lesson} savedScore={progress.quizScores[lesson.id]} saveQuiz={saveQuiz} />
        </div>
      </section>

      <div className={`signoff${isComplete ? ' is-read' : ''}`}>
        <span className="signoff-mark">{isComplete ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : '○'}</span>
        <div className="signoff-copy">
          <b>{isComplete ? 'Lesson finished' : 'Finished reading?'}</b>
          <small>{isComplete ? 'Saved in this browser. You can always read it again.' : 'Mark the lesson when the idea feels clear. You can undo it by resetting progress.'}</small>
        </div>
        {!isComplete
          ? <button type="button" className="btn-solid small" onClick={() => completeLesson(lesson.id)}>Mark as finished</button>
          : <span className="signoff-note">{String(index + 1).padStart(2, '0')} / {String(availableLessons.length).padStart(2, '0')}</span>}
      </div>

      <nav className="turn" aria-label="Lesson navigation">
        {previous
          ? <button type="button" className="turn-prev" onClick={() => navigate(`/learn/${previous.id}`)}><span>← Previous</span><b>{previous.title}</b></button>
          : <span className="turn-prev turn-empty" aria-hidden="true" />}
        <button type="button" className="turn-next" onClick={() => navigate(next ? `/learn/${next.id}` : '/learn')}>
          <span>{next ? 'Next lesson' : 'You finished the course'}</span>
          <b>{next ? next.title : 'Back to all lessons'}</b><i aria-hidden="true">→</i>
        </button>
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
      <p className="kicker">Open editor</p>
      <h1 className="page-title">The code playground.</h1>
      <p className="page-lede">
        A full editor for when you want to try your own program. Pick an example on the left, change it, and press Run.
        Nothing here is saved, so experiment freely.
      </p>
      <div className="lab-layout">
        <aside className="specimen-index" aria-label="Example programs">
          <span className="si-label">Example programs</span>
          {playgroundExamples.map((item) => (
            <button key={item.id} type="button" aria-pressed={exampleId === item.id} className={exampleId === item.id ? 'on' : ''} onClick={() => choose(item)}>
              <span>{String(playgroundExamples.indexOf(item) + 1).padStart(2, '0')}</span>{item.label}
            </button>
          ))}
          <p className="si-note">Every example is checked against the compiler.</p>
        </aside>
        <div className="lab-main">
          <div className="lab-toolbar">
            <span className="lab-toolbar__title">{example.label}</span>
            <span className="lab-toolbar__note">{example.note}</span>
          </div>
          <div className="lab-editor-row">
            <div className="lab-editor-col">
              <Editor code={code} onChange={setCode} label={`${example.id}.pln`} minHeight="420px" onRun={() => run(code)} />
              <div className="lab-controls">
                <button type="button" className="btn-solid" onClick={() => run(code)} disabled={result.status === 'running'}>
                  <Play size={14} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run program'}
                </button>
                <button type="button" className="icon-btn" onClick={() => { setCode(example.code); reset(); }} aria-label="Reset to the example">
                  <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <span className="lab-shortcut">⌘/Ctrl + Enter</span>
              </div>
            </div>
            <div className="lab-console-col">
              <div className="console-head"><span>Output</span><span className={`run-state is-${result.status}`}>{result.status === 'idle' ? 'ready' : result.status}</span></div>
              <Output result={result} />
              <div className="lab-notes">
                <p>Programs stop after 3.5 seconds. Output is capped at 64 KB.</p>
                <p>File, network and process access are removed before the program runs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lab-footnote">
        <p>Need an explanation first? The <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>lessons</button> teach each idea, and the <button type="button" className="link-quiet" onClick={() => navigate('/quiz')}>practice test</button> checks what stuck.</p>
      </div>
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
    if (correct) setScore((v) => v + 1);
    recordExam(current.lesson.id, correct);
  };
  const advance = () => { if (index + 1 >= questions.length) { setFinished(true); return; } setIndex((v) => v + 1); setSelected(null); };
  const restart = () => { setIndex(0); setSelected(null); setScore(0); setFinished(false); };

  if (finished) {
    const total = questions.length;
    return (
      <div className="examination result">
        <p className="kicker">Practice test · result</p>
        <h1 className="page-title">You scored<br /><em>{score} of {total}</em>.</h1>
        <p className="exam-lede">
          {score === total
            ? 'Every question correct. The code playground is the better test now — try building something small.'
            : 'A score is a map, not a verdict. The lessons behind the questions you missed are still open, and you can take this again whenever you like.'}
        </p>
        <div className="result-meter"><i style={{ width: `${Math.round((score / total) * 100)}%` }} /></div>
        <div className="result-actions">
          <button type="button" className="btn-solid" onClick={restart}>Take it again</button>
          <button type="button" className="btn-line" onClick={() => navigate('/learn')}>Back to lessons</button>
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
    <div className="examination">
      <p className="kicker">Practice test</p>
      <h1 className="page-title">One question from<br /><em>every lesson.</em></h1>
      <p className="exam-lede">
        {questions.length} questions. There is no timer and no score kept against you — each answer explains itself.
        Not ready? Start with lesson 1 first.
      </p>
      <div className="exam-bar">
        <div className="exam-bar__track"><i style={{ width: `${percent}%` }} /></div>
        <span>Question {index + 1} of {questions.length}</span>
        <span>{score} correct</span>
      </div>
      <article className="exam-card">
        <div className="exam-source">
          <span>Chapter {current.lesson.chapterNumber}</span>
          <span>{current.lesson.chapter}</span>
          <button type="button" className="link-quiet" onClick={() => navigate(`/learn/${current.lesson.id}`)}>Read this lesson ↗</button>
        </div>
        <h2>{current.quiz.question}</h2>
        <div className="quiz-options exam-options" role="group" aria-label="Answer options">
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
            <button type="button" className="btn-solid small" onClick={advance}>
              {index + 1 >= questions.length ? 'See my result' : 'Next question'} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </article>
      <div className="exam-dots" aria-hidden="true">{questions.map((q, di) => <span key={q.lesson.id} className={di < index ? 'past' : di === index ? 'now' : ''} />)}</div>
    </div>
  );
}

/* ---------- projects ---------- */
function Projects({ navigate }) {
  return (
    <div className="projects">
      <p className="kicker">Mini projects</p>
      <h1 className="page-title">Build something<br /><em>of your own.</em></h1>
      <p className="page-lede">
        Lessons teach one word at a time. A project asks you to use a few of them together.
        None of these has one correct answer — each has a clear test you can apply yourself.
      </p>
      <div className="projects-list">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-number">{project.number}</div>
            <div className="project-main">
              <div className="project-meta"><span>{project.level}</span><i>·</i><span>{project.concepts.join(' / ')}</span></div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="project-columns">
                <div><b>What it needs</b><ul>{project.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><b>How to start</b><p>{project.starting}</p></div>
                <div><b>Finished when</b><p>{project.criteria}</p></div>
              </div>
              <div className="project-actions">
                <button type="button" className="link-quiet" onClick={() => navigate('/playground')}>Open the playground →</button>
                <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>Find the lessons →</button>
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
      <p className="kicker">My progress</p>
      <h1 className="page-title">You have finished<br /><em>{done} of {availableLessons.length}</em> lessons.</h1>
      <div className="result-meter"><i style={{ width: `${percent}%` }} /></div>
      <p className="page-lede">Progress is saved in this browser only. Clearing your browser data will reset it.</p>
      <div className="progress-grid">
        <div className="stat-card"><span className="sc-label">Lessons finished</span><div className="sc-value">{done}</div><div className="sc-sub">of {availableLessons.length}</div></div>
        <div className="stat-card"><span className="sc-label">Coding challenges</span><div className="sc-value">{checksPassed}</div><div className="sc-sub">of {availableLessons.length}</div></div>
        <div className="stat-card"><span className="sc-label">Practice test</span><div className="sc-value">{examCorrect}</div><div className="sc-sub">of {examDone} answered</div></div>
      </div>
      <div className="path-summary">
        <span>Up next: <b>{next.title}</b></span>
        <button type="button" className="btn-solid small" onClick={() => navigate(`/learn/${next.id}`)}>Continue <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      <LessonPath progress={progress} navigate={navigate} />
      {done > 0 && (
        <div className="danger-zone">
          <button type="button" className="link-quiet" onClick={resetProgress}>Reset all progress</button>
        </div>
      )}
    </div>
  );
}

/* ---------- not found ---------- */
function NotFound({ navigate }) {
  return (
    <div className="not-found">
      <p className="kicker">Page not found</p>
      <h1 className="page-title">This page<br /><em>does not exist.</em></h1>
      <p className="not-found__lede">The link may be old. The lesson list is the reliable place to start.</p>
      <div className="not-found-actions">
        <button type="button" className="btn-solid" onClick={() => navigate('/learn')}>See all lessons</button>
        <button type="button" className="btn-line" onClick={() => navigate('/')}>Go to the start</button>
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
  useEffect(() => {
    const onPop = () => setPath(routePath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((to) => {
    if (to === path) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, [path]);

  let view;
  let crumb = 'Classroom';
  let title = 'LearnPlainScript · Learn to code, one step at a time';

  if (path === '/') {
    view = <Classroom navigate={navigate} progress={progressState.progress} />;
    crumb = 'Start here';
  } else if (path === '/learn') {
    view = <Curriculum navigate={navigate} progress={progressState.progress} resetProgress={progressState.resetProgress} />;
    crumb = 'All lessons';
    title = 'All lessons · LearnPlainScript';
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
      crumb = null;
      title = `${lesson.title} · LearnPlainScript`;
    } else {
      view = <NotFound navigate={navigate} />; crumb = 'Not found'; title = 'Not found · LearnPlainScript';
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
    crumb = 'Whiteboard'; title = 'Whiteboard · LearnPlainScript';
  } else if (path === '/playground') {
    view = <Playground navigate={navigate} />; crumb = 'Code playground'; title = 'Code playground · LearnPlainScript';
  } else if (path === '/quiz') {
    view = <Examination progress={progressState.progress} recordExam={progressState.recordExam} navigate={navigate} />;
    crumb = 'Practice test'; title = 'Practice test · LearnPlainScript';
  } else if (path === '/projects') {
    view = <Projects navigate={navigate} />; crumb = 'Mini projects'; title = 'Mini projects · LearnPlainScript';
  } else if (path === '/progress') {
    view = <Progress progress={progressState.progress} navigate={navigate} resetProgress={progressState.resetProgress} />;
    crumb = 'My progress'; title = 'My progress · LearnPlainScript';
  } else {
    view = <NotFound navigate={navigate} />; crumb = 'Not found'; title = 'Not found · LearnPlainScript';
  }

  useEffect(() => { document.title = title; }, [title]);
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [path]);
  return (
    <Shell path={path} navigate={navigate} progress={progressState.progress} railOpen={railOpen} setRailOpen={setRailOpen} crumb={crumb}>
      {view}
    </Shell>
  );
}
createRoot(document.getElementById('root')).render(<App />);
