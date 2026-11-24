import React, { useCallback, useState } from 'react';

// The only execution path in the application. Every run goes to /api/run,
// which invokes the published plainscript-lang@2.3.1 compiler in a
// short-lived child process. Nothing in the browser pretends to interpret
// PlainScript.
export function useRunner() {
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
  const reset = useCallback(() => setResult({ status: 'idle', output: '', error: '', duration: 0 }), []);
  return { result, run, reset };
}

export function Output({ result, compact = false }) {
  const running = result.status === 'running';
  return (
    <div className={`output is-${result.status}`} aria-live="polite">
      <div className="output-bar">
        <span>stdout</span>
        <span>{running ? 'compiling…' : result.status === 'ok' ? `exit 0 · ${result.duration}ms` : result.status === 'error' ? 'exit 1' : 'idle'}</span>
      </div>
      {result.status === 'idle' && <p className="output-empty">Run the program to read its output.</p>}
      {running && <p className="output-empty">Calling the published 2.3.1 compiler…</p>}
      {result.status === 'ok' && (
        <>
          <pre className="output-body">{result.output || 'The program finished without printing anything.'}</pre>
          {result.error && <pre className="output-diagnostics">{result.error}</pre>}
        </>
      )}
      {result.status === 'error' && <pre className="output-body output-error">{result.error}</pre>}
      {!compact && result.status !== 'idle' && <div className="output-foot">executed in a short-lived child process · output bounded</div>}
    </div>
  );
}
