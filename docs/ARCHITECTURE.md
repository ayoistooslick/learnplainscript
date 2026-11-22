# Architecture

LearnPlainScript is intentionally split into a readable client and a narrow execution boundary.

The Vite/React client owns the course shell, curriculum data, lesson layout, localStorage progress model, quizzes, flashcards, and projects. It does not invent a server-side account system for anonymous learners.

The Express server owns `/api/run`. It writes a submitted PlainScript program to a temporary file and invokes the `plainscript-lang@2.2.0` CLI in a short-lived child process. Source size, output size, imports, and execution time are bounded. Vercel uses the same runner through `api/run.js`.

The `plainscript/` directory is a first-class source area. It is validated by `npm run check:plain` and documents the project’s use of the actual compiler rather than a fake output simulator.
