# Working in this repo

## Every change goes through a pull request

`main` deploys straight to the live site (https://return-done.vercel.app) on Vercel, so nothing is
committed or pushed to `main` directly.

1. Create a branch from an up-to-date `main`: `fix/<topic>`, `feat/<topic>` or `chore/<topic>`.
2. Make the change and run `npm run check` (lint, typecheck, tests, build). It must pass.
3. Commit, then `git push -u origin <branch>`.
4. Give the owner the pull request link:
   `https://github.com/DisaleGita/Return-Done/compare/main...<branch>?expand=1`
5. The owner reviews the PR and its Vercel preview deployment, and merges it. Don't merge it yourself.

## Project notes

- Next.js 16 App Router, React 19, strict TypeScript, CSS Modules with tokens in `src/app/globals.css`.
- Domain logic is in `src/lib` as plain functions that take `now`, with tests beside them.
- Prices, pickup windows, email limits and links live in `src/lib/config.ts`.
- Secrets live only in `.env.local` (gitignored) and in Vercel's environment variables. Never commit them.
- Product copy stays honest: demo behaviour is labelled as demo, with no invented customers, traction or
  partnerships.
