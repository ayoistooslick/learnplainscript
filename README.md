# LearnPlainScript

LearnPlainScript is a free, interactive garden for learning PlainScript 2.3.1. It is built for someone starting from zero: read a short note in plain words, run a real program, answer one question, then follow the idea that interests you next.

No account, install, or prior coding experience is needed. Progress is saved in the browser.

## What the site does

- **A garden, not a dashboard.** Twenty-two notes are gathered into six reading beds: Roots & first words, Values & shapes, Structure & motion, Edges & failures, The wider platform, and New growth. The beds preserve the course's original chapter order while making it possible to browse by subject.
- **Content maturity is visible.** Seedling, Budding and Evergreen describe how settled a body of material is, not a learner's ability. Every bed and note carries its stage.
- **A clear way back in.** The header and menu always show the next unread note; the garden index and home page show current progress and a Continue action. Finished notes remain open to revisit.
- **Real execution.** Every runnable example calls `POST /api/run`, which compiles and executes the published `plainscript-lang@2.3.1` package in a short-lived child process. Nothing in the browser pretends to interpret PlainScript.
- **A teaching loop inside each lesson.** A plain-language explanation, a “guess the output” checkpoint checked against the real compiler, an editable specimen, a close-up of the words used, common mistakes, a practice challenge, and one multiple-choice check.
- **Lightweight navigation.** A sparse editorial header, a full section menu at every width, and a bottom tab bar on phones. Topic and growth filters update in place; the garden index also accepts `/learn?bed=<id>`.
- **A real instrument.** The playground keeps its CodeMirror editor, compiler diagnostics, editor shortcut, examples, loading states and output panel. On narrow screens the long specimen index becomes a compact native selector so the editor stays close at hand.

## Routes

- `/` — the front page: the garden's introduction, the learner's place, six bed previews, the garden map, selected notes, a live compiler bench, and the full invitation
- `/learn` — the garden index, with bed and growth-stage filters and contextual note previews
- `/learn?bed=roots` — any bed, addressable directly
- `/learn/:lesson` — lesson article, prediction, editable specimen, practice, check and related notes
- `/whiteboard` — the lecture board: stroke-by-stroke teaching, diagrams, markers, annotations and a compiler-backed specimen
- `/playground` — full editor with verified example programs
- `/quiz` — practice test, one question from every lesson
- `/projects` — three open-ended mini projects
- `/progress` — progress and per-lesson status

## Design — A garden for readable code

The visual language is an independent editorial garden: warm paper (`#F7F4EC`), dark ink (`#292820`), moss (`#486546`) and clay (`#A8492F`). Newsreader carries display and reading text, Lato handles interface labels, and IBM Plex Mono is reserved for code and folios. Fine rules, changing column widths, generous margins, hanging labels and small folios do the structural work.

The homepage is deliberately not a hero-and-feature-cards landing page. It opens with a field note and a real program, shows where the reader is, then lets the six beds, the illustrated plot, selected notes and a working bench carry the rest. The garden index groups notes into beds rather than a conventional documentation sidebar. Note cards have a short contextual preview on hover or keyboard focus, and related notes connect a lesson to nearby ideas.

Original inline SVG assets — the garden mark, growth glyphs and the winding plot — explain the course's organisation without using stock art. Lesson pages read as technical essays; interactive specimens use a restrained notebook-cell treatment. The menu includes a persistent day/night switch that follows the system preference on a first visit and remembers the reader's choice. The lecture board's stroke playback and all other transitions respect `prefers-reduced-motion`.

## Local development

Node.js 20 or newer is required.

```sh
npx -y pnpm@10.15.0 install --frozen-lockfile
npm run check:plain
npm run build
npm run dev
```

The production-style server listens on `http://localhost:3000` and serves the built `dist` directory. Rebuild after frontend edits; the development command does not hot-reload the client. The editor calls `POST /api/run`, which executes PlainScript with a timeout, an output cap and conservative import restrictions.

## Architecture

`src/` contains the React learning experience. `main.jsx` holds the shell, routes and older page-level tools; `garden.jsx` holds the garden model, reusable marks, header, drawer, tabs, footer, homepage, garden index, plot and related notes; `garden.css` is the visual layer loaded after the base stylesheet. `board.jsx` is the live lecture board, `editor.jsx` is CodeMirror 6 with a custom PlainScript tokenizer, autocomplete and compiler diagnostics, `interactive.jsx` contains the prediction and try-it lesson pieces, and `runner.jsx` is the client compiler boundary. The verified examples and curriculum live in `examples.js` and `content.js`.

`server/runner.js` is the shared server-side compiler boundary used by the local Express server and the Vercel function in `api/run.js`. `plainscript/` contains checked-in PlainScript source validated by the published compiler during `npm run check:plain`, which also executes every playground example.

Progress is stored in the browser under `learnplainscript.progress.v1`; whiteboard annotations use `learnplainscript.board.ink.v1`; the appearance choice uses `learnplainscript.theme.v1`.

The course follows the official PlainScript 2.3.1 repository, release notes, manual and standard-library documentation. The path includes verified 2.3 classes, generators, typed errors and toolchain concepts. Platform integrations such as files, JSON, HTTP, databases, packages and workers are taught as explicit runtime boundaries rather than invented browser-safe syntax.

## Deployment

Vercel is configured with `vercel.json` to build the Vite client, serve the SPA routes, and expose the compiler runner through the serverless function at `/api/run`. Connect the `ayoistooslick/learnplainscript` repository to Vercel and use the default Node 20 build environment.

The pre-garden snapshot and restoration commands are documented in [ROLLBACK.md](ROLLBACK.md).

## Attribution

Built by **Ayodele A. David** (`ayoistooslick`). PlainScript is an MIT-licensed language created by Ayodele Ayokunle David. This learning product is an independent project and is not affiliated with Learn JavaScript Online.
