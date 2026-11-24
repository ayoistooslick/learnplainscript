# LearnPlainScript

LearnPlainScript is a free, interactive classroom for PlainScript 2.3.1. It is built for someone starting from zero: read a short explanation in plain words, run a real program, answer one question, then move to the next lesson.

No account, install, or prior coding experience is needed. Progress is saved in the browser.

## What the site does

- **One clear path.** 22 lessons in reading order, with the next lesson always marked and one button that continues where you stopped.
- **Real execution.** Every runnable example calls `POST /api/run`, which compiles and executes the published `plainscript-lang@2.3.1` package in a short-lived child process. Nothing in the browser pretends to interpret PlainScript.
- **A teaching loop inside each lesson.** A plain-language explanation, a "guess the output" checkpoint checked against the real compiler, an editable specimen, a close-up of the words used, common mistakes, a practice challenge, and one multiple-choice check.
- **Beginner-friendly navigation.** An editorial masthead and section navigation for the front page, lessons, lecture board, playground, practice test, projects and progress. On phones there is a bottom tab bar and a working slide-out menu.
- **Halftone editorial plates** in `public/art/`, including an original letterpress type-case illustration, treated as printed matter rather than decorative 3D objects.

## Routes

- `/` — start page: what the course is, how a lesson works, a live first program, and the path
- `/learn` — all lessons, with finished ones ticked
- `/learn/:lesson` — lesson article, prediction, editable specimen, practice and check
- `/whiteboard` — the lecture board: stroke-by-stroke teaching, diagrams, markers, annotations and a compiler-backed specimen
- `/playground` — full editor with verified example programs
- `/quiz` — practice test, one question from every lesson
- `/projects` — three open-ended mini projects
- `/progress` — progress and per-lesson status

## Design — The Classroom Edition

The interface is built as a twentieth-century editorial publication that happens to teach programming. Warm ivory paper (`#F2EBDD`), near-black ink (`#17130E`) and a muted oxblood accent (`#7A1F2B`) carry the hierarchy; fine rules, asymmetric columns, drop caps, pull quotes and folios do the structural work. Fraunces sets the masthead and display headlines, Newsreader carries the reading text, Space Grotesk is reserved for interface labels, and IBM Plex Mono handles code and folios. Subtle CSS paper grain and halftone plates supply tactility without shadows or glass.

Lesson pages are typeset as technical articles with a margin column, then become notebook cells for the interactive parts. Code cells use a Jupyter-like `In [ ]` / `Out [ ]` gutter, warm paper editor surfaces, restrained syntax colour and clear run controls. The old 3D room and decorative motion are gone; only the lecture board's meaningful stroke playback remains, and it respects `prefers-reduced-motion`. The layout reflows deliberately at tablet and phone widths rather than shrinking the broadsheet.

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
