import React, { useEffect, useState } from 'react';
import { Check, Play, RotateCcw } from 'lucide-react';
import { Editor } from './editor.jsx';
import { Output, useRunner } from './runner.jsx';
import { Inline } from './highlight.jsx';

const normalise = (value) => String(value || '').trim().replace(/\s+/g, ' ');

/* An editable specimen inside the lesson. The learner changes the program
   and runs the same verified compiler as the playground; when the lesson has
   a published expected output, the result is compared against it. */
export function TryIt({ lesson }) {
  const [code, setCode] = useState(lesson.example);
  const [verdict, setVerdict] = useState(null);
  const { result, run, reset } = useRunner();

  useEffect(() => {
    setCode(lesson.example);
    setVerdict(null);
    reset();
  }, [lesson.id, lesson.example, reset]);

  const execute = async () => {
    const payload = await run(code);
    if (!payload?.ok) { setVerdict(null); return; }
    setVerdict(normalise(payload.output) === normalise(lesson.expectedOutput));
  };

  return (
    <div className="tryit">
      <div className="tryit-head">
        <span className="tryit-label">Editable specimen</span>
        <span className="tryit-note">Change a line, then run it against plainscript-lang 2.3.1.</span>
      </div>
      <Editor
        code={code}
        onChange={setCode}
        label={`${lesson.id}.pln`}
        minHeight="270px"
        onRun={execute}
        diagnostics={result.status === 'error' ? result.error : ''}
        placeholder="Change the specimen here…"
      />
      <div className="tryit-actions">
        <button type="button" className="btn-solid small" onClick={execute} disabled={result.status === 'running'}>
          <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run program'}
        </button>
        <button type="button" className="icon-btn" onClick={() => { setCode(lesson.example); setVerdict(null); reset(); }} aria-label="Reset the specimen">
          <RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <span className="tryit-shortcut">⌘/Ctrl + Enter</span>
        {verdict !== null && (
          <span className={`tryit-verdict ${verdict ? 'is-match' : 'is-different'}`}>
            {verdict ? <><Check size={12} strokeWidth={2.5} aria-hidden="true" /> matches the lesson’s expected output</> : 'This output differs from the lesson’s expected output'}
          </span>
        )}
      </div>
      <Output result={result} compact />
      {lesson.expectedOutput && (
        <p className="tryit-expected">
          Expected output: <code>{lesson.expectedOutput}</code>
        </p>
      )}
    </div>
  );
}

/* A question asked mid-explanation: commit to an answer before the compiler
   reveals the truth. The comparison uses the real program output, so the
   checkpoint cannot drift away from the language. */
export function PredictRun({ lesson }) {
  const [guess, setGuess] = useState('');
  const [check, setCheck] = useState(null);
  const { result, run, reset } = useRunner();

  useEffect(() => { setGuess(''); setCheck(null); reset(); }, [lesson.id, reset]);

  const execute = async () => {
    const payload = await run(lesson.example);
    if (!payload?.ok) { setCheck(null); return; }
    setCheck({
      matches: normalise(payload.output) === normalise(guess),
      actual: payload.output,
    });
  };

  return (
    <div className="predict">
      <div className="predict-head">
        <span className="predict-label">Stop and predict</span>
        <span className="predict-question">Before you run the specimen, what will it print?</span>
      </div>
      <label className="predict-field">
        <span className="sr-only">Your predicted output</span>
        <textarea
          value={guess}
          onChange={(event) => { setGuess(event.target.value); setCheck(null); }}
          rows={2}
          placeholder="Type the output exactly as you expect it…"
          spellCheck="false"
        />
      </label>
      <div className="predict-actions">
        <button type="button" className="btn-line small" onClick={execute} disabled={!guess.trim() || result.status === 'running'}>
          <Play size={12} strokeWidth={2.2} aria-hidden="true" /> {result.status === 'running' ? 'Running…' : 'Run and compare'}
        </button>
        <button type="button" className="link-quiet" onClick={() => { setGuess(''); setCheck(null); reset(); }}>Clear</button>
      </div>
      {result.status === 'error' && <p className="predict-error"><Inline text="The compiler needs a runnable program here. Read the diagnostic below." /></p>}
      <Output result={result} compact />
      {check && (
        <div className={`predict-result ${check.matches ? 'is-match' : 'is-different'}`}>
          <b>{check.matches ? 'Your prediction matches the compiler.' : 'Not the output the compiler produced.'}</b>
          {!check.matches && <p>The program printed: <code>{check.actual || '(nothing)'}</code></p>}
        </div>
      )}
    </div>
  );
}
