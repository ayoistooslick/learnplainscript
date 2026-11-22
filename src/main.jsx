import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { availableLessons, chapters, flashcards, lessons, projects } from './content.js';
import './styles.css';

const STORAGE_KEY = 'learnplainscript.progress.v1';
const defaultProgress = {
  completedLessons: [],
  completedChallenges: [],
  quizScores: {},
  lastLesson: 'why-plainscript',
  flashcardIndex: 0,
  reviewedCards: [],
};

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);
  const update = (patch) => setProgress((current) => ({ ...current, ...patch }));
  const completeLesson = (id) => setProgress((current) => ({
    ...current,
    completedLessons: current.completedLessons.includes(id) ? current.completedLessons : [...current.completedLessons, id],
    lastLesson: id,
  }));
  const completeChallenge = (id) => setProgress((current) => ({
    ...current,
    completedChallenges: current.completedChallenges.includes(id) ? current.completedChallenges : [...current.completedChallenges, id],
  }));
  const saveQuiz = (id, score) => setProgress((current) => ({ ...current, quizScores: { ...current.quizScores, [id]: score } }));
  return { progress, update, completeLesson, completeChallenge, saveQuiz };
}

function routePath() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M4 9h11" /><path d="m10 4 5 5-5 5" /></>,
    check: <><path d="m4 9 3 3 7-7" /></>,
    play: <path d="m6 4 10 5-10 5V4Z" />,
    book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H17v14H6.5A2.5 2.5 0 0 0 4 18.5v-14Z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H17" /></>,
    grid: <><rect x="3" y="3" width="6" height="6" /><rect x="13" y="3" width="6" height="6" /><rect x="3" y="13" width="6" height="6" /><rect x="13" y="13" width="6" height="6" /></>,
    cards: <><rect x="5" y="3" width="12" height="15" rx="1" /><path d="M3 6v11a2 2 0 0 0 2 2h10" /></>,
    layers: <><path d="m3 8 8-5 8 5-8 5-8-5Z" /><path d="m3 12 8 5 8-5" /></>,
    menu: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
    close: <><path d="m5 5 14 14" /><path d="m19 5-14 14" /></>,
    external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0 2 5" /><path d="M20 4v7h-7" /></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo({ onNavigate }) {
  return <button className="wordmark" onClick={() => onNavigate('/')} aria-label="LearnPlainScript home"><span className="brand-mark">P</span><strong>LearnPlainScript</strong></button>;
}

function Button({ children, onClick, variant = 'secondary', icon, className = '', disabled = false }) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}{icon && <Icon name={icon} size={16} />}</button>;
}

