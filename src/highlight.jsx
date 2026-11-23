import React, { useState } from 'react';

const KEYWORDS = new Set([
  'import', 'from', 'export', 'define', 'end', 'value', 'set', 'to', 'change',
  'when', 'otherwise', 'return', 'returns', 'for', 'each', 'in', 'while',
  'match', 'case', 'try', 'catch', 'finally', 'throw', 'throws', 'class',
  'extends', 'new', 'this', 'super', 'static', 'readonly', 'async', 'await',
  'yield', 'generator', 'function', 'let', 'const', 'type', 'of', 'nothing',
  'true', 'false', 'break', 'continue', 'and', 'or', 'not', 'as', 'is',
]);

const TYPES = new Set([
  'number', 'text', 'boolean', 'list', 'record', 'any', 'void', 'unknown',
  'bigint', 'never', 'optional', 'iterator',
]);

const PHRASES = /^(?:is equal to|is not equal to|is at least|is at most|is greater than|is less than|is not|for each|not equal to)\b/;

function push(tokens, type, value) {
  if (!value) return;
  const last = tokens[tokens.length - 1];
  if (last && last.type === type && type === 'plain') last.value += value;
  else tokens.push({ type, value });
}

export function tokenize(code) {
  const tokens = [];
  let index = 0;
  while (index < code.length) {
    const rest = code.slice(index);
    let match;
    if ((match = /^#[^\n]*/.exec(rest))) {
      push(tokens, 'com', match[0]);
    } else if ((match = /^\/\/[^\n]*/.exec(rest))) {
      push(tokens, 'com', match[0]);
    } else if ((match = /^"(?:[^"\\\n]|\\.)*"?/.exec(rest)) || (match = /^'(?:[^'\\\n]|\\.)*'?/.exec(rest))) {
      push(tokens, 'str', match[0]);
    } else if ((match = /^\d+(?:\.\d+)?/.exec(rest))) {
      push(tokens, 'num', match[0]);
    } else if ((match = PHRASES.exec(rest))) {
      push(tokens, 'kw', match[0]);
    } else if ((match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest))) {
      const word = match[0];
      const after = rest.slice(word.length);
      if (KEYWORDS.has(word)) push(tokens, 'kw', word);
      else if (TYPES.has(word)) push(tokens, 'type', word);
      else if (/^\s*\(/.test(after)) push(tokens, 'fn', word);
      else if (/^[A-Z]/.test(word)) push(tokens, 'type', word);
      else push(tokens, 'plain', word);
    } else if ((match = /^\s+/.exec(rest))) {
      push(tokens, 'plain', match[0]);
    } else {
      push(tokens, 'plain', rest[0]);
      match = [rest[0]];
    }
    index += match[0].length;
  }
  return tokens;
}

export function Tokens({ code }) {
  return tokenize(code).map((token, index) => (
    token.type === 'plain'
      ? <React.Fragment key={index}>{token.value}</React.Fragment>
      : <span key={index} className={`tok-${token.type}`}>{token.value}</span>
  ));
}

export function Inline({ text }) {
  const parts = String(text ?? '').split(/(`[^`]+`)/g);
  return parts.map((part, index) => (
    part.startsWith('`') && part.endsWith('`') && part.length > 2
      ? <code key={index}>{part.slice(1, -1)}</code>
      : <React.Fragment key={index}>{part}</React.Fragment>
  ));
}

export function CodeSpecimen({ code, label = 'plainscript', file = 'specimen.pln', className = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={`specimen-code ${className}`}>
      <div className="specimen-bar">
        <span className="specimen-lang">{label}</span>
        <span className="specimen-file">{file}</span>
        <button type="button" className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="specimen-pre"><code><Tokens code={code} /></code></pre>
    </div>
  );
}
