# LearnPlainScript

LearnPlainScript is a practical, interactive course for PlainScript 2.3.1. It is built around a simple loop: read a short explanation, run real PlainScript, solve a small challenge, and keep moving.

The app includes an editorial cover, a curriculum index, lesson articles, multiple-choice checks, an examination, a compiler-backed playground, revision cards, practical commissions, and anonymous local progress persistence. No account is needed to begin.

## Design

The visual identity is reconstructed from the official [PlainScript manual](https://ayoistooslick.github.io/plainscript/) and its source in `docs/index.html`, `docs/style.css` and `docs/assets/`. LearnPlainScript uses the same palette (`#08070b` void, `#f2eee7` bone, `#a679ff` violet, `#ff6a3d` ember, `#d8f26b` acid), the same four typefaces (Fraunces, Newsreader, Space Grotesk, IBM Plex Mono), the same editorial grid, numbered sections, figure captions, thin rules and restrained motion.

Five halftone plates are reused from the manual under its MIT licence; three new plates (voice, printed sheet, letterpress sort) were made for this course in the same riso and duotone direction. They live in `public/plates/`.

## Routes

- `/` — cover and masthead
- `/learn` — curriculum, progress and chapter index
- `/learn/:lesson` — lesson article, specimen, practice and check
- `/playground` — full editor with nine verified specimens
- `/quiz` — the examination, one question from every lesson
- `/flashcards` — revision deck
- `/projects` — three practical commissions

## Local development

Node.js 20 or newer is required.

```sh
npm install
npm run check:plain
npm run build
npm run dev
```

The production-style server listens on `http://localhost:3000`. The playground calls `POST /api/run` and executes `plainscript-lang@2.3.1` in a short-lived child process with a timeout, output cap, and conservative import restrictions.

## Architecture

`src/` contains the React learning experience, the PlainScript syntax highlighter, the verified playground specimens and the curriculum data. `server/runner.js` is the shared compiler boundary used by the local Express server and the Vercel function in `api/run.js`. `plainscript/` contains checked-in PlainScript source that is validated by the published 2.3.1 compiler during `npm run check:plain`, which also executes every playground specimen. Anonymous progress is stored in the browser under `learnplainscript.progress.v1` so account synchronization can be added later without changing the learning model.

The course content is based on the official PlainScript 2.3.1 repository, release notes, manual, and standard-library documentation. The current path includes verified 2.3 classes, generators, typed errors, and toolchain concepts. Platform integrations such as files, JSON, HTTP, databases, packages, and workers are taught as explicit runtime boundaries rather than with invented browser-safe syntax.

## Deployment

Vercel is configured with `vercel.json` to build the Vite client, serve the SPA routes, and expose the compiler runner through the serverless function at `/api/run`. Connect the `ayoistooslick/learnplainscript` GitHub repository to Vercel and use the default Node 20 build environment.

## Attribution

Built by **Ayodele A. David** (`ayoistooslick`). PlainScript is an MIT-licensed language created by Ayodele Ayokunle David. This learning product is an independent project and is not affiliated with Learn JavaScript Online.
