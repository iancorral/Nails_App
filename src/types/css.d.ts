// Ambient declaration for side-effect CSS imports (e.g. `import "./globals.css"`).
// Next.js normally provides this via the generated next-env.d.ts, but that file
// is git-ignored and only created on `next dev`/`next build`, so we declare it
// here to keep type-checking working in the editor.
declare module "*.css";
