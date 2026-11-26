import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Menu, Play, RotateCcw, X,
} from 'lucide-react';
import { availableLessons, plainWords } from './content.js';
import { lessonTopics, relatedLessons as topicalRelatedLessons } from './garden.js';
import { homepageSpecimen } from './examples.js';
import { Tokens } from './highlight.jsx';
import { Editor } from './editor.jsx';
import { Output, useRunner } from './runner.jsx';

/* --------------------------------------------------------------------------
   The garden's shape

   The curriculum already has twenty chapters. A bed is a reading-sized
   grouping of those chapters, not a replacement for them. Every lesson stays
   in its original order and every existing route is untouched.
--------------------------------------------------------------------------- */

export const BEDS = [
  {
    id: 'roots',
    title: 'Roots & first words',
    short: 'Roots',
    blurb: 'Orientation, first programs, syntax, and the difference between a value and a change.',
    chapters: ['01', '02', '03', '04'],
    stage: 'seedling',
  },
  {
    id: 'values',
    title: 'Values & shapes',
    short: 'Values',
    blurb: 'Types, expressions, records, lists, and the data a program works with.',
    chapters: ['05', '06', '09', '10'],
    stage: 'evergreen',
  },
  {
    id: 'structure',
    title: 'Structure & motion',
    short: 'Structure',
    blurb: 'Conditions, functions, modules, and the paths a program can take.',
    chapters: ['07', '08', '11'],
    stage: 'evergreen',
  },
  {
    id: 'edges',
    title: 'Edges & failures',
    short: 'Edges',
    blurb: 'Errors, asynchronous work, and patterns: where small programs meet the real world.',
    chapters: ['12', '13', '14'],
    stage: 'budding',
  },
  {
    id: 'platform',
    title: 'The wider platform',
    short: 'Platform',
    blurb: 'JSX, React, JavaScript interop, and the deliberate bridges between languages.',
    chapters: ['15', '16', '17', '18'],
    stage: 'budding',
  },
  {
    id: 'new-growth',
    title: 'New growth',
    short: 'New growth',
    blurb: 'Classes, generators, typed failures, and the professional toolchain added in 2.3.',
    chapters: ['19', '20'],
    stage: 'budding',
  },
];

export const STAGES = {
  seedling: {
    label: 'Seedling',
    description: 'An entry point for a new reader.',
  },
  budding: {
    label: 'Budding',
    description: 'Newer material that is still being tended.',
  },
  evergreen: {
    label: 'Evergreen',
    description: 'Settled, complete core notes.',
  },
};

const NAV = [
  { to: '/learn', label: 'The Garden' },
  { to: '/playground', label: 'Playground' },
  { to: '/whiteboard', label: 'Lecture board' },
  { to: '/quiz', label: 'Practice' },
  { to: '/projects', label: 'Projects' },
  { to: '/progress', label: 'Progress' },
];


export function lessonsForBed(bed) {
  return availableLessons.filter((lesson) => bed.chapters.includes(lesson.chapterNumber));
}

export function bedForLesson(lesson) {
  return BEDS.find((bed) => bed.chapters.includes(lesson.chapterNumber));
}

export function stageForLesson(lesson) {
  return bedForLesson(lesson)?.stage || 'evergreen';
}

export function relatedLessons(lesson) {
  // Topic affinity comes first; bed proximity fills any gaps.
  const topical = topicalRelatedLessons(lesson, availableLessons);
  const bed = bedForLesson(lesson);
  if (!bed) return topical.slice(0, 3);
  const index = BEDS.indexOf(bed);
  const nearby = [BEDS[index + 1], BEDS[index - 1], BEDS[index + 2], BEDS[index - 2]]
    .filter(Boolean)
    .flatMap(lessonsForBed);
  const seen = new Set([lesson.id, ...topical.map((item) => item.id)]);
  const rest = [...lessonsForBed(bed), ...nearby].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return [...topical, ...rest].slice(0, 3);
}

function nextLesson(progress) {
  return availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id))
    || availableLessons[availableLessons.length - 1];
}

function lessonNumber(lesson) {
  return String(availableLessons.findIndex((item) => item.id === lesson.id) + 1).padStart(2, '0');
}

function activePath(path, to) {
  return to === '/learn' ? path === '/learn' || path.startsWith('/learn/') : path === to;
}

/* --------------------------------------------------------------------------
   Marks, stages and small reusable pieces
--------------------------------------------------------------------------- */

