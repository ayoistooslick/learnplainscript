# LearnPlainScript

LearnPlainScript is a practical, interactive course for PlainScript 2.3.1. It is built around a simple loop: read a short explanation, run real PlainScript, solve a small challenge, and keep moving.

The app includes a branded landing page, a connected curriculum dashboard, lesson pages, multiple-choice checks, coding challenges, a compiler-backed playground, flashcards, practical projects, and anonymous local progress persistence. No account is needed to begin.

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

`src/` contains the React learning experience and curriculum data. `server/runner.js` is the shared compiler boundary used by the local Express server and the Vercel function in `api/run.js`. `plainscript/` contains checked-in PlainScript source that is validated by the published 2.3.1 compiler during `npm run check:plain`. Anonymous progress is stored in the browser under `learnplainscript.progress.v1` so account synchronization can be added later without changing the learning model.

The course content is based on the official PlainScript 2.3.1 repository, release notes, manual, and standard-library documentation. The current path includes verified 2.3 classes, generators, typed errors, and toolchain concepts. Platform integrations such as files, JSON, HTTP, databases, packages, and workers are taught as explicit runtime boundaries rather than with invented browser-safe syntax.

## Deployment

Vercel is configured with `vercel.json` to build the Vite client, serve the SPA routes, and expose the compiler runner through the serverless function at `/api/run`. Connect the `ayoistooslick/learnplainscript` GitHub repository to Vercel and use the default Node 20 build environment.

## Attribution

Built by **Ayodele A. David** (`ayoistooslick`). PlainScript is an MIT-licensed language created by Ayodele Ayokunle David. This learning product is an independent project and is not affiliated with Learn JavaScript Online.
