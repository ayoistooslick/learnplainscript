# LearnPlainScript

LearnPlainScript is a free, interactive classroom for PlainScript 2.3.1. It is built for someone starting from zero: read a short explanation in plain words, run a real program, answer one question, then move to the next lesson.

No account, install, or prior coding experience is needed. Progress is saved in the browser.

## What the site does

- **One clear path.** 22 lessons in reading order, with the next lesson always marked and one button that continues where you stopped.
- **Real execution.** Every runnable example calls `POST /api/run`, which compiles and executes the published `plainscript-lang@2.3.1` package in a short-lived child process. Nothing in the browser pretends to interpret PlainScript.
- **A teaching loop inside each lesson.** A plain-language explanation, a "guess the output" checkpoint checked against the real compiler, an editable specimen, a close-up of the words used, common mistakes, a practice challenge, and one multiple-choice check.
- **Beginner-friendly navigation.** Five main rooms (Start, Lessons, Whiteboard, Code playground, Practice test) plus progress and mini projects. On phones there is a bottom tab bar and a working slide-out menu.
- **Four hand-drawn illustrations** in `public/art/` that follow the paper-and-ink classroom theme and show a student at work.

## Routes

- `/` — start page: what the course is, how a lesson works, a live first program, and the path
- `/learn` — all lessons, with finished ones ticked
- `/learn/:lesson` — lesson article, prediction, editable specimen, practice and check
- `/whiteboard` — live classroom board with stroke-by-stroke teaching, diagrams, markers and annotations
- `/playground` — full editor with verified example programs
- `/quiz` — practice test, one question from every lesson
- `/projects` — three open-ended mini projects
- `/progress` — progress and per-lesson status

## Design

Warm paper-and-ink palette (`#F5F0E6` paper, `#25231F` ink, `#252B29` chalkboard, `#E6D6BB` notebook, `#D9E7D2` highlight, `#C96442` accent) with Fraunces, Newsreader, Space Grotesk, IBM Plex Mono and Caveat. Motion is minimal and respects `prefers-reduced-motion`.

## Local development

Node.js 20 or newer is required.

```sh
npm install
npm run check:plain
npm run build
npm run dev
```

The production-style server listens on `http://localhost:3000`. The editor calls `POST /api/run`, which executes PlainScript with a timeout, an output cap and conservative import restrictions.

## Architecture

`src/` contains the React learning experience: `main.jsx` (shell, routes and pages), `board.jsx` (live board), `editor.jsx` (CodeMirror 6 with a custom PlainScript tokenizer, autocomplete and compiler diagnostics), `interactive.jsx` (predict and try-it lesson pieces), `runner.jsx` (client compiler boundary), the PlainScript highlighter, the verified playground examples and the curriculum data. `server/runner.js` is the shared server-side compiler boundary used by the local Express server and the Vercel function in `api/run.js`. `plainscript/` contains checked-in PlainScript source validated by the published compiler during `npm run check:plain`, which also executes every playground example.

Progress is stored in the browser under `learnplainscript.progress.v1`; whiteboard annotations use `learnplainscript.board.ink.v1`.

The course follows the official PlainScript 2.3.1 repository, release notes, manual and standard-library documentation. The path includes verified 2.3 classes, generators, typed errors and toolchain concepts. Platform integrations such as files, JSON, HTTP, databases, packages and workers are taught as explicit runtime boundaries rather than invented browser-safe syntax.

## Deployment

Vercel is configured with `vercel.json` to build the Vite client, serve the SPA routes, and expose the compiler runner through the serverless function at `/api/run`. Connect the `ayoistooslick/learnplainscript` repository to Vercel and use the default Node 20 build environment.

## Attribution

Built by **Ayodele A. David** (`ayoistooslick`). PlainScript is an MIT-licensed language created by Ayodele Ayokunle David. This learning product is an independent project and is not affiliated with Learn JavaScript Online.
