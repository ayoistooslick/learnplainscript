import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, Menu, Play, RotateCcw, X } from 'lucide-react';
import { availableLessons, chapters, flashcards, projects } from './content.js';
import { homepageSpecimen, playgroundExamples } from './examples.js';
import { CodeSpecimen, Inline, Tokens } from './highlight.jsx';
import './styles.css';

const STORAGE_KEY = 'learnplainscript.progress.v1';
const defaultProgress = {
  completedLessons: [],
  completedChallenges: [],
  quizScores: {},
  examAnswers: {},
  lastLesson: 'why-plainscript',
  flashcardIndex: 0,
  reviewedCards: [],
};

const PLATES = {
  portrait: {
    src: '/plates/plate-portrait.jpg',
    title: 'Second sight',
    medium: 'riso / halftone',
    alt: 'Halftone portrait with violet and ember riso windows printed across the eyes',
  },
  eye: {
    src: '/plates/plate-eye.jpg',
    title: 'Close reading',
    medium: 'duotone / grain',
    alt: 'Halftone eye printed in ember and violet on warm paper',
  },
  figure: {
    src: '/plates/plate-figure.jpg',
    title: 'Turned away',
    medium: 'photocopy / halftone',
    alt: 'Halftone figure turned away against black',
  },
  chrome: {
    src: '/plates/plate-chrome.jpg',
    title: 'Machine surface',
    medium: 'render / halftone',
    alt: 'Chrome knot with violet rim light on black',
  },
  hands: {
    src: '/plates/plate-hands.jpg',
    title: 'Hand to hand',
    medium: 'screenprint / halftone',
    alt: 'Two halftone hands reaching toward each other with violet and ember ink',
  },
  voice: {
    src: '/plates/plate-voice.jpg',
    title: 'Speaking plainly',
    medium: 'riso / duotone',
    alt: 'Halftone mouth with a violet and ember riso plate across the lips',
  },
  sheet: {
    src: '/plates/plate-sheet.jpg',
    title: 'The sheet',
    medium: 'screenprint / halftone',
    alt: 'Two halftone hands folding a printed sheet over violet and ember ink plates',
  },
  type: {
    src: '/plates/plate-type.jpg',
    title: 'Sort P',
    medium: 'letterpress / halftone',
    alt: 'A violet letterpress P inked on a dark metal block with ember powder',
  },
};

const CHAPTER_PLATES = [
  'portrait', 'sheet', 'voice', 'type', 'chrome', 'hands', 'eye', 'figure',
  'type', 'sheet', 'chrome', 'voice', 'hands', 'eye', 'figure', 'portrait',
  'sheet', 'hands', 'chrome', 'voice',
];
const CROPS = ['50% 32%', '50% 45%', '40% 50%', '58% 38%', '50% 55%'];

function plateForChapter(number) {
  return CHAPTER_PLATES[(Number(number) - 1) % CHAPTER_PLATES.length] || 'figure';
}

/* ---------- progress ---------- */

function loadProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...defaultProgress, ...saved } : defaultProgress;
  } catch {
    return defaultProgress;
  }
}

function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* A blocked storage quota should never stop a lesson. */
    }
  }, [progress]);

  const completeLesson = (id) => setProgress((current) => ({
    ...current,
    completedLessons: current.completedLessons.includes(id) ? current.completedLessons : [...current.completedLessons, id],
    lastLesson: id,
  }));
  const completeChallenge = (id) => setProgress((current) => ({
    ...current,
    completedChallenges: current.completedChallenges.includes(id) ? current.completedChallenges : [...current.completedChallenges, id],
  }));
  const saveQuiz = (id, score) => setProgress((current) => ({
    ...current,
    quizScores: { ...current.quizScores, [id]: score },
    lastLesson: id,
  }));
  const recordExam = (id, correct) => setProgress((current) => ({
    ...current,
    examAnswers: { ...current.examAnswers, [id]: correct },
  }));
  const markReviewed = (id) => setProgress((current) => ({
    ...current,
    reviewedCards: current.reviewedCards.includes(id) ? current.reviewedCards : [...current.reviewedCards, id],
  }));
  const setCardIndex = (index) => setProgress((current) => ({ ...current, flashcardIndex: index }));
  const resetProgress = () => setProgress(defaultProgress);

  return { progress, completeLesson, completeChallenge, saveQuiz, recordExam, markReviewed, setCardIndex, resetProgress };
}

/* ---------- shell pieces ---------- */

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShown(true);
        observer.disconnect();
      }
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

function Wordmark({ navigate, top = false }) {
  return (
    <button type="button" className={top ? 'top-brand' : 'wordmark'} onClick={() => navigate('/')}>
      LearnPlainScript<span className="dot">.</span>
    </button>
  );
}