function LandingPage({ onNavigate }) {
  return <div className="landing">
    <header className="landing-header page-width">
      <Logo onNavigate={onNavigate} />
      <nav className="landing-nav" aria-label="Main navigation">
        <button onClick={() => onNavigate('/learn')}>Curriculum</button>
        <button onClick={() => onNavigate('/projects')}>Projects</button>
        <button onClick={() => onNavigate('/flashcards')}>Flashcards</button>
      </nav>
      <Button variant="dark" onClick={() => onNavigate('/learn')} icon="arrow">Start learning</Button>
    </header>

    <main>
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> An interactive course for PlainScript 2.2</p>
          <h1>Read it.<br /><em>Run it.</em><br />Build with it.</h1>
          <p className="hero-lede">A practical path through PlainScript, the typed language that reads like structured English and compiles to the JavaScript platform.</p>
          <div className="hero-actions"><Button variant="dark" onClick={() => onNavigate('/learn')} icon="arrow">Start learning</Button><button className="text-link" onClick={() => onNavigate('/learn/first-program')}>Try the first lesson <Icon name="arrow" size={15} /></button></div>
          <div className="hero-note"><span>01</span><p>Short lessons, real compiler feedback, and projects that make the syntax stick.</p></div>
        </div>
        <div className="hero-code-wrap">
          <div className="plate-label">PLAIN / SCRIPT <span>02.2</span></div>
          <div className="hero-code code-window">
            <div className="window-bar"><span className="window-dots"><i /><i /><i /></span><span>hello.pln</span><span className="window-status">checked</span></div>
            <pre><code><span className="code-comment">#syntax 2.1</span>{'\n\n'}<span className="code-keyword">import</span> {'{ '}<span className="code-function">print</span>{' } '}<span className="code-keyword">from</span> <span className="code-string">"std/io"</span>{'\n\n'}<span className="code-keyword">define</span> <span className="code-function">greet</span>(name: <span className="code-type">text</span>) <span className="code-keyword">returns</span> <span className="code-type">text</span>{'\n'}    <span className="code-keyword">return</span> <span className="code-string">"Hello, {'{'}name{'}'}!"</span>{'\n'}<span className="code-keyword">end</span>{'\n\n'}<span className="code-function">print</span>(<span className="code-function">greet</span>(<span className="code-string">"world"</span>))</code></pre>
            <div className="code-output"><span>output</span><b>Hello, world!</b></div>
          </div>
          <div className="annotation annotation-one">structured<br />English</div>
          <div className="annotation annotation-two">ordinary<br />ES modules</div>
        </div>
      </section>

      <section className="manifesto page-width section-rule">
        <div className="section-kicker">01 / The course</div>
        <div className="manifesto-grid"><h2>Learn the language<br /><em>by using it.</em></h2><div><p>PlainScript is not JavaScript with a few renamed keywords. It has its own grammar, type checker, records, variants, optional values, native JSX, regular expressions, and bridges to other languages.</p><p>Each lesson keeps the explanation short, then puts the language in your hands. Read a pattern. Run it. Change it. Keep the useful part.</p><button className="text-link" onClick={() => onNavigate('/learn')}>See the learning path <Icon name="arrow" size={15} /></button></div></div>
      </section>

      <section className="feature-strip page-width">
        <Feature number="01" title="Read short lessons" text="Clear explanations that use the actual 2.1 vocabulary and verified 2.2 features." icon="book" />
        <Feature number="02" title="Run real code" text="The playground calls the published PlainScript compiler. Errors are part of the lesson." icon="play" />
        <Feature number="03" title="Keep the thread" text="Your progress stays in this browser, so you can leave and resume without an account." icon="layers" />
      </section>

      <section className="path-section page-width section-rule">
        <div className="section-kicker">02 / Learning path</div>
        <div className="path-heading"><h2>From first sentence<br /><em>to real boundaries.</em></h2><p>Twenty chapters are mapped to the PlainScript manual. The supported path is deep where the compiler is ready; future topics are named honestly.</p></div>
        <div className="chapter-preview">{chapters.slice(0, 6).map((chapter, index) => <div className="chapter-preview-row" key={chapter.number}><span>{chapter.number}</span><b>{chapter.title}</b><small>{chapter.lessons[0].comingSoon ? 'Coming soon' : `${chapter.lessons.length} lesson`}</small><i>{index < 2 ? 'Start here' : 'Available'}</i></div>)}</div>
        <div className="center-action"><Button onClick={() => onNavigate('/learn')} icon="arrow">Open the dashboard</Button></div>
      </section>

      <section className="developer-section page-width section-rule">
        <div className="section-kicker">03 / The developer</div>
        <div className="developer-grid"><div className="photo-placeholder"><span>PHOTO</span><small>PLACEHOLDER</small></div><div><h2>Made by<br /><em>Ayodele A. David.</em></h2><p>LearnPlainScript is an independent learning layer for the language and tools built by <a href="https://github.com/ayoistooslick" target="_blank" rel="noreferrer">ayoistooslick</a>. The course keeps the same editorial spirit as the PlainScript manual: clear writing, careful boundaries, and no invented runtime.</p><a className="text-link" href="https://ayo-portal.netlify.app" target="_blank" rel="noreferrer">Visit the portfolio <Icon name="external" size={14} /></a></div></div>
      </section>
    </main>
    <footer className="landing-footer page-width"><Logo onNavigate={onNavigate} /><span>PlainScript 2.2 / an independent learning platform</span><a href="https://github.com/ayoistooslick/plainscript" target="_blank" rel="noreferrer">Source of truth <Icon name="external" size={13} /></a></footer>
  </div>;
}

