import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  StreamLanguage,
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { setDiagnostics, lintGutter } from '@codemirror/lint';
import { tags } from '@lezer/highlight';

/* ------------------------------------------------------------------
   PlainScript language mode for CodeMirror 6.

   The grammar below mirrors src/highlight.jsx and the published 2.3.1
   language: block keywords, the readable 2.1 comparison phrases, 2.3
   class/generator keywords, and the standard-library names the course
   actually teaches. It is a tokenizer, not a second compiler, so the
   server remains the only authority on correctness.
------------------------------------------------------------------- */

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
const STDLIB = ['print', 'map', 'std/io', 'std/list'];

const plainscriptLanguage = StreamLanguage.define({
  name: 'plainscript',
  startState: () => ({}),
  languageData: { commentTokens: { line: '//' } },
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match('#')) { stream.skipToEnd(); return 'comment'; }
    if (stream.match('//')) { stream.skipToEnd(); return 'comment'; }
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return 'string';
    if (stream.match(/^'(?:[^'\\]|\\.)*'?/)) return 'string';
    if (stream.match(/^\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(PHRASES)) return 'keyword';
    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      const value = word[0];
      if (KEYWORDS.has(value)) return 'keyword';
      if (TYPES.has(value)) return 'typeName';
      if (stream.peek() === '(') return 'function';
      if (/^[A-Z]/.test(value)) return 'typeName';
      return 'variableName';
    }
    if (stream.match(/^[=+\-*/%<>!&|^~?:]+/)) return 'operator';
    stream.next();
    return 'punctuation';
  },
});

const plainHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#E8A97A', fontWeight: '500' },
  { tag: tags.typeName, color: '#C9AAFF' },
  { tag: tags.function(tags.variableName), color: '#9FC0FF' },
  { tag: tags.variableName, color: '#E8EFE6' },
  { tag: tags.string, color: '#A8D8A0' },
  { tag: tags.number, color: '#FFB08A' },
  { tag: tags.comment, color: '#7F8A82', fontStyle: 'italic' },
  { tag: tags.operator, color: '#D9E7D2' },
  { tag: tags.punctuation, color: '#AEB8B0' },
  { tag: tags.bool, color: '#E8A97A' },
]);

const classroomTheme = EditorView.theme({
  '&': { backgroundColor: '#1a1f1d', color: '#E8EFE6', fontSize: '0.85rem' },
  '.cm-content': {
    fontFamily: "'IBM Plex Mono', monospace",
    padding: '0.7rem 0',
    caretColor: '#C96442',
  },
  '.cm-scroller': { fontFamily: "'IBM Plex Mono', monospace", lineHeight: '1.55', overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: '#1a1f1d',
    color: '#6F7B73',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  '.cm-activeLine': { backgroundColor: 'rgba(217,231,210,0.045)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#D9E7D2' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(201,100,66,0.28) !important' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#C96442', borderLeftWidth: '2px' },
  '.cm-panels': { backgroundColor: '#151a18', color: '#E8EFE6' },
  '.cm-panels.cm-panels-top': { borderBottom: '1px solid rgba(255,255,255,0.08)' },
  '.cm-tooltip': {
    backgroundColor: '#252B29',
    color: '#E8EFE6',
    border: '1px solid rgba(255,255,255,0.14)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'rgba(201,100,66,0.34)', color: '#FFFFFF' },
  '.cm-diagnostic': { fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem' },
  '.cm-diagnostic-error': { borderLeft: '3px solid #C96442', paddingLeft: '0.7rem' },
  '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px wavy #C96442' },
}, { dark: true });

const completionOptions = [
  ...Array.from(KEYWORDS).map((label) => ({ label, type: 'keyword' })),
  ...Array.from(TYPES).map((label) => ({ label, type: 'type' })),
  ...STDLIB.map((label) => ({ label, type: 'function', detail: label.startsWith('std/') ? 'module' : 'standard library' })),
];

function plainscriptCompletions(context) {
  const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return { from: word.from, options: completionOptions, validFor: /^[A-Za-z_][A-Za-z0-9_]*$/ };
}

// Compiler messages come from the published toolchain. Map the line numbers
// it reports onto CodeMirror diagnostics so the error appears in the editor
// as well as in the output panel. When no line can be recovered, the output
// panel remains the complete record and the editor is left unmarked.
function buildDiagnostics(state, message) {
  if (!message || !String(message).trim()) return [];
  const text = String(message);
  const parsed = [];
  for (const line of text.split('\n')) {
    const match = /(?:[\w.-]*\.pln):(\d+)(?::(\d+))?/i.exec(line) || /line\s+(\d+)(?::(\d+))?/i.exec(line);
    if (!match) continue;
    const lineNumber = Number(match[1]);
    if (!Number.isFinite(lineNumber) || lineNumber < 1 || lineNumber > state.doc.lines) continue;
    const docLine = state.doc.line(lineNumber);
    parsed.push({
      from: docLine.from + Math.min(Math.max(Number(match[2] || 1) - 1, 0), Math.max(docLine.length - 1, 0)),
      to: docLine.to,
      severity: 'error',
      message: line.trim(),
    });
    if (parsed.length >= 6) break;
  }
  return parsed;
}

export function Editor({
  code,
  onChange,
  label = 'main.pln',
  minHeight,
  onRun,
  diagnostics = '',
  readOnly = false,
  placeholder = 'Write PlainScript…',
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const initialCode = useRef(code);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const state = EditorState.create({
      doc: initialCode.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        indentUnit.of('    '),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ override: [plainscriptCompletions], activateOnTyping: true }),
        rectangularSelection(),
        crosshairCursor(),
        EditorView.lineWrapping,
        classroomTheme,
        syntaxHighlighting(plainHighlight),
        plainscriptLanguage,
        lintGutter(),
        placeholderExtension(placeholder),
        keymap.of([
          { key: 'Mod-Enter', run: () => { onRunRef.current?.(); return true; } },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({
          'aria-label': 'PlainScript source editor',
          spellcheck: 'false',
          autocapitalize: 'off',
          autocomplete: 'off',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Keep the document in sync when the parent swaps specimens. User typing
  // already matches the prop, so this does not dispatch in the common case.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === code) return;
    view.dispatch({ changes: { from: 0, to: current.length, insert: code } });
  }, [code]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(setDiagnostics(view.state, buildDiagnostics(view.state, diagnostics)));
  }, [diagnostics]);

  return (
    <div className={`editor code-editor${minHeight ? ' has-height' : ''}`} style={minHeight ? { '--editor-h': minHeight } : undefined}>
      <div className="editor-head">
        <span className="editor-file">{label}</span>
        <span className="editor-lang">plainscript · 2.3.1</span>
      </div>
      <div className="cm-host" ref={hostRef} />
    </div>
  );
}