function NavLink({ active, onClick, children, prefix }) {
  return (
    <button type="button" className={`nav-link${active ? ' active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {prefix && <span className="nx">{prefix}</span>}
      <span>{children}</span>
    </button>
  );
}

function Rail({ path, navigate, progress, onClose, open }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  return (
    <aside className={`rail${open ? ' is-open' : ''}`} id="rail" aria-label="Course contents">
      <div className="rail-head">
        <Wordmark navigate={navigate} />
        <div className="rail-meta">
          Interactive course<br />Vol. 2.3.1 · MMXXVI
        </div>
        <button type="button" className="rail-close" onClick={onClose} aria-label="Close contents">
          <X size={18} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>

      <nav className="rail-nav" aria-label="Learning contents">
        <div className="nav-group">
          <div className="nav-label">Start here</div>
          <NavLink active={path === '/'} onClick={() => navigate('/')}>Cover</NavLink>
          <NavLink active={path === '/learn'} onClick={() => navigate('/learn')}>Contents</NavLink>
          <NavLink active={path === '/playground'} onClick={() => navigate('/playground')}>Playground</NavLink>
          <NavLink active={path === '/quiz'} onClick={() => navigate('/quiz')}>Examination</NavLink>
        </div>

        <div className="nav-group">
          <div className="nav-label">Curriculum</div>
          {availableLessons.map((lesson) => (
            <NavLink
              key={lesson.id}
              prefix={lesson.chapterNumber}
              active={path === `/learn/${lesson.id}`}
              onClick={() => navigate(`/learn/${lesson.id}`)}
            >
              {lesson.title}
            </NavLink>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-label">Reference</div>
          <NavLink active={path === '/flashcards'} onClick={() => navigate('/flashcards')}>Revision cards</NavLink>
          <NavLink active={path === '/projects'} onClick={() => navigate('/projects')}>Commissions</NavLink>
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
          <a href="https://ayoistooslick.github.io/plainscript/" target="_blank" rel="noreferrer">Manual ↗</a>
        </div>
        <p>PlainScript 2.3.1 · MIT<br />An independent companion.</p>
      </div>
    </aside>
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

  useEffect(() => {
    document.body.classList.toggle('nav-open', railOpen);
    return () => document.body.classList.remove('nav-open');
  }, [railOpen]);

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
      <Rail path={path} navigate={go} progress={progress} open={railOpen} onClose={() => setRailOpen(false)} />

      <div className="main">
        <header className="top">
          <button type="button" className="nav-toggle" onClick={() => setRailOpen(true)} aria-expanded={railOpen} aria-controls="rail">
            <Menu size={16} strokeWidth={1.7} aria-hidden="true" /> <span>Contents</span>
          </button>
          <Wordmark navigate={go} top />
          <span className="crumb">
            {crumb ? <><b>{crumb[0]}</b><span className="slash">/</span>{crumb[1]}</> : <><b>LearnPlainScript</b><span className="slash">/</span>Manual</>}
          </span>
          <span className="top-meta">2.3.1</span>
          <a className="top-github" href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source ↗</a>
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
    <footer className="colophon">
      <div>
        <div className="colophon-mark">LearnPlainScript<span>.</span></div>
        <p>
          An independent, interactive companion to the PlainScript manual. Set in Fraunces, Newsreader,
          Space Grotesk and IBM Plex Mono. Halftone plates are drawn in-house for PlainScript, with new
          plates made for this course. One stylesheet, no trackers.
        </p>
      </div>
      <nav className="colophon-links" aria-label="Project links">
        <button type="button" onClick={() => navigate('/learn')}>Contents</button>
        <a href="https://ayoistooslick.github.io/plainscript/" target="_blank" rel="noreferrer">Manual</a>
        <a href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source</a>
        <a href="https://github.com/ayoistooslick/plainscript/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a>
        <button type="button" onClick={() => navigate('/projects')}>Commissions</button>
      </nav>
    </footer>
  );
}

/* ---------- artwork ---------- */

function Plate({ plateKey, fig, className = '', crop, eager = false }) {
  const plate = PLATES[plateKey] || PLATES.figure;
  const ref = useRef(null);

  const tilt = (event) => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
    node.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
  };
  const settle = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--rx', '0deg');
  };

  return (
    <figure className={`art-plate ${className}`.trim()} ref={ref} onMouseMove={tilt} onMouseLeave={settle}>
      <div className="art-plate__frame">
        <img
          src={plate.src}
          alt={plate.alt}
          width="1024"
          height="1024"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={crop ? { objectPosition: crop } : undefined}
        />
      </div>
      <figcaption><b>Fig. {fig}</b><span>{plate.title}</span><b>{plate.medium}</b></figcaption>
    </figure>
  );
}

/* ---------- compiler ---------- */

function useRunner() {
  const [result, setResult] = useState({ status: 'idle', output: '', error: '', duration: 0 });

  const run = useCallback(async (source) => {
    setResult({ status: 'running', output: '', error: '', duration: 0 });
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const payload = await response.json();
      if (payload.ok) {
        setResult({ status: 'ok', output: payload.output || '', error: payload.diagnostics || '', duration: payload.durationMs || 0 });
      } else {
        setResult({ status: 'error', output: payload.output || '', error: payload.error || 'The compiler rejected this program.', duration: payload.durationMs || 0 });
      }
      return payload;
    } catch {
      setResult({ status: 'error', output: '', error: 'The compiler service is not reachable. Start the server and try again.', duration: 0 });
      return null;
    }
  }, []);

  const reset = () => setResult({ status: 'idle', output: '', error: '', duration: 0 });
  return { result, run, reset };
}

function Editor({ code, onChange, label = 'main.pln', minHeight }) {
  const areaRef = useRef(null);
  const preRef = useRef(null);

  const sync = () => {
    if (!areaRef.current || !preRef.current) return;
    preRef.current.scrollTop = areaRef.current.scrollTop;
    preRef.current.scrollLeft = areaRef.current.scrollLeft;
  };

  const keyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const area = event.currentTarget;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    onChange(`${code.slice(0, start)}    ${code.slice(end)}`);
    window.requestAnimationFrame(() => {
      area.selectionStart = start + 4;
      area.selectionEnd = start + 4;
    });
  };

  return (
    <div className="editor" style={minHeight ? { '--editor-h': minHeight } : undefined}>
      <div className="editor-head">
        <span className="editor-file">{label}</span>
        <span className="editor-lang">plainscript · 2.3.1</span>
      </div>
      <div className="editor-body">
        <pre className="editor-highlight" ref={preRef} aria-hidden="true"><code><Tokens code={`${code}\n`} /></code></pre>
        <textarea
          ref={areaRef}
          value={code}
          onChange={(event) => onChange(event.target.value)}
          onScroll={sync}
          onKeyDown={keyDown}
          spellCheck="false"
          autoComplete="off"
          autoCapitalize="off"
          aria-label="PlainScript source editor"
        />
      </div>
    </div>
  );
}

function Output({ result, compact = false }) {
  const running = result.status === 'running';
  return (
    <div className={`output is-${result.status}`}>
      <div className="output-bar">
        <span>stdout</span>
        <span>{running ? 'compiling…' : result.status === 'ok' ? `exit 0 · ${result.duration}ms` : result.status === 'error' ? 'exit 1' : 'idle'}</span>
      </div>
      {result.status === 'idle' && <p className="output-empty">Run the program to read its output.</p>}
      {running && <p className="output-empty">Calling the published 2.3.1 compiler…</p>}
      {result.status === 'ok' && (
        <>
          {result.output ? <pre className="output-body">{result.output}</pre> : <p className="output-empty">The program finished without printing anything.</p>}
          {result.error && <pre className="output-diagnostics">{result.error}</pre>}
        </>
      )}
      {result.status === 'error' && <pre className="output-body output-error">{result.error}</pre>}
      {!compact && result.status !== 'idle' && (
        <div className="output-foot">executed in a short-lived child process · output bounded</div>
      )}
    </div>
  );
}

/* ---------- landing ---------- */

const CODE_TABS = [
  { id: 'src', label: 'hello.pln', lang: 'plainscript' },
  { id: 'out', label: 'hello.js', lang: 'javascript' },
  { id: 'cli', label: 'terminal', lang: 'sh' },
];

function CodeTabs() {
  const [active, setActive] = useState('src');
  const source = `#syntax 2.1

import { print } from "std/io"

define greet(name: text) returns text
    return "Hello, {name}."
end

print(greet("world"))`;
  const output = `import { print } from "./std/io.js";

function greet(name) {
  return \`Hello, \${name}.\`;
}

print(greet("world"));`;
  const terminal = `$ plainscript run hello.pln\nHello, world.`;

  return (
    <div className="code-tabs">
      <div className="tablist" role="tablist" aria-label="Language specimen">
        {CODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={active === tab.id ? 'on' : ''}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active === 'src' && <pre className="tabpanel"><code><Tokens code={source} /></code></pre>}
      {active === 'out' && <pre className="tabpanel"><code><Tokens code={output} /></code></pre>}
      {active === 'cli' && <pre className="tabpanel tabpanel-cli"><code>{terminal}</code></pre>}
    </div>
  );
}

function HomeLab() {
  const [code, setCode] = useState(homepageSpecimen);
  const { result, run } = useRunner();
  return (
    <section className="home-lab">
      <div className="home-lab__copy">
        <div className="section-mark"><span>Try it</span>A live compiler</div>
        <h2>Write a sentence.<br /><em>Run it.</em></h2>
        <p>
          This is not a simulation. Every Run calls the published PlainScript 2.3.1 compiler in a
          short-lived process, then returns the program’s real output or its real diagnostics.
        </p>
        <ul className="checklist compact">
          <li>Edit the greeting and run it again.</li>
          <li>Break the string and read the compiler’s answer.</li>
          <li>Open the playground when you want a full desk.</li>
        </ul>
        <div className="lab-actions">
          <button type="button" className="btn-primary" onClick={() => run(code)} disabled={result.status === 'running'}>
            <Play size={14} strokeWidth={2} aria-hidden="true" /> Run program
          </button>
          <span className="lab-hint">⌘/Ctrl + Enter also runs</span>
        </div>
      </div>
      <div
        className="home-lab__window"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); run(code); }
        }}
      >
        <Editor code={code} onChange={setCode} label="try-it.pln" minHeight="220px" />
        <Output result={result} compact />
      </div>
    </section>
  );
}