function Feature({ number, title, text, icon }) {
  return <article className="feature"><span className="feature-number">{number}</span><Icon name={icon} size={22} /><h3>{title}</h3><p>{text}</p></article>;
}

function AppShell({ onNavigate, children, currentPath, progress }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (path) => { onNavigate(path); setMobileOpen(false); };
  const completeCount = progress.completedLessons.length;
  const percent = Math.round((completeCount / availableLessons.length) * 100);
  return <div className="app-shell">
    <aside className={`course-sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-top"><Logo onNavigate={navigate} /><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
      <div className="sidebar-progress"><div className="progress-label"><span>Your progress</span><b>{percent}%</b></div><div className="progress-track"><i style={{ width: `${percent}%` }} /></div><small>{completeCount} of {availableLessons.length} lessons complete</small></div>
      <nav className="course-nav" aria-label="Course navigation">
        <p>Workspace</p>
        <NavItem active={currentPath === '/learn'} onClick={() => navigate('/learn')} icon="grid">Dashboard</NavItem>
        <NavItem active={currentPath === '/flashcards'} onClick={() => navigate('/flashcards')} icon="cards">Flashcards</NavItem>
        <NavItem active={currentPath === '/projects'} onClick={() => navigate('/projects')} icon="layers">Projects</NavItem>
        <p>Curriculum</p>
        {chapters.map((chapter) => <div key={chapter.number} className="sidebar-chapter"><span>{chapter.number}</span><b>{chapter.title}</b>{chapter.lessons.map((lesson) => <button key={lesson.id} className={`lesson-nav ${currentPath === `/learn/${lesson.id}` ? 'active' : ''} ${lesson.comingSoon ? 'soon' : ''}`} onClick={() => !lesson.comingSoon && navigate(`/learn/${lesson.id}`)} disabled={lesson.comingSoon}><i className={progress.completedLessons.includes(lesson.id) ? 'done' : ''}>{progress.completedLessons.includes(lesson.id) ? <Icon name="check" size={11} /> : ''}</i>{lesson.title}{lesson.comingSoon && <small>soon</small>}</button>)}</div>)}
      </nav>
      <div className="sidebar-foot"><span className="mini-mark">P</span><div><b>PlainScript 2.2</b><small>Independent language / MIT</small></div></div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="app-main"><header className="app-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open course navigation"><Icon name="menu" /></button><Logo onNavigate={navigate} /><nav className="app-nav"><button onClick={() => navigate('/learn')}>Course</button><button onClick={() => navigate('/flashcards')}>Flashcards</button><button onClick={() => navigate('/projects')}>Projects</button></nav><div className="header-actions"><span className="status-dot" /> Saved locally <button className="settings-button" onClick={() => setMobileOpen(true)}>Settings</button></div></header><div className="app-content">{children}</div><footer className="lesson-footer"><Button onClick={() => window.history.back()}>↩ Back</Button><Button variant="dark" onClick={() => onNavigate(currentPath === '/learn' ? `/learn/${availableLessons[0].id}` : '/learn')}>Next ↪</Button><button className="help-button">Help <span>?</span></button></footer></div>
  </div>;
}

function NavItem({ children, active, onClick, icon }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon name={icon} size={16} />{children}</button>;
}

function Dashboard({ progress, onNavigate }) {
  const nextLesson = availableLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) || availableLessons[availableLessons.length - 1];
  const percent = Math.round((progress.completedLessons.length / availableLessons.length) * 100);
  return <main className="dashboard page-inner"><div className="page-intro"><div><p className="eyebrow">Your workspace</p><h1>Keep the thread.</h1><p>Read a little, run something real, and leave a trace for the next session.</p></div><Button variant="dark" onClick={() => onNavigate(`/learn/${nextLesson.id}`)} icon="arrow">Continue learning</Button></div>
    <section className="dashboard-overview"><div className="overview-main"><div className="section-kicker">Current position</div><h2>{nextLesson.title}</h2><p>{nextLesson.intro}</p><div className="overview-meta"><span>{nextLesson.chapter}</span><i>·</i><span>{nextLesson.duration}</span><i>·</i><span>Lesson {String(availableLessons.indexOf(nextLesson) + 1).padStart(2, '0')}</span></div><Button onClick={() => onNavigate(`/learn/${nextLesson.id}`)} icon="arrow">Open lesson</Button></div><div className="overview-side"><div className="ring-progress"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" /><circle className="ring-value" cx="60" cy="60" r="50" style={{ strokeDashoffset: 314 - (314 * percent) / 100 }} /></svg><b>{percent}<small>%</small></b></div><span>Course progress</span><small>{progress.completedLessons.length} lessons complete</small></div></section>
    <div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">The route</p><h2>Learning path</h2></div><span>{chapters.length} chapters</span></div><div className="dashboard-chapters">{chapters.map((chapter) => { const chapterLessons = chapter.lessons.filter((lesson) => !lesson.comingSoon); const done = chapterLessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length; const available = chapterLessons.length > 0; return <button className={`dashboard-chapter ${done === chapterLessons.length && available ? 'complete' : ''}`} key={chapter.number} onClick={() => available && onNavigate(`/learn/${chapter.lessons[0].id}`)} disabled={!available}><span>{chapter.number}</span><div><b>{chapter.title}</b><small>{chapter.summary}</small></div><em>{available ? `${done}/${chapterLessons.length}` : 'soon'}</em><Icon name="arrow" size={15} /></button>; })}</div></section><aside className="dashboard-aside"><div className="aside-card accent-card"><p className="eyebrow">Compiler laboratory</p><h3>Errors are part of the lesson.</h3><p>Run a small PlainScript program through the published 2.2.0 compiler and change it until it works.</p><button className="text-link" onClick={() => onNavigate('/learn/first-program')}>Open playground <Icon name="arrow" size={14} /></button></div><div className="aside-card"><p className="eyebrow">Review</p><h3>Keep the syntax close.</h3><p>Seven flashcards are available from the start. Review the words that shape the language.</p><button className="text-link" onClick={() => onNavigate('/flashcards')}>Review flashcards <Icon name="arrow" size={14} /></button></div></aside></div>
  </main>;
}

function LessonPage({ lesson, progress, onNavigate, completeLesson, completeChallenge, saveQuiz }) {
  const lessonIndex = availableLessons.findIndex((item) => item.id === lesson.id);
  const previous = availableLessons[lessonIndex - 1];
  const next = availableLessons[lessonIndex + 1];
  const isComplete = progress.completedLessons.includes(lesson.id);
  return <main className="lesson-page page-inner"><div className="lesson-breadcrumb"><span>{lesson.chapterNumber} / {lesson.chapter}</span><span>{String(lessonIndex + 1).padStart(2, '0')} of {String(availableLessons.length).padStart(2, '0')}</span></div><div className="lesson-heading"><p className="eyebrow">Lesson {String(lessonIndex + 1).padStart(2, '0')}</p><h1>{lesson.title}</h1><p className="lesson-intro">{lesson.intro}</p><div className="lesson-tags"><span>{lesson.duration}</span><span>PlainScript 2.2</span><span>{isComplete ? 'Completed' : 'In progress'}</span></div></div><div className="lesson-layout"><article className="lesson-reading"><section><h2>What you will learn</h2><ul className="objective-list">{lesson.objectives.map((objective) => <li key={objective}><Icon name="check" size={15} />{objective}</li>)}</ul></section><section><p>{lesson.explanation}</p></section><section><h2>Syntax notes</h2><div className="syntax-notes">{lesson.syntax.map(([term, description]) => <div key={term}><code dangerouslySetInnerHTML={{ __html: highlightInline(term) }} /><span>{description}</span></div>)}</div></section><section><h2>Read the code</h2><CodeBlock code={lesson.example} /></section><section className="lesson-callout"><span className="callout-number">↳</span><div><b>Keep the boundary visible.</b><p>PlainScript checks the source before it runs. When a line feels unclear, give it a name or a type instead of hiding the decision.</p></div></section></article><aside className="lesson-practice"><Playground lesson={lesson} progress={progress} completeChallenge={completeChallenge} /><Quiz lesson={lesson} savedScore={progress.quizScores[lesson.id]} saveQuiz={saveQuiz} /></aside></div><div className="lesson-complete"><div><span className={isComplete ? 'complete-mark filled' : 'complete-mark'}>{isComplete && <Icon name="check" size={15} />}</span><div><b>{isComplete ? 'Lesson completed' : 'Finished reading?'}</b><small>{isComplete ? 'Your progress is saved in this browser.' : 'Mark this lesson complete when the idea feels clear.'}</small></div></div>{!isComplete && <Button variant="dark" onClick={() => completeLesson(lesson.id)} icon="check">Mark complete</Button>}</div><div className="lesson-nav-bottom"><Button disabled={!previous} onClick={() => previous && onNavigate(`/learn/${previous.id}`)}>← Previous</Button>{next ? <Button variant="dark" onClick={() => onNavigate(`/learn/${next.id}`)} icon="arrow">Next lesson</Button> : <Button variant="dark" onClick={() => onNavigate('/learn')} icon="arrow">Back to dashboard</Button>}</div></main>;
}

function highlightInline(text) {
  return text.replace(/`([^`]+)`/g, '<span>$1</span>');
}

function CodeBlock({ code }) {
  return <div className="code-block"><div className="code-block-head"><span>PlainScript</span><button onClick={() => navigator.clipboard?.writeText(code)}>Copy</button></div><pre><code>{code}</code></pre></div>;
}

function Playground({ lesson, progress, completeChallenge }) {
  const challenge = lesson.challenge;
  const [code, setCode] = useState(challenge?.starter || lesson.example);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(false);
  if (!challenge) return <div className="practice-card"><p className="eyebrow">Practice</p><h3>Something to learn will be coming soon.</h3></div>;
  const runnable = challenge.expectedOutput !== '';
  const done = progress.completedChallenges.includes(lesson.id);
  const run = async () => {
    setRunning(true); setResult(null);
    try {
      const response = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: code }) });
      const payload = await response.json();
      const normalized = (payload.output || '').trim().replace(/\s+/g, ' ');
      const expected = challenge.expectedOutput.trim().replace(/\s+/g, ' ');
      const passed = payload.ok && expected && normalized === expected;
      setResult({ ...payload, passed });
      if (passed) completeChallenge(lesson.id);
    } catch {
      setResult({ ok: false, error: 'The compiler service is not available right now.' });
    } finally { setRunning(false); }
  };
  return <div className="practice-card playground-card"><div className="practice-heading"><div><p className="eyebrow">Practice / compiler</p><h3>{done ? 'Challenge complete' : 'Change the code'}</h3></div><span className="practice-chip">2.2.0</span></div><p className="challenge-prompt">{challenge.prompt}</p><div className="editor"><div className="editor-head"><span>main.pln</span><span>PlainScript</span></div><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck="false" aria-label="PlainScript editor" /><div className="editor-foot"><button className="reset-button" onClick={() => { setCode(challenge.starter); setResult(null); }}><Icon name="refresh" size={13} /> Reset</button><Button variant="dark" onClick={run} disabled={running || !runnable} icon="play">{running ? 'Checking…' : runnable ? 'Run code' : 'Source exercise'}</Button></div></div>{hint && <div className="hint-box"><b>Hint</b><span>{challenge.hint}</span></div>}{!hint && <button className="hint-link" onClick={() => setHint(true)}>Need a hint?</button>}{result && <div className={`run-result ${result.passed ? 'passed' : result.ok ? 'ran' : 'failed'}`}><div><span>{result.passed ? 'Challenge passed' : result.ok ? 'Program output' : 'Compiler feedback'}</span><small>{result.durationMs ? `${result.durationMs}ms` : ''}</small></div><pre>{result.ok ? result.output || '(no output)' : result.error}</pre>{result.passed && <b className="result-note">Expected behaviour matched.</b>}</div>}</div>;
}

