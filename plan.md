# LearnPlainScript implementation plan

## Scope

Build a focused, production-ready learning platform for PlainScript 2.3.1. The first release prioritizes the complete learner loop over breadth: a branded landing page, curriculum dashboard, accurate starter lessons, lesson reading, a real compiler-backed playground, quizzes, coding challenges, flashcards, practical projects, anonymous local persistence, responsive navigation, and deployable Vercel serving.

The curriculum will be intentionally complete in structure but deep in the supported starter path. Supported lessons cover the language surface that is verified in the PlainScript 2.3.1 repository and package: syntax, values, functions, conditions, records, lists, modules, optional values, async, regex, JSX/React, JavaScript interoperability, and bridges. Later roadmap topics are clearly marked "Something to learn will be coming soon." rather than filled with invented syntax.

## Implementation approach

Use a small Vite + React client with an Express server. React handles navigation and the responsive lesson/editor UI. The server exposes `POST /api/run` and executes the published `plainscript-lang@2.3.1` CLI in a short-lived child process with a temporary file, a 3.5 second timeout, a 64 KB output cap, and a non-production-safe code policy that rejects obvious filesystem/network/process imports. This keeps the compiler real while avoiding privileged in-process execution. The client stores anonymous progress in `localStorage`; the data shape is isolated so account sync can be added later without changing UI contracts.

PlainScript is included as a first-class source area under `plainscript/`. The app's challenge examples and compiler validation use the published package directly. A small PlainScript utility is checked in and exercised in tests to demonstrate the language's actual syntax and compiler path without pretending that the React boundary is PlainScript-native.

## Project structure

- `src/`: React app, routes, curriculum data, progression state, lesson/challenge/flashcard UI, and styling.
- `server/`: Express production server and compiler-backed execution endpoint.
- `plainscript/`: PlainScript source used for compiler validation and examples.
- `scripts/`: deterministic content/compiler checks.
- `public/`: route manifest and static metadata.
- `tests/`: Node tests for content integrity and server behavior.

## Design direction

- **Design movement:** editorial technical manual with a dark workshop surface and print-like violet/orange annotation. Probability 0.06.
- **Design movement:** quiet Swiss learning dashboard with bright white panels. Probability 0.07.
- **Design movement:** neon developer SaaS with gradient cards and dense chrome. Probability 0.04.

Chosen direction: editorial technical manual.

- **Core principles:** precise, readable, practice-first, and visibly authored.
- **Color philosophy:** near-black ink and warm paper surfaces keep code and lessons calm; PlainScript violet marks language identity, while orange is reserved for progress and interactive emphasis.
- **Layout paradigm:** a persistent course rail plus a reading column and a practice column, with the dashboard using a left-aligned editorial grid rather than centered marketing cards.
- **Signature elements:** numbered lesson markers, thin rules, and violet/orange annotation bars that echo the PlainScript manual.
- **Interaction philosophy:** every state should explain itself; completion and compiler feedback are explicit, compact, and reversible.
- **Animation:** restrained 160–220ms fades and horizontal reveals only for navigation and feedback; no decorative motion.
- **Typography system:** Fraunces for editorial display, Space Grotesk for interface copy, IBM Plex Mono for code and metadata.
- **Brand essence:** a practical place to learn PlainScript by reading it, running it, and building with it. Personality: exacting, warm, independent.
- **Brand voice:** direct and observant. Example lines: “Read the sentence. Then run it.” and “A compiler error is useful information.”
- **Wordmark & logo:** `LearnPlainScript` set with a small violet square rule and orange terminal cursor, not a generic rounded app mark.
- **Signature brand color:** PlainScript violet `#a679ff`, used sparingly against ink `#08070b` and paper `#f4f0e8`.

## Delivery

Use the authenticated `ayoistooslick` GitHub identity, create the public `ayoistooslick/learnplainscript` repository only after the local app is buildable, push the finished `main` branch, connect the repository to Vercel, and verify the production URL with a real HTTP request. No secret is required for anonymous local learning.