function Landing({ navigate, progress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const nextLesson = availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) || availableLessons[0];
  const latest = availableLessons.find((lesson) => lesson.id === progress.lastLesson);

  return (
    <div className="home">
      <div className="folio">
        <span>LearnPlainScript</span>
        <span>Vol. 2.3.1</span>
        <span>An interactive companion</span>
        <span>MMXXVI</span>
      </div>

      <section className="masthead">
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="display">Learn the language that reads like <em>plain writing</em>.</h1>
            <div className="hero-lede-row">
              <p className="lede">
                A practical course through PlainScript 2.3.1 — a statically typed language for the
                JavaScript platform. Read short, carefully set lessons. Run real programs. Keep a
                record of what you have understood.
              </p>
              <div className="masthead-actions">
                <button type="button" className="btn-primary" onClick={() => navigate('/learn')}>
                  Open the curriculum <span aria-hidden="true">→</span>
                </button>
                <button type="button" className="btn-ghost" onClick={() => navigate('/playground')}>
                  Try the compiler
                </button>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <Plate plateKey="portrait" fig="01" eager crop="50% 30%" />
            <div className="hero-art__index">
              <span>Plate 01 · Riso portrait</span>
              <span>MMXXVI</span>
            </div>
          </div>
        </div>

        <dl className="factbar">
          <div><dt>Version</dt><dd>2.3.1</dd></div>
          <div><dt>Chapters</dt><dd>Twenty</dd></div>
          <div><dt>Lessons</dt><dd>{availableLessons.length} supported</dd></div>
          <div><dt>Compiles to</dt><dd>ES modules</dd></div>
        </dl>
      </section>

      <Reveal>
        <section className="plate">
          <div className="plate-copy">
            <div className="section-mark"><span>The language</span>Readable at the source</div>
            <h2>Readable at the source. Ordinary at the output.</h2>
            <p>
              No new runtime and no virtual machine. PlainScript is a typed surface over the
              JavaScript platform: the compiler checks your program, then emits modules your existing
              tools already understand.
            </p>
            <ul className="checklist">
              <li>Statically checked before anything runs.</li>
              <li>Functions, records, optionals and async without ceremony.</li>
              <li>Classes, generators and typed errors in 2.3.</li>
              <li>Native JSX, native regex and cross-language bridges.</li>
              <li>Value re-exports and declared local runtimes, fixed in 2.3.1.</li>
            </ul>
          </div>
          <CodeTabs />
        </section>
      </Reveal>

      <Reveal><HomeLab /></Reveal>

      <Reveal>
        <section className="art-break">
          <div className="art-break__copy">
            <div className="section-mark"><span>Interlude</span>On reading code</div>
            <p className="quoteline">
              “A program is a sentence you will read a hundred times. <b>Write it for the hundredth.</b>”
            </p>
            <p className="attrib">PlainScript design note · Decisions</p>
          </div>
          <div className="art-break__plate"><Plate plateKey="eye" fig="02" crop="50% 48%" /></div>
        </section>
      </Reveal>

      <Reveal>
        <section className="manual">
          <div className="section-mark"><span>Contents</span>Everything, in order</div>
          <ol className="manual-list">
            {chapters.map((chapter) => {
              const chapterDone = chapter.lessons.every((lesson) => progress.completedLessons.includes(lesson.id));
              const first = chapter.lessons[0];
              return (
                <li key={chapter.number}>
                  <button type="button" className={chapterDone ? 'is-done' : ''} onClick={() => navigate(`/learn/${first.id}`)}>
                    <span className="ix">{chapter.number}</span>
                    <span className="mt">{chapter.title}</span>
                    <span className="mg">{chapterDone ? 'read ✓' : `${chapter.lessons.length} lesson${chapter.lessons.length > 1 ? 's' : ''}`}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="place">
          <div className="place__copy">
            <div className="section-mark"><span>Your place</span>Kept in this browser</div>
            <h2>{done === 0 ? 'Begin at the beginning.' : done === availableLessons.length ? 'The course is read.' : 'Continue where you stopped.'}</h2>
            <p>
              {done === 0
                ? 'Progress is saved locally, so you can close the book and return to the same paragraph. No account, no email, no dashboard.'
                : `You have read ${done} of ${availableLessons.length} lessons. ${latest ? `The last page open was “${latest.title}”.` : ''}`}
            </p>
            <div className="place__actions">
              <button type="button" className="btn-primary" onClick={() => navigate(`/learn/${nextLesson.id}`)}>
                {done === 0 ? 'Start the first lesson' : 'Continue reading'} <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="btn-ghost" onClick={() => navigate('/learn')}>See the contents</button>
            </div>
          </div>
          <div className="place__meter">
            <div className="meter-number">{String(percent).padStart(2, '0')}<span>%</span></div>
            <div className="meter-track"><i style={{ width: `${percent}%` }} /></div>
            <div className="meter-caption">
              <span>{done} read</span>
              <span>{availableLessons.length - done} remaining</span>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="art-strip" aria-label="Halftone art plates">
          <Plate plateKey="figure" fig="03" crop="50% 22%" />
          <Plate plateKey="chrome" fig="04" />
          <Plate plateKey="hands" fig="05" crop="50% 55%" />
        </section>
      </Reveal>

      <Reveal>
        <section className="principles">
          <div className="section-mark"><span>Position</span>What this is, and is not</div>
          <div className="principle-grid">
            <article className="principle">
              <span className="num">01</span>
              <h3>Independent by design</h3>
              <p>PlainScript is a language with its own grammar, checker and compiler, built in the open and published under MIT. This course is an independent reading of it.</p>
            </article>
            <article className="principle">
              <span className="num">02</span>
              <h3>Practice before polish</h3>
              <p>Every lesson ends with the compiler, not a quiz score. You are meant to change the program, break it, read the diagnostic and change it again.</p>
            </article>
            <article className="principle">
              <span className="num">03</span>
              <h3>Ordinary at the output</h3>
              <p>Nothing here invents a runtime. The examples compile to readable ES modules, and the course says so plainly when a topic needs a real project boundary.</p>
            </article>
          </div>
          <p className="closing-line"><button type="button" className="btn-ghost" onClick={() => navigate('/learn')}>Read the whole curriculum →</button></p>
        </section>
      </Reveal>
    </div>
  );
}

/* ---------- curriculum ---------- */

function ProgressBand({ progress, navigate, resetProgress }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) || availableLessons[0];
  return (
    <section className="progress-band" aria-label="Course progress">
      <div className="progress-band__meter">
        <span className="pb-percent">{String(percent).padStart(2, '0')}%</span>
        <div className="pb-track"><i style={{ width: `${percent}%` }} /></div>
      </div>
      <p>{done} of {availableLessons.length} lessons read. {done === 0 ? 'The first page is waiting.' : 'Progress is kept in this browser.'}</p>
      <div className="progress-band__actions">
        <button type="button" className="btn-primary small" onClick={() => navigate(`/learn/${next.id}`)}>
          {done === 0 ? 'Open lesson 01' : 'Continue'} <span aria-hidden="true">→</span>
        </button>
        {done > 0 && <button type="button" className="link-quiet" onClick={resetProgress}>Reset progress</button>}
      </div>
    </section>
  );
}

function Curriculum({ navigate, progress, resetProgress }) {
  return (
    <div className="curriculum">
      <div className="page-kicker">
        <span className="kicker-no">01</span>
        <span className="kicker-section">Contents</span>
        <span className="kicker-meta">PlainScript 2.3.1 · {availableLessons.length} lessons</span>
      </div>

      <div className="index-head">
        <h1 className="display">The course,<br /><em>in order.</em></h1>
        <p className="lede">
          Twenty chapters, read as a sequence. Each one is a short article with a specimen, a
          compiler-backed practice, and a question that asks you to use the language rather than
          recognise it.
        </p>
      </div>

      <ProgressBand progress={progress} navigate={navigate} resetProgress={resetProgress} />

      <section className="chapter-index" aria-label="Curriculum">
        {chapters.map((chapter) => {
          const chapterDone = chapter.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
          return (
            <article className="chapter-row" key={chapter.number}>
              <div className="chapter-row__no">{chapter.number}</div>
              <div className="chapter-row__body">
                <div className="chapter-row__head">
                  <h2>{chapter.title}</h2>
                  <span>{chapterDone}/{chapter.lessons.length} read</span>
                </div>
                <p>{chapter.summary}</p>
                <div className="chapter-lessons">
                  {chapter.lessons.map((lesson) => {
                    const isDone = progress.completedLessons.includes(lesson.id);
                    const quiz = progress.quizScores[lesson.id];
                    return (
                      <button key={lesson.id} type="button" className={`lesson-row${isDone ? ' is-done' : ''}`} onClick={() => navigate(`/learn/${lesson.id}`)}>
                        <span className="lesson-row__mark">{isDone ? <Check size={12} strokeWidth={2.4} aria-hidden="true" /> : '§'}</span>
                        <span className="lesson-row__title">{lesson.title}</span>
                        <span className="lesson-row__meta">{lesson.duration}{quiz === 1 ? ' · check passed' : ''}</span>
                        <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" className="lesson-row__arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <p className="index-note">
        Lessons are checked against the published <code>plainscript-lang@2.3.1</code> compiler.
        Platform topics — files, databases, HTTP — are described as runtime boundaries rather than
        invented as portable syntax.
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

  useEffect(() => {
    setCode(challenge?.starter || lesson.example);
    setHint(false);
    reset();
  }, [lesson.id]);

  const execute = async () => {
    if (!runnable) return;
    const payload = await run(code);
    if (payload?.ok) {
      const normalise = (value) => (value || '').trim().replace(/\s+/g, ' ');
      if (normalise(payload.output) === normalise(challenge.expectedOutput)) completeChallenge(lesson.id);
    }
  };

  return (
    <section className="margin-block practice">
      <div className="margin-label"><span>Specimen</span>Practice</div>
      <h3>{done ? 'The compiler agrees.' : 'Change the code.'}</h3>
      <p className="margin-prompt"><Inline text={challenge?.prompt || ''} /></p>

      <Editor code={code} onChange={setCode} label={`${lesson.id}.pln`} />
      <div className="practice-controls">
        <button type="button" className="btn-primary small" onClick={execute} disabled={!runnable || result.status === 'running'}>
          <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run'}
        </button>
        <button type="button" className="icon-btn" onClick={() => { setCode(challenge?.starter || lesson.example); reset(); }} aria-label="Reset the specimen">
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button type="button" className="link-quiet" onClick={() => setHint((value) => !value)}>{hint ? 'Hide hint' : 'Hint'}</button>
      </div>

      {!runnable && (
        <p className="practice-note">This specimen needs a React project boundary, so it is read rather than executed here.</p>
      )}
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

  const choose = (index) => {
    if (answered) return;
    setSelected(index);
    saveQuiz(lesson.id, index === quiz.answer ? 1 : 0);
  };

  return (
    <section className="margin-block check">
      <div className="margin-label"><span>Check</span>One question</div>
      <h3>{quiz.question}</h3>
      <div className="quiz-options" role="group" aria-label="Answer options">
        {quiz.options.map((option, index) => {
          const state = !answered ? '' : index === quiz.answer ? 'correct' : index === selected ? 'incorrect' : 'muted';
          return (
            <button key={option} type="button" className={state} onClick={() => choose(index)} disabled={answered} aria-pressed={selected === index}>
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback ${selected === quiz.answer ? 'correct' : 'incorrect'}`}>
          <b>{selected === quiz.answer ? 'Correct.' : 'Not quite.'}</b>
          <p><Inline text={quiz.explanation} /></p>
          {selected !== quiz.answer && <button type="button" className="link-quiet" onClick={() => setSelected(null)}>Try the question again</button>}
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
  const plateKey = plateForChapter(lesson.chapterNumber);
  const crop = CROPS[index % CROPS.length];

  useEffect(() => { window.scrollTo(0, 0); }, [lesson.id]);

  return (
    <article className="lesson">
      <figure className="chapter-band">
        <img src={PLATES[plateKey].src} alt={PLATES[plateKey].alt} style={{ objectPosition: crop }} width="1024" height="1024" />
        <span className="chapter-band__stamp"><b>Chapter {lesson.chapterNumber}</b> · {lesson.chapter}</span>
        <span className="chapter-band__num" aria-hidden="true">{lesson.chapterNumber}</span>
      </figure>

      <div className="page-kicker lesson-kicker">
        <span className="kicker-no">{lesson.chapterNumber}</span>
        <span className="kicker-section">{lesson.chapter}</span>
        <span className="kicker-meta">Lesson {String(index + 1).padStart(2, '0')} / {String(availableLessons.length).padStart(2, '0')} · {lesson.duration}</span>
      </div>

      <h1 className="prose-h1">{lesson.title}</h1>
      <p className="prose-lede"><Inline text={lesson.intro} /></p>

      <div className="article-grid">
        <div className="prose">
          <section className="lesson-sec">
            <h2>What you will learn</h2>
            <ul className="objectives">
              {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
          </section>

          <section className="lesson-sec">
            <h2>The idea</h2>
            <p><Inline text={lesson.explanation} /></p>
          </section>

          <section className="lesson-sec">
            <h2>Syntax, close up</h2>
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
            <h2>The specimen</h2>
            <p>Read it once for the shape, then read it again for the names.</p>
            <CodeSpecimen code={lesson.example} file={`${lesson.id}.pln`} />
            {lesson.expectedOutput && (
              <div className="expected">
                <span className="expected-label">Expected output</span>
                <pre>{lesson.expectedOutput}</pre>
              </div>
            )}
          </section>

          <section className="lesson-sec">
            <div className="exercise">
              <span className="exercise-label">Exercise</span>
              <p><Inline text={lesson.exercise} /></p>
            </div>
          </section>

          <section className="lesson-sec">
            <h2>Common mistakes</h2>
            <ul className="mistakes">
              {lesson.commonMistakes.map((mistake) => <li key={mistake}><Inline text={mistake} /></li>)}
            </ul>
          </section>

          <blockquote className="lesson-quote">
            The compiler checks the source before it runs. When a line feels unclear, give it a name
            or a type instead of hiding the decision.
            <cite>Margin note · PlainScript 2.3.1</cite>
          </blockquote>
        </div>

        <aside className="lesson-margin" aria-label="Practice and check">
          <LessonPractice lesson={lesson} progress={progress} completeChallenge={completeChallenge} />
          <LessonQuiz lesson={lesson} savedScore={progress.quizScores[lesson.id]} saveQuiz={saveQuiz} />
        </aside>
      </div>

      <div className={`lesson-complete${isComplete ? ' is-done' : ''}`}>
        <div className="completion">
          <span className="completion-mark">{isComplete ? <Check size={15} strokeWidth={2.6} aria-hidden="true" /> : '○'}</span>
          <div>
            <b>{isComplete ? 'Lesson read' : 'Finished reading?'}</b>
            <small>{isComplete ? 'Recorded in this browser.' : 'Mark the lesson when the idea feels clear. It is reversible.'}</small>
          </div>
        </div>
        {!isComplete
          ? <button type="button" className="btn-primary small" onClick={() => completeLesson(lesson.id)}>Mark as read</button>
          : <button type="button" className="link-quiet" onClick={() => navigate(`/learn/${next ? next.id : availableLessons[0].id}`)}>Keep going →</button>}
      </div>

      <nav className="page-nav" aria-label="Lesson navigation">
        {previous
          ? <button type="button" className="pn pn-prev" onClick={() => navigate(`/learn/${previous.id}`)}>
              <span className="pn-label">← Previous</span>
              <span className="pn-title">{previous.title}</span>
            </button>
          : <span className="pn pn-empty" aria-hidden="true" />}
        {next
          ? <button type="button" className="pn pn-next" onClick={() => navigate(`/learn/${next.id}`)}>
              <span className="pn-label">Next →</span>
              <span className="pn-title">{next.title}</span>
            </button>
          : <button type="button" className="pn pn-next" onClick={() => navigate('/learn')}>
              <span className="pn-label">End of the course</span>
              <span className="pn-title">Back to the contents</span>
            </button>}
      </nav>
    </article>
  );
}

/* ---------- playground ---------- */

function Playground({ navigate }) {
  const [exampleId, setExampleId] = useState(playgroundExamples[0].id);
  const example = playgroundExamples.find((item) => item.id === exampleId) || playgroundExamples[0];
  const [code, setCode] = useState(example.code);
  const { result, run, reset } = useRunner();

  const choose = (item) => {
    setExampleId(item.id);
    setCode(item.code);
    reset();
  };

  return (
    <div className="playground">
      <div className="page-kicker">
        <span className="kicker-no">LAB</span>
        <span className="kicker-section">Playground</span>
        <span className="kicker-meta">plainscript-lang 2.3.1 · bounded process</span>
      </div>

      <div className="lab-head">
        <h1 className="display">The compiler,<br /><em>at the desk.</em></h1>
        <p className="lede">
          A full editor for the language. Nine specimens cover the 2.1 dialect and the 2.3 object
          model; every one is checked against the published compiler before it ships.
        </p>
      </div>

      <div className="example-strip" role="tablist" aria-label="Example programs">
        {playgroundExamples.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={exampleId === item.id}
            className={exampleId === item.id ? 'on' : ''}
            onClick={() => choose(item)}
          >
            <span className="ex-no">{String(playgroundExamples.indexOf(item) + 1).padStart(2, '0')}</span>
            {item.label}
          </button>
        ))}
      </div>

      <p className="example-note">{example.note}</p>

      <div className="lab-grid">
        <section className="lab-pane" aria-label="Editor">
          <div className="lab-pane__head">
            <span>Editor / {example.id}.pln</span>
            <span className="lab-pane__hint">Tab inserts four spaces</span>
          </div>
          <Editor code={code} onChange={setCode} label={`${example.id}.pln`} minHeight="440px" />
          <div className="lab-controls">
            <button type="button" className="btn-primary" onClick={() => run(code)} disabled={result.status === 'running'}>
              <Play size={14} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run program'}
            </button>
            <button type="button" className="icon-btn" onClick={() => { setCode(example.code); reset(); }} aria-label="Reset to the example">
              <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <span className="lab-shortcut">⌘/Ctrl + Enter</span>
          </div>
        </section>

        <section className="lab-pane lab-output" aria-label="Output" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); run(code); } }}>
          <div className="lab-pane__head">
            <span>Console</span>
            <span className={`run-state is-${result.status}`}>{result.status === 'idle' ? 'ready' : result.status}</span>
          </div>
          <Output result={result} />
          <div className="lab-notes">
            <p>File, network, process and dynamic-import access are removed before execution.</p>
            <p>Programs time out after 3.5 seconds. Output is capped at 64 KB.</p>
          </div>
        </section>
      </div>

      <div className="lab-footnote">
        <p>
          Need context for a specimen? The <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>curriculum</button> explains
          each idea with a lesson, and the <button type="button" className="link-quiet" onClick={() => navigate('/quiz')}>examination</button> checks
          the language across the whole course.
        </p>
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
    if (correct) setScore((value) => value + 1);
    recordExam(current.lesson.id, correct);
  };

  const advance = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const total = questions.length;
    return (
      <div className="examination exam-result">
        <div className="page-kicker">
          <span className="kicker-no">02</span>
          <span className="kicker-section">Examination</span>
          <span className="kicker-meta">Result</span>
        </div>
        <h1 className="display">You scored<br /><em>{score} of {total}</em>.</h1>
        <p className="lede">
          {score === total
            ? 'Every question answered correctly. The language is in your hands now — the playground is the better examination.'
            : 'A score is a map, not a verdict. The lessons behind the questions you missed are still open, and the compiler is patient.'}
        </p>
        <div className="result-meter"><i style={{ width: `${Math.round((score / total) * 100)}%` }} /></div>
        <div className="result-actions">
          <button type="button" className="btn-primary" onClick={restart}>Sit it again</button>
          <button type="button" className="btn-ghost" onClick={() => navigate('/learn')}>Return to the contents</button>
        </div>
        <div className="result-list">
          {questions.map(({ lesson }) => {
            const answer = progress.examAnswers[lesson.id];
            return (
              <button type="button" key={lesson.id} className={answer ? 'correct' : 'incorrect'} onClick={() => navigate(`/learn/${lesson.id}`)}>
                <span>{lesson.chapterNumber}</span>
                <b>{lesson.title}</b>
                <em>{answer ? 'passed' : 'review'}</em>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="examination">
      <div className="page-kicker">
        <span className="kicker-no">02</span>
        <span className="kicker-section">Examination</span>
        <span className="kicker-meta">{questions.length} questions · no timer</span>
      </div>

      <div className="exam-head">
        <h1 className="display">The course,<br /><em>in questions.</em></h1>
        <p className="lede">
          One question from each lesson. Nothing is scored until you answer, and every answer
          explains itself. The examination can be retaken as often as you like.
        </p>
      </div>

      <div className="exam-progress">
        <div className="exam-progress__track"><i style={{ width: `${percent}%` }} /></div>
        <span>Question {String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span>
        <span>{score} correct</span>
      </div>

      <article className="exam-card">
        <div className="exam-source">
          <span>Chapter {current.lesson.chapterNumber}</span>
          <span>{current.lesson.chapter}</span>
          <button type="button" className="link-quiet" onClick={() => navigate(`/learn/${current.lesson.id}`)}>Read the lesson ↗</button>
        </div>
        <h2>{current.quiz.question}</h2>
        <div className="quiz-options exam-options" role="group" aria-label="Answer options">
          {current.quiz.options.map((option, optionIndex) => {
            const state = selected === null ? '' : optionIndex === current.quiz.answer ? 'correct' : optionIndex === selected ? 'incorrect' : 'muted';
            return (
              <button key={option} type="button" className={state} onClick={() => choose(optionIndex)} disabled={selected !== null} aria-pressed={selected === optionIndex}>
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div className={`quiz-feedback ${selected === current.quiz.answer ? 'correct' : 'incorrect'}`}>
            <b>{selected === current.quiz.answer ? 'Correct.' : `The answer is ${String.fromCharCode(65 + current.quiz.answer)}.`}</b>
            <p><Inline text={current.quiz.explanation} /></p>
            <button type="button" className="btn-primary small" onClick={advance}>
              {index + 1 >= questions.length ? 'See the result' : 'Next question'} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </article>

      <div className="exam-dots" aria-hidden="true">
        {questions.map((question, dotIndex) => (
          <span key={question.lesson.id} className={dotIndex < index ? 'past' : dotIndex === index ? 'now' : ''} />
        ))}
      </div>
    </div>
  );
}

/* ---------- flashcards ---------- */

function Flashcards({ progress, markReviewed, setCardIndex, navigate }) {
  const [revealed, setRevealed] = useState(false);
  const card = flashcards[progress.flashcardIndex % flashcards.length];
  const reviewed = progress.reviewedCards.length;

  const move = (direction) => {
    setRevealed(false);
    setCardIndex((progress.flashcardIndex + direction + flashcards.length) % flashcards.length);
  };

  const reveal = () => {
    setRevealed(true);
    markReviewed(card.id);
  };

  return (
    <div className="flashcards">
      <div className="page-kicker">
        <span className="kicker-no">03</span>
        <span className="kicker-section">Revision cards</span>
        <span className="kicker-meta">{reviewed} of {flashcards.length} revealed</span>
      </div>

      <div className="lab-head">
        <h1 className="display">Keep the syntax<br /><em>close at hand.</em></h1>
        <p className="lede">
          Seven cards for the words that shape the language. Read the question, say the answer,
          then turn the card over.
        </p>
      </div>

      <div className="flashcard-layout">
        <button type="button" className={`flashcard${revealed ? ' revealed' : ''}`} onClick={() => (revealed ? setRevealed(false) : reveal())} aria-label={revealed ? 'Hide the answer' : 'Reveal the answer'}>
          <div className="flashcard-top">
            <span>Card {String((progress.flashcardIndex % flashcards.length) + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}</span>
            <span>{revealed ? 'answer' : 'question'}</span>
          </div>
          <div className="flashcard-body">
            <span className="eyebrow">PlainScript 2.3.1</span>
            <h2>{revealed ? card.answer : card.question}</h2>
            <span className="flip-label">{revealed ? 'Click to hide' : 'Click to reveal'}</span>
          </div>
          <div className="flashcard-foot">
            <span className="flashcard-dots">
              {flashcards.map((item, index) => (
                <i key={item.id} className={index === progress.flashcardIndex % flashcards.length ? 'on' : progress.reviewedCards.includes(item.id) ? 'seen' : ''} />
              ))}
            </span>
            <span>hand-set · halftone</span>
          </div>
        </button>

        <aside className="flashcard-side">
          <div className="section-mark"><span>Deck</span>A small glossary</div>
          <h3>Seven words that carry the language.</h3>
          <p>
            These cards are revision, not the lesson. If an answer is unfamiliar, the curriculum has
            a specimen and an explanation waiting for it.
          </p>
          <div className="flashcard-controls">
            <button type="button" className="btn-ghost" onClick={() => move(-1)}>← Previous</button>
            <button type="button" className="btn-primary small" onClick={() => move(1)}>Next card →</button>
          </div>
          <ul className="deck-list">
            {flashcards.map((item, index) => (
              <li key={item.id} className={progress.reviewedCards.includes(item.id) ? 'seen' : ''}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.question.split(' ').slice(0, 6).join(' ')}…
              </li>
            ))}
          </ul>
          <button type="button" className="link-quiet" onClick={() => navigate('/quiz')}>Take the examination →</button>
        </aside>
      </div>
    </div>
  );
}

/* ---------- projects ---------- */

function Projects({ progress, navigate }) {
  return (
    <div className="projects">
      <div className="page-kicker">
        <span className="kicker-no">04</span>
        <span className="kicker-section">Commissions</span>
        <span className="kicker-meta">Three briefs · open ended</span>
      </div>

      <div className="lab-head">
        <h1 className="display">Three briefs<br /><em>for the desk.</em></h1>
        <p className="lede">
          Lessons teach a word at a time. A commission asks you to make something with several of
          them. None of these have a single correct answer; each has a clear criterion.
        </p>
      </div>

      <div className="projects-list">
        {projects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-number">{project.number}</div>
            <div className="project-main">
              <div className="project-meta">
                <span>{project.level}</span><i>·</i><span>{project.concepts.join(' / ')}</span>
              </div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="project-columns">
                <div>
                  <b>Requirements</b>
                  <ul>{project.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <b>Starting point</b>
                  <p>{project.starting}</p>
                </div>
                <div>
                  <b>Finished when</b>
                  <p>{project.criteria}</p>
                </div>
              </div>
              <div className="project-actions">
                <button type="button" className="link-quiet" onClick={() => navigate('/playground')}>Open the playground →</button>
                <button type="button" className="link-quiet" onClick={() => navigate('/learn')}>Find the related lessons →</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- not found ---------- */

function NotFound({ navigate }) {
  return (
    <div className="not-found">
      <p className="page-kicker"><span className="kicker-no">404</span><span className="kicker-section">Not in the manual</span></p>
      <h1 className="display">This page<br /><em>is not printed.</em></h1>
      <p className="lede">The address does not belong to a lesson, a specimen, or a plate. The contents are the reliable place to begin.</p>
      <div className="masthead-actions">
        <button type="button" className="btn-primary" onClick={() => navigate('/learn')}>Open the contents →</button>
        <button type="button" className="btn-ghost" onClick={() => navigate('/')}>Return to the cover</button>
      </div>
    </div>
  );
}

/* ---------- application ---------- */

function routePath() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function App() {
  const [path, setPath] = useState(routePath);
  const [railOpen, setRailOpen] = useState(false);
  const progressState = useProgress();

  useEffect(() => {
    const onPop = () => setPath(routePath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to) => {
    if (to === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, [path]);

  let view;
  let crumb = ['LearnPlainScript', 'Manual'];
  let title = 'LearnPlainScript · A course for PlainScript 2.3.1';

  if (path === '/') {
    view = <Landing navigate={navigate} progress={progressState.progress} />;
    crumb = ['LearnPlainScript', 'Cover'];
    title = 'LearnPlainScript · An interactive companion to PlainScript';
  } else if (path === '/learn') {
    view = <Curriculum navigate={navigate} progress={progressState.progress} resetProgress={progressState.resetProgress} />;
    crumb = ['LearnPlainScript', 'Contents'];
    title = 'Contents · LearnPlainScript';
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
      crumb = [`Chapter ${lesson.chapterNumber}`, lesson.title];
      title = `${lesson.title} · LearnPlainScript`;
    } else {
      view = <NotFound navigate={navigate} />;
      crumb = ['LearnPlainScript', '404'];
      title = 'Not found · LearnPlainScript';
    }
  } else if (path === '/playground') {
    view = <Playground navigate={navigate} />;
    crumb = ['LearnPlainScript', 'Playground'];
    title = 'Playground · LearnPlainScript';
  } else if (path === '/quiz') {
    view = <Examination progress={progressState.progress} recordExam={progressState.recordExam} navigate={navigate} />;
    crumb = ['LearnPlainScript', 'Examination'];
    title = 'Examination · LearnPlainScript';
  } else if (path === '/flashcards') {
    view = (
      <Flashcards
        progress={progressState.progress}
        markReviewed={progressState.markReviewed}
        setCardIndex={progressState.setCardIndex}
        navigate={navigate}
      />
    );
    crumb = ['LearnPlainScript', 'Revision cards'];
    title = 'Revision cards · LearnPlainScript';
  } else if (path === '/projects') {
    view = <Projects progress={progressState.progress} navigate={navigate} />;
    crumb = ['LearnPlainScript', 'Commissions'];
    title = 'Commissions · LearnPlainScript';
  } else {
    view = <NotFound navigate={navigate} />;
    crumb = ['LearnPlainScript', '404'];
    title = 'Not found · LearnPlainScript';
  }

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [path]);

  return (
    <Shell path={path} navigate={navigate} progress={progressState.progress} railOpen={railOpen} setRailOpen={setRailOpen} crumb={crumb}>
      {view}
    </Shell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