function Quiz({ lesson, savedScore, saveQuiz }) {
  const quiz = lesson.quiz;
  const [selected, setSelected] = useState(savedScore === undefined ? null : savedScore.answer);
  const [submitted, setSubmitted] = useState(savedScore !== undefined);
  if (!quiz) return null;
  const submit = () => { setSubmitted(true); saveQuiz(lesson.id, { answer: selected, correct: selected === quiz.answer }); };
  return <div className="practice-card quiz-card"><div className="practice-heading"><div><p className="eyebrow">Knowledge check</p><h3>One idea to keep</h3></div><span className="question-count">01 / 01</span></div><p className="quiz-question">{quiz.question}</p><div className="quiz-options">{quiz.options.map((option, index) => <button className={`${selected === index ? 'selected' : ''} ${submitted && index === quiz.answer ? 'correct' : ''} ${submitted && selected === index && index !== quiz.answer ? 'incorrect' : ''}`} key={option} onClick={() => !submitted && setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{!submitted ? <Button onClick={submit} disabled={selected === null}>Check answer</Button> : <div className={`quiz-feedback ${selected === quiz.answer ? 'correct' : 'incorrect'}`}><b>{selected === quiz.answer ? 'Correct.' : 'Not quite.'}</b><span>{quiz.explanation}</span>{selected !== quiz.answer && <button onClick={() => { setSubmitted(false); setSelected(null); }}>Try again</button>}</div>}</div>;
}

function FlashcardsPage({ progress, update }) {
  const index = progress.flashcardIndex % flashcards.length;
  const card = flashcards[index];
  const [revealed, setRevealed] = useState(false);
  const next = (delta) => { update({ flashcardIndex: (index + delta + flashcards.length) % flashcards.length, reviewedCards: progress.reviewedCards.includes(card.id) ? progress.reviewedCards : [...progress.reviewedCards, card.id] }); setRevealed(false); };
  return <main className="flashcards-page page-inner"><div className="page-intro"><div><p className="eyebrow">Review desk</p><h1>Keep the syntax close.</h1><p>Flip through the concepts you have met. The deck stays small on purpose.</p></div><span className="review-count">{progress.reviewedCards.length} / {flashcards.length} reviewed</span></div><div className="flashcard-layout"><div className={`flashcard ${revealed ? 'revealed' : ''}`} onClick={() => setRevealed(!revealed)} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && setRevealed(!revealed)}><div className="flashcard-top"><span>Card {String(index + 1).padStart(2, '0')}</span><span>{revealed ? 'Answer' : 'Question'}</span></div><div className="flashcard-body">{revealed ? <><p className="eyebrow">Answer</p><h2>{card.answer}</h2><span className="flip-label">Tap to see the question</span></> : <><p className="eyebrow">Question</p><h2>{card.question}</h2><span className="flip-label">Tap to reveal</span></>}</div></div><div className="flashcard-side"><p className="eyebrow">A small review loop</p><h3>Read it once. Recall it later.</h3><p>Mark a card as reviewed when you move on. Your place is saved locally, just like the course progress.</p><div className="flashcard-controls"><Button onClick={() => next(-1)}>← Previous</Button><Button variant="dark" onClick={() => next(1)} icon="arrow">Next card</Button></div></div></div><div className="flashcard-dots">{flashcards.map((item, cardIndex) => <button key={item.id} className={cardIndex === index ? 'active' : ''} onClick={() => { update({ flashcardIndex: cardIndex }); setRevealed(false); }} aria-label={`Open card ${cardIndex + 1}`} />)}</div></main>;
}

function ProjectsPage({ onNavigate }) {
  return <main className="projects-page page-inner"><div className="page-intro"><div><p className="eyebrow">Practical work</p><h1>Make something small.</h1><p>Projects are deliberately scoped. They ask you to combine a few ideas instead of hiding the language under a framework.</p></div><Button variant="dark" onClick={() => onNavigate('/learn/first-program')} icon="arrow">Warm up first</Button></div><div className="projects-list">{projects.map((project) => <article className="project-card" key={project.id}><div className="project-number">{project.number}</div><div className="project-main"><div className="project-meta"><span>{project.level}</span><i>·</i><span>{project.concepts.join(' / ')}</span></div><h2>{project.title}</h2><p>{project.description}</p><div className="project-columns"><div><b>Requirements</b><ul>{project.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div><div><b>Start here</b><p>{project.starting}</p></div><div><b>Completion criteria</b><p>{project.criteria}</p></div></div></div><Icon name="arrow" size={18} /></article>)}</div></main>;
}

function ComingSoon({ onNavigate }) {
  return <main className="empty-state page-inner"><span className="mini-mark">P</span><p className="eyebrow">Chapter ahead</p><h1>Something to learn<br /><em>will be coming soon.</em></h1><p>This part of the curriculum is mapped, but it is not filled with invented syntax. Continue with the supported path while the compiler and examples catch up.</p><Button variant="dark" onClick={() => onNavigate('/learn')} icon="arrow">Back to dashboard</Button></main>;
}

function NotFound({ onNavigate }) {
  return <main className="empty-state page-inner"><p className="eyebrow">404 / Not found</p><h1>That page moved.</h1><p>Choose a lesson from the course rail or return to your dashboard.</p><Button variant="dark" onClick={() => onNavigate('/learn')} icon="arrow">Open dashboard</Button></main>;
}

function App() {
  const [path, setPath] = useState(routePath);
  const { progress, update, completeLesson, completeChallenge, saveQuiz } = useProgress();
  useEffect(() => { const onPopState = () => setPath(routePath()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState); }, []);
  const navigate = (nextPath) => { window.history.pushState({}, '', nextPath); setPath(nextPath); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  if (path === '/') return <LandingPage onNavigate={navigate} />;
  let page;
  if (path === '/learn') page = <Dashboard progress={progress} onNavigate={navigate} />;
  else if (path === '/flashcards') page = <FlashcardsPage progress={progress} update={update} />;
  else if (path === '/projects') page = <ProjectsPage onNavigate={navigate} />;
  else if (path.startsWith('/learn/')) {
    const id = path.split('/')[2];
    const lesson = lessons.find((item) => item.id === id);
    page = !lesson ? <NotFound onNavigate={navigate} /> : lesson.comingSoon ? <ComingSoon onNavigate={navigate} /> : <LessonPage lesson={lesson} progress={progress} onNavigate={navigate} completeLesson={completeLesson} completeChallenge={completeChallenge} saveQuiz={saveQuiz} />;
  } else page = <NotFound onNavigate={navigate} />;
  return <AppShell onNavigate={navigate} currentPath={path} progress={progress}>{page}</AppShell>;
}

createRoot(document.getElementById('root')).render(<App />);