export function GardenMark({ size = 26, className = '' }) {
  return (
    <svg className={`g-mark ${className}`} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 29V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 20.5C10.4 20.5 7 17.2 7 11.3C12.6 11.3 16 14.6 16 20.5Z" fill="currentColor" opacity=".9" />
      <path d="M16 15.8C16 10.1 19.4 6.8 25 6.8C25 12.7 21.6 15.8 16 15.8Z" fill="var(--g-accent)" opacity=".9" />
      <path d="M10 29H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GrowthGlyph({ stage = 'evergreen', size = 22 }) {
  const common = { stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg className={`g-glyph g-glyph--${stage}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {stage === 'seedling' && (
        <>
          <path d="M12 20V10" {...common} />
          <path d="M12 14C7.6 14 5 11.4 5 7C9.4 7 12 9.6 12 14Z" fill="currentColor" opacity=".18" {...common} />
          <path d="M12 10C12 6 14.5 3.6 19 3.6C19 8 16.5 10 12 10Z" fill="currentColor" opacity=".3" {...common} />
          <path d="M7 20H17" {...common} opacity=".45" />
        </>
      )}
      {stage === 'budding' && (
        <>
          <path d="M12 21V12" {...common} />
          <path d="M12 16C8 16 5.5 13.6 5.5 9.5C9.6 9.5 12 11.9 12 16Z" fill="currentColor" opacity=".18" {...common} />
          <path d="M12 12C12 7.4 14.2 4.5 18.8 3C19.5 8.2 16.8 11.3 12 12Z" fill="currentColor" opacity=".38" {...common} />
          <circle cx="12" cy="5.2" r="2.2" fill="currentColor" opacity=".65" />
        </>
      )}
      {stage === 'evergreen' && (
        <>
          <path d="M12 21V13" {...common} />
          <path d="M12 14C7 14 4.2 10.8 4.2 5.4C9.3 5.4 12 8.6 12 14Z" fill="currentColor" opacity=".2" {...common} />
          <path d="M12 13C12 8 14.8 4.8 19.8 4.8C19.8 10.2 17 13 12 13Z" fill="currentColor" opacity=".34" {...common} />
          <path d="M8 21H16" {...common} opacity=".5" />
        </>
      )}
    </svg>
  );
}

export function StageBadge({ stage, className = '' }) {
  const meta = STAGES[stage] || STAGES.evergreen;
  return (
    <span className={`g-stage g-stage--${stage} ${className}`} title={(meta.description)}>
      <GrowthGlyph stage={stage} size={14} />
      <span>{(meta.label)}</span>
    </span>
  );
}

function Meter({ value, className = '' }) {
  return (
    <span className={`g-meter ${className}`} aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

function GardenWordmark({ navigate }) {
  return (
    <button type="button" className="g-brand" onClick={() => navigate('/')} aria-label="LearnPlainScript, home">
      <GardenMark size={29} />
      <span className="g-brand__type">LearnPlain<em>Script</em></span>
      <span className="g-brand__sub">A PlainScript field guide</span>
    </button>
  );
}

/* --------------------------------------------------------------------------
   The map: a little hand-drawn plan of the garden
--------------------------------------------------------------------------- */

export function GardenPlot() {
  return (
    <svg className="g-plot" viewBox="0 0 760 370" role="img" aria-labelledby="g-plot-title">
      <title id="g-plot-title">A winding path through six garden beds of PlainScript lessons</title>
      <path className="g-plot__contour" d="M24 86C134 22 245 40 327 80c92 45 167 18 235-26 62-40 125-27 164 13" />
      <path className="g-plot__contour" d="M30 330c88-58 151-40 224-4 80 39 143 24 215-18 72-43 153-35 261 18" />
      <path className="g-plot__route" d="M66 305C128 277 126 222 208 218S310 279 383 247S423 171 501 160S564 204 626 151S641 74 703 61" />
      <g className="g-plot__bed g-plot__bed--seedling g-stage--seedling">
        <path d="M50 234l153-20 9 73-153 20z" />
        <path d="M66 248l60-8M70 263l96-12M74 278l46-6" className="g-plot__rows" />
        <text x="63" y="226">01 / Roots</text>
      </g>
      <g className="g-plot__bed g-plot__bed--evergreen g-stage--evergreen">
        <path d="M224 154l145-12 7 57-145 12z" />
        <path d="M240 170l103-9M244 184l73-6" className="g-plot__rows" />
        <text x="235" y="146">02 / Values</text>
      </g>
      <g className="g-plot__bed g-plot__bed--evergreen g-stage--evergreen">
        <path d="M270 267l157-10 5 55-157 10z" />
        <path d="M286 282l112-7M289 296l79-5" className="g-plot__rows" />
        <text x="282" y="259">03 / Structure</text>
      </g>
      <g className="g-plot__bed g-plot__bed--budding g-stage--budding">
        <path d="M473 198l146 14-6 55-146-14z" />
        <path d="M489 214l104 10M486 228l75 7" className="g-plot__rows" />
        <text x="483" y="190">04 / Edges</text>
      </g>
      <g className="g-plot__bed g-plot__bed--budding g-stage--budding">
        <path d="M537 74l156 8-4 51-156-8z" />
        <path d="M553 91l112 6M551 105l82 4" className="g-plot__rows" />
        <text x="548" y="66">05 / Platform</text>
      </g>
      <g className="g-plot__bed g-plot__bed--budding g-stage--budding">
        <path d="M640 246l83 15-11 58-83-15z" />
        <path d="M652 266l51 9M649 280l37 7" className="g-plot__rows" />
        <text x="635" y="238">06 / New</text>
      </g>
      <g className="g-plot__seeds">
        <circle cx="66" cy="305" r="3.5" />
        <circle cx="208" cy="218" r="3" />
        <circle cx="383" cy="247" r="3" />
        <circle cx="501" cy="160" r="3" />
        <circle cx="626" cy="151" r="3" />
        <circle cx="703" cy="61" r="3.5" />
      </g>
      <text className="g-plot__caption" x="42" y="352">start at the gate</text>
      <text className="g-plot__caption g-plot__caption--end" x="660" y="42">keep growing</text>
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Header, menu, tabs and footer
--------------------------------------------------------------------------- */

export function GardenHeader({ path, navigate, progress, onMenu, reading, menuOpen = false }) {
  const next = nextLesson(progress);
  return (
    <header className="g-header">
      <div className="g-header__inner">
        <GardenWordmark navigate={navigate} />
        <nav className="g-nav" aria-label="Sections">
          {NAV.map((item) => (
            <button
              key={item.to}
              type="button"
              className={activePath(path, item.to) ? 'is-active' : ''}
              onClick={() => navigate(item.to)}
              aria-current={activePath(path, item.to) ? 'page' : undefined}
            >
              {(item.label)}
            </button>
          ))}
        </nav>
        <div className="g-header__actions">
          <button type="button" className="g-header__continue" onClick={() => navigate(`/learn/${next.id}`)}>
            <span>{(progress.completedLessons.length ? 'Continue' : 'Start here')}</span>
            <ArrowRight size={15} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button type="button" className="g-menu-toggle" onClick={onMenu} aria-label="Open the garden menu and appearance settings" aria-expanded={menuOpen} aria-controls="garden-menu">
            <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>{'Menu'}</span>
          </button>
        </div>
      </div>
      <span className="g-reading" aria-hidden="true"><i style={{ width: `${reading}%` }} /></span>
    </header>
  );
}

export function GardenDrawer({ open, onClose, navigate, progress, theme, onToggleTheme }) {
  const next = nextLesson(progress);
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const isDark = theme === 'dark';
  const panelRef = useRef(null);
  const returnFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])
      .filter((element) => !element.disabled && element.getClientRects().length > 0);
    const frame = window.requestAnimationFrame(() => {
      const first = focusable()[0];
      (first || panel)?.focus();
    });
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      if (returnFocus.current instanceof HTMLElement && document.contains(returnFocus.current)) {
        returnFocus.current.focus();
      }
    };
  }, [open, onClose]);

  return (
    <div className={`g-drawer${open ? ' is-open' : ''}`} aria-hidden={!open} inert={open ? undefined : true}>
      <button type="button" className="g-drawer__scrim" onClick={onClose} aria-label="Close the garden menu" tabIndex={open ? 0 : -1} />
      <div className="g-drawer__panel" id="garden-menu" role="dialog" aria-modal="true" aria-label="Garden menu" ref={panelRef} tabIndex={-1}>
        <div className="g-drawer__head">
          <GardenWordmark navigate={navigate} />
          <button type="button" className="g-icon-button" onClick={onClose} aria-label="Close the garden menu">
            <X size={21} strokeWidth={1.4} aria-hidden="true" />
          </button>
        </div>

        <div className="g-drawer__theme">
          <div>
            <span className="g-eyebrow">{'Reading light'}</span>
            <span className="g-drawer__theme-name">{isDark ? 'Night garden' : 'Day garden'}</span>
          </div>
          <div className="g-drawer__controls">
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? 'Switch to the day garden' : 'Switch to the night garden'}
              className={`g-switch${isDark ? ' is-night' : ''}`}
              onClick={onToggleTheme}
            >
              <span className={isDark ? '' : 'is-on'}>{'Day'}</span>
              <span className="g-switch__track" aria-hidden="true"><span className="g-switch__thumb" /></span>
              <span className={isDark ? 'is-on' : ''}>{'Night'}</span>
            </button>
          </div>
        </div>

        <p className="g-eyebrow g-drawer__label">{'Wander'}</p>
        <nav className="g-drawer__nav" aria-label="All sections">
          {NAV.map((item, index) => (
            <button
              key={item.to}
              type="button"
              className={activePath(window.location.pathname, item.to) ? 'is-active' : ''}
              onClick={() => navigate(item.to)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>{item.label}
            </button>
          ))}
          <button type="button" onClick={() => navigate('/')}><span>00</span>{'Front page'}</button>
        </nav>

        <div className="g-drawer__place">
          <div className="g-drawer__place-head">
            <span className="g-eyebrow">{'Your place'}</span>
            <span>{percent}%</span>
          </div>
          <Meter value={percent} />
          <p>{done} of {availableLessons.length} notes read</p>
          <span className="g-drawer__next-label">{(done ? 'Pick up at' : 'Begin with')}</span>
          <button type="button" className="g-drawer__next" onClick={() => navigate(`/learn/${next.id}`)}>
            <b>{next.title}</b>
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="g-drawer__foot">
          <p>{'Progress is kept in this browser. No account, no trackers.'}</p>
          <a href="https://ayoistooslick.github.io/plainscript" target="_blank" rel="noreferrer">{'Official PlainScript documentation'} <ArrowUpRight size={11} aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  );
}

export function GardenTabs({ path, navigate }) {
  const tabs = [
    { to: '/', label: 'Home', no: '00' },
    { to: '/learn', label: 'Garden', no: '01' },
    { to: '/playground', label: 'Bench', no: '02' },
    { to: '/whiteboard', label: 'Board', no: '03' },
  ];
  return (
    <nav className="g-tabs" aria-label="Quick navigation">
      {tabs.map((tab) => {
        const active = tab.to === '/' ? path === '/' : activePath(path, tab.to);
        return (
          <button key={tab.to} type="button" className={active ? 'is-active' : ''} onClick={() => navigate(tab.to)} aria-current={active ? 'page' : undefined}>
            <span>{tab.no}</span>{(tab.label)}
          </button>
        );
      })}
    </nav>
  );
}

export function GardenFooter({ navigate }) {
  return (
    <footer className="g-footer">
      <div className="g-footer__lead">
        <GardenMark size={34} />
        <p>{'An independent field guide to PlainScript 2.3.1. Read a note, run its program, then follow what interests you.'}</p>
        <span>{availableLessons.length} notes · {BEDS.length} beds · no account</span>
      </div>
      <div className="g-footer__grid">
        <div>
          <p className="g-eyebrow">Wander</p>
          <nav className="g-footer__nav" aria-label="Footer navigation">
            {NAV.map((item) => <button key={item.to} type="button" onClick={() => navigate(item.to)}>{(item.label)}</button>)}
          </nav>
        </div>
        <div>
          <p className="g-eyebrow">{'How it grows'}</p>
          <ul className="g-footer__stages">
            {Object.entries(STAGES).map(([id, stage]) => (
              <li key={id}><StageBadge stage={id} /><span>{(stage.description)}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="g-eyebrow">{'Colophon'}</p>
          <p className="g-footer__copy">Set in Newsreader, Lato and IBM Plex Mono. Every runnable specimen is checked and executed with <code>plainscript-lang@2.3.1</code>.</p>
          <a href="https://ayoistooslick.github.io/plainscript" target="_blank" rel="noreferrer">{'The language documentation'} <ArrowUpRight size={11} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="g-footer__bottom">
        <span>{'LearnPlainScript · a garden for readable code'}</span>
        <span>{'Written for people starting from zero.'}</span>
        <span>{'Independent companion · not affiliated with the language author.'}</span>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------------------
   Homepage
--------------------------------------------------------------------------- */

function GardenBench() {
  const [code, setCode] = useState(homepageSpecimen);
  const { result, run, reset } = useRunner();
  return (
    <div className="g-bench">
      <div className="g-bench__bar">
        <span>Seed packet · hello.pln</span>
        <span>real compiler · 2.3.1</span>
      </div>
      <Editor code={code} onChange={setCode} label="hello.pln" minHeight="220px" onRun={() => run(code)} />
      <div className="g-bench__actions">
        <button type="button" className="g-button g-button--small g-button--accent" onClick={() => run(code)} disabled={result.status === 'running'}>
          <Play size={12} strokeWidth={2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run the program'}
        </button>
        <button type="button" className="g-icon-button" onClick={() => { setCode(homepageSpecimen); reset(); }} aria-label="Reset the example">
          <RotateCcw size={14} strokeWidth={1.7} aria-hidden="true" />
        </button>
        <span className="g-bench__hint">⌘ / Ctrl + Enter</span>
      </div>
      <Output result={result} compact />
    </div>
  );
}

function GardenFieldNote({ navigate }) {
  return (
    <aside className="g-field-note">
      <div className="g-field-note__head">
        <span className="g-eyebrow">Field note 01</span>
        <span>hello.pln</span>
      </div>
      <pre className="g-field-note__code"><code><Tokens code={homepageSpecimen} /></code></pre>
      <div className="g-field-note__seal">
        <GrowthGlyph stage="seedling" size={30} />
        <span>One import.<br />One function.<br />One call.</span>
      </div>
      <div className="g-field-note__foot">
        <p>A real program, ready to change and run. No simulation.</p>
        <button type="button" className="g-text-link" onClick={() => navigate('/playground')}>Open the potting shed <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
    </aside>
  );
}

function GardenHere({ progress, navigate }) {
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);
  const next = nextLesson(progress);
  const bed = bedForLesson(next);
  return (
    <section className="g-here" aria-label="Your place in the garden">
      <div className="g-here__label">
        <span className="g-eyebrow">{'Your place'}</span>
        <b>{(done ? 'Continue where you stopped' : 'The gate is open')}</b>
      </div>
      <Meter value={percent} className="g-here__meter" />
      <div className="g-here__count"><b>{done}</b> / {availableLessons.length} {'notes read'}</div>
      <div className="g-here__next">
        <span>{bed ? bed.title : 'The garden'}</span>
        <b>{next.title}</b>
      </div>
      <button type="button" className="g-button g-button--small g-button--accent" onClick={() => navigate(`/learn/${next.id}`)}>
        {(done ? 'Open the next note' : 'Begin here')} <ArrowRight size={13} aria-hidden="true" />
      </button>
    </section>
  );
}

function BedCard({ bed, progress, navigate, index }) {
  const lessons = lessonsForBed(bed);
  const done = lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
  const percent = Math.round((done / lessons.length) * 100);
  return (
    <button
      type="button"
      className={`g-bed-card g-stage--${bed.stage}${index < 2 ? ' g-bed-card--wide' : ''}`}
      onClick={() => navigate(`/learn?bed=${bed.id}`)}
    >
      <span className="g-bed-card__top">
        <span className="g-bed-card__number">{String(index + 1).padStart(2, '0')}</span>
        <StageBadge stage={bed.stage} />
      </span>
      <span className="g-bed-card__glyph"><GrowthGlyph stage={bed.stage} size={49} /></span>
      <span className="g-bed-card__title">{(bed.title)}</span>
      <span className="g-bed-card__blurb">{(bed.blurb)}</span>
      <span className="g-bed-card__meta">{lessons.length} {'notes'} · {done} {'read'}</span>
      <Meter value={percent} />
      <span className="g-bed-card__foot">
        <span>{lessons.slice(0, 2).map((lesson) => lesson.title).join(' · ')}</span>
        <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
      </span>
    </button>
  );
}

function GardenNoteCard({ lesson, navigate, feature = false }) {
  const bed = bedForLesson(lesson);
  const stage = stageForLesson(lesson);
  return (
    <button
      type="button"
      className={`g-note-card g-stage--${stage}${feature ? ' g-note-card--feature' : ''}`}
      onClick={() => navigate(`/learn/${lesson.id}`)}
    >
      <span className="g-note-card__art" aria-hidden="true">
        <GrowthGlyph stage={stage} size={feature ? 74 : 43} />
        <span>Note {lessonNumber(lesson)}</span>
      </span>
      <span className="g-note-card__top">
        <StageBadge stage={stage} />
        <span>{(bed?.short)} · {lesson.duration}</span>
      </span>
      <span className="g-note-card__title">{lesson.title}</span>
      <span className="g-note-card__deck">{plainWords[lesson.id] || lesson.intro}</span>
      <span className="g-note-card__read">{'Read the note'} <ArrowRight size={14} aria-hidden="true" /></span>
    </button>
  );
}

function GardenMapIntro({ navigate }) {
  return (
    <section className="g-map-intro" aria-labelledby="g-map-title">
      <div className="g-map-intro__copy">
        <p className="g-eyebrow">A map, not a ladder</p>
        <h2 id="g-map-title">Follow a bed.<br /><em>Or follow a question.</em></h2>
        <p>The course has a clear reading order, but curiosity rarely moves in a straight line. Start at the gate, return to your place, or wander into the bed that answers the question you have now.</p>
        <ol className="g-map-intro__steps">
          <li><span>01</span><div><b>Choose a bed</b><p>Each bed gathers the notes that belong together.</p></div></li>
          <li><span>02</span><div><b>Read a note</b><p>Short explanations, real examples, no filler.</p></div></li>
          <li><span>03</span><div><b>Run the program</b><p>The compiler answers. Your progress is kept in this browser.</p></div></li>
        </ol>
        <button type="button" className="g-text-link" onClick={() => navigate('/learn')}>Open the full garden index <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      <div className="g-map-intro__plot">
        <GardenPlot />
        <p className="g-caption">The garden is a reading map, not a checklist. Every bed is open.</p>
      </div>
    </section>
  );
}

function GardenShed({ navigate }) {
  return (
    <section className="g-shed" aria-labelledby="g-shed-title">
      <div className="g-shed__copy">
        <p className="g-eyebrow">{'The potting shed'}</p>
        <h2 id="g-shed-title">{'Try a sentence'}<br /><em>{'before you trust it.'}</em></h2>
        <p>This is the same compiler the lessons use. Change the greeting, press Run, and read the answer for yourself. Nothing is saved, so nothing can break.</p>
        <button type="button" className="g-text-link" onClick={() => navigate('/playground')}>{'Open the full playground'} <ArrowRight size={14} aria-hidden="true" /></button>
      </div>
      <div className="g-shed__bench">
        <GardenBench />
        <p className="g-caption">Programs stop after 3.5 seconds. Output is capped at 64 KB. File, network and process access are removed before execution.</p>
      </div>
    </section>
  );
}

function NoddingReader() {
  return (
    <video
      className="g-nod"
      src="/media/reading-loop.webm"
      poster="/media/reading-loop.png"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}

export function GardenHome({ progress, navigate }) {
  const next = nextLesson(progress);
  const done = progress.completedLessons.length;
  const started = done > 0;
  const featured = availableLessons.find((lesson) => lesson.id === 'records') || next;
  const second = availableLessons.find((lesson) => lesson.id === 'classes');
  const third = availableLessons.find((lesson) => lesson.id === 'toolchain');

  return (
    <div className="g-home">
      <div className="g-top-figure">
        <NoddingReader />
      </div>

      <section className="g-hero">
        <div className="g-hero__copy">
          <p className="g-kicker"><GardenMark size={15} /> {'An independent field guide to PlainScript 2.3.1'}</p>
          <h1>{'A garden for learning to '}<em>{'write plainly.'}</em></h1>
          <p className="g-hero__deck">{'PlainScript is a small, statically typed language that reads close to English. This is a place to learn it slowly: twenty-two notes, real programs, and a compiler that always answers honestly.'}</p>
          <div className="g-hero__actions">
            <button type="button" className="g-button g-button--primary" onClick={() => navigate(`/learn/${next.id}`)}>
              {(started ? 'Continue learning' : 'Begin at lesson 01')} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <a className="g-text-link" href="#garden" onClick={(event) => { event.preventDefault(); document.getElementById('garden')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {'Wander the garden'} <ArrowDown size={14} aria-hidden="true" />
            </a>
          </div>
          <p className="g-hero__meta">{availableLessons.length} notes · {BEDS.length} beds · no account · real compiler</p>
        </div>
        <GardenFieldNote navigate={navigate} />
      </section>

      <GardenHere progress={progress} navigate={navigate} />

      <section className="g-garden" id="garden" aria-labelledby="g-garden-title">
        <header className="g-section-head">
          <div>
            <p className="g-eyebrow">{'The garden'}</p>
            <h2 id="g-garden-title">{'Six beds,'}<br /><em>{'one growing course.'}</em></h2>
          </div>
          <div className="g-section-head__aside">
            <p>Every note is a short, complete read. The beds group related ideas so you can follow the path or go straight to what you need.</p>
            <button type="button" className="g-text-link" onClick={() => navigate('/learn')}>See all {availableLessons.length} notes <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </header>
        <div className="g-bed-grid">
          {BEDS.map((bed, index) => <BedCard key={bed.id} bed={bed} index={index} progress={progress} navigate={navigate} />)}
        </div>
        <div className="g-legend">
          <span className="g-eyebrow">{'Growth stages'}</span>
          {Object.entries(STAGES).map(([id, stage]) => (
            <span key={id} className={`g-legend__item g-stage--${id}`}><GrowthGlyph stage={id} size={16} /> <b>{stage.label}</b> {stage.description}</span>
          ))}
        </div>
      </section>

      <GardenMapIntro navigate={navigate} />

      <section className="g-notes" aria-labelledby="g-notes-title">
        <header className="g-section-head">
          <div>
            <p className="g-eyebrow">{'Freshly tended'}</p>
            <h2 id="g-notes-title">{'Notes worth'}<br /><em>{'opening today.'}</em></h2>
          </div>
          <div className="g-section-head__aside">
            <p>Start with the shape of data, then grow towards objects and a real toolchain.</p>
            <button type="button" className="g-text-link" onClick={() => navigate('/learn')}>Browse every note <ArrowRight size={14} aria-hidden="true" /></button>
          </div>
        </header>
        <div className="g-note-grid">
          <GardenNoteCard lesson={featured} navigate={navigate} feature />
          {second && <GardenNoteCard lesson={second} navigate={navigate} />}
          {third && <GardenNoteCard lesson={third} navigate={navigate} />}
          <aside className="g-quote">
            <GardenMark size={24} />
            <p>“Read the sentence. Then run it.”</p>
            <span>The classroom motto, kept in the potting shed.</span>
          </aside>
        </div>
      </section>

      <GardenShed navigate={navigate} />

      <section className="g-closing">
        <p className="g-eyebrow">{'There is no rush here'}</p>
        <h2>{'Start with one sentence.'}</h2>
        <p>The first note takes eight minutes. You will leave with a program that runs.</p>
        <button type="button" className="g-button g-button--primary" onClick={() => navigate('/learn/why-plainscript')}>
          {'Open the first note'} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Garden index
--------------------------------------------------------------------------- */

function IndexNote({ lesson, progress, navigate }) {
  const done = progress.completedLessons.includes(lesson.id);
  const stage = stageForLesson(lesson);
  return (
    <article className={`g-index-note g-stage--${stage}`}>
      <button type="button" onClick={() => navigate(`/learn/${lesson.id}`)}>
        <span className="g-index-note__no">{lessonNumber(lesson)}</span>
        <span className="g-index-note__body">
          <span className="g-index-note__top"><StageBadge stage={stage} /><span>Chapter {lesson.chapterNumber} · {lesson.duration}</span></span>
          <span className="g-index-note__title">{lesson.title}</span>
          <span className="g-index-note__deck">{lesson.intro}</span>
          <span className={`g-index-note__state${done ? ' is-done' : ''}`}>{(done ? 'Read' : 'Not yet read')} <i>·</i> {done ? 'return to this note' : 'open the note'}</span>
        </span>
        <ArrowUpRight className="g-index-note__arrow" size={18} strokeWidth={1.4} aria-hidden="true" />
        <span className="g-index-note__peek" aria-hidden="true">
          <b>In this note</b>
          <span>{lesson.objectives[0]}</span>
          <span className="g-index-note__peek-topics">{lessonTopics(lesson).join(' · ')}</span>
        </span>
      </button>
    </article>
  );
}

export function GardenIndex({ progress, navigate, initialBed = 'all', resetProgress }) {
  const [bedFilter, setBedFilter] = useState(BEDS.some((bed) => bed.id === initialBed) ? initialBed : 'all');
  const [stageFilter, setStageFilter] = useState('all');
  const done = progress.completedLessons.length;
  const percent = Math.round((done / availableLessons.length) * 100);

  useEffect(() => {
    setBedFilter(BEDS.some((bed) => bed.id === initialBed) ? initialBed : 'all');
  }, [initialBed]);

  const beds = BEDS.filter((bed) => (bedFilter === 'all' || bed.id === bedFilter)
    && (stageFilter === 'all' || bed.stage === stageFilter));
  const visibleCount = beds.reduce((total, bed) => total + lessonsForBed(bed).length, 0);

  return (
    <div className="g-index">
      <header className="g-index-head">
        <p className="g-eyebrow">Index of notes · {availableLessons.length}</p>
        <h1>{'The Garden'}</h1>
        <p className="g-index-head__deck">A collection of short PlainScript lessons, grouped into beds and always open. Read in order, or follow the question you have today.</p>
        <div className="g-index-head__meta">
          <div className="g-index-head__place">
            <span className="g-eyebrow">{'Your place'}</span>
            <b>{done} of {availableLessons.length} notes read</b>
          </div>
          <Meter value={percent} />
          <span>{percent}%</span>
          {done > 0 && resetProgress && <button type="button" className="g-text-link" onClick={resetProgress}>{'Reset progress'}</button>}
        </div>
      </header>

      <div className="g-filters" aria-label="Filter the garden">
        <div className="g-filter-row">
          <span className="g-eyebrow">{'Beds'}</span>
          <div className="g-filter-chips">
            <button type="button" className={bedFilter === 'all' ? 'is-on' : ''} aria-pressed={bedFilter === 'all'} onClick={() => setBedFilter('all')}>{'All'}</button>
            {BEDS.map((bed) => (
              <button key={bed.id} type="button" className={bedFilter === bed.id ? 'is-on' : ''} aria-pressed={bedFilter === bed.id} onClick={() => setBedFilter(bed.id)}>{(bed.short)}</button>
            ))}
          </div>
        </div>
        <div className="g-filter-row">
          <span className="g-eyebrow">{'Growth'}</span>
          <div className="g-filter-chips">
            <button type="button" className={stageFilter === 'all' ? 'is-on' : ''} aria-pressed={stageFilter === 'all'} onClick={() => setStageFilter('all')}>{'All stages'}</button>
            {Object.entries(STAGES).map(([id, stage]) => (
              <button key={id} type="button" className={stageFilter === id ? 'is-on' : ''} aria-pressed={stageFilter === id} onClick={() => setStageFilter(id)}>
                <GrowthGlyph stage={id} size={12} /> {(stage.label)}
              </button>
            ))}
          </div>
          <span className="g-filter-count">{visibleCount} notes in view</span>
        </div>
      </div>

      <div className="g-bed-list">
        {beds.map((bed) => {
          const lessons = lessonsForBed(bed);
          const read = lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
          return (
            <section className={`g-index-bed g-stage--${bed.stage}`} id={`bed-${bed.id}`} key={bed.id}>
              <header className="g-index-bed__head">
                <div>
                  <span className="g-index-bed__number">{String(BEDS.indexOf(bed) + 1).padStart(2, '0')}</span>
                  <StageBadge stage={bed.stage} />
                  <h2>{(bed.title)}</h2>
                  <p>{(bed.blurb)}</p>
                </div>
                <div className="g-index-bed__aside">
                  <GrowthGlyph stage={bed.stage} size={44} />
                  <span>{read} / {lessons.length} read</span>
                  <Meter value={Math.round((read / lessons.length) * 100)} />
                </div>
              </header>
              <div className="g-index-notes">
                {lessons.map((lesson) => <IndexNote key={lesson.id} lesson={lesson} progress={progress} navigate={navigate} />)}
              </div>
            </section>
          );
        })}
        {beds.length === 0 && (
          <div className="g-empty">
            <GardenMark size={34} />
            <h2>No beds are growing under those filters.</h2>
            <p>Try another growth stage, or return to the whole garden.</p>
            <button type="button" className="g-button g-button--small" onClick={() => { setBedFilter('all'); setStageFilter('all'); }}>Clear the filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Related notes on a lesson page
--------------------------------------------------------------------------- */

export function RelatedNotes({ lesson, navigate }) {
  const bed = bedForLesson(lesson);
  const notes = relatedLessons(lesson);
  if (!notes.length) return null;
  return (
    <section className="g-related" aria-labelledby="g-related-title">
      <header className="g-related__head">
        <div>
          <p className="g-eyebrow">Tended nearby</p>
          <h2 id="g-related-title">Notes that grow alongside this one.</h2>
        </div>
        {bed && <button type="button" className="g-text-link" onClick={() => navigate(`/learn?bed=${bed.id}`)}>See the {bed.short} bed <ArrowRight size={14} aria-hidden="true" /></button>}
      </header>
      <div className="g-related__grid">
        {notes.map((note) => {
          const stage = stageForLesson(note);
          return (
            <button key={note.id} type="button" className={`g-related-card g-stage--${stage}`} onClick={() => navigate(`/learn/${note.id}`)}>
              <span className="g-related-card__top"><StageBadge stage={stage} /><span>{lessonNumber(note)}</span></span>
              <span className="g-related-card__title">{note.title}</span>
              <span className="g-related-card__deck">{plainWords[note.id] || note.intro}</span>
              <span className="g-related-card__topics">{lessonTopics(note).slice(0, 3).join(' · ')}</span>
              <span className="g-related-card__read">{'Read the note'} <ArrowUpRight size={14} aria-hidden="true" /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
