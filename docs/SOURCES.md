# Sources

LearnPlainScript uses the following public sources as references, not as copied branding or source code.

- [Learn JavaScript Online](https://learnjavascript.online/) — reference for the course information architecture: short lessons, in-browser practice, challenges, project-based progression, flashcards, and resume-oriented learning.
- [PlainScript manual](https://ayoistooslick.github.io/plainscript/) — reference for the editorial typography, violet/orange visual language, manual structure, and language positioning.
- [PlainScript repository](https://github.com/ayoistooslick/plainscript) — source of truth for PlainScript 2.2 syntax, compiler behavior, native JSX, regex, modules, interoperability, bridges, and verified integration examples.
- [PlainScript getting started](https://ayoistooslick.github.io/plainscript/getting-started.html) — verified starting syntax and compiler workflow.
- [PlainScript JSX guide](https://ayoistooslick.github.io/plainscript/jsx.html) — verified native JSX and React boundary examples.
- [PlainScript type system](https://ayoistooslick.github.io/plainscript/type-system.html) — verified inference, annotations, structural records, variants, unions, and optional-value concepts.
- [PlainScript JavaScript interop](https://ayoistooslick.github.io/plainscript/interop.html) — verified interoperability positioning and ordinary ES module output.

The published dependency used by the playground is `plainscript-lang@2.2.0`, installed from npm and exercised by `npm run check:plain` and the automated tests.

## UI reference notes

The public Learn JavaScript Online landing page and course app were inspected on 22 November 2026. Its short lesson rhythm, practice-first progression, course navigation drawer, and fixed bottom Back/Next/Help controls informed the UX. React Learn, javascript.info, MDN Learn, Vercel, and shadcn/ui were also consulted for documentation navigation, readable code examples, structured learning modules, compact developer surfaces, accessible controls, and theme patterns. LearnPlainScript does not copy these sites' source code, lesson content, illustrations, account systems, or proprietary assets.

The visual identity is based on the published PlainScript manual stylesheet rather than the UI references: near-black surfaces (`#08070b`, `#121017`), bone text (`#f2eee7`), violet (`#a679ff`), ember (`#ff6a3d`), and acid green (`#d8f26b`), with the documented code syntax colors. Geist and Geist Mono are self-hosted in `public/fonts/` for reliable Vite/Vercel delivery.
