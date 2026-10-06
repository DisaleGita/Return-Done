# Contributing

Thanks for taking a look. Return Done is a portfolio rebuild of a 2023 startup, but issues and pull requests
are welcome.

## Setup

```bash
npm install
npm run dev
```

No environment variables are required. See `.env.example` for the optional ones.

## Workflow

`main` deploys to the live site, so all changes go through a pull request:

1. Branch from `main` (`fix/…`, `feat/…`, `chore/…`).
2. Commit, push the branch, and open a pull request.
3. Check the Vercel preview link on the PR, then merge.

## Before opening a pull request

```bash
npm run check   # lint, typecheck, tests, production build
```

CI runs the same command.

## Conventions

- **Domain logic goes in `src/lib`** as plain functions that take `now` as a parameter, with tests next to
  them (`*.test.ts`). Components should stay mostly presentational.
- **Validation lives in `src/lib/schemas.ts`**, so the browser and the API agree.
- **Prices, pickup windows and links live in `src/lib/config.ts`.** Don't hard-code them in components.
- **Styling** uses CSS Modules and the tokens in `src/app/globals.css`. Reach for a token before a raw value.
- **Accessibility is part of done:** labelled controls, keyboard support, visible focus and
  reduced-motion-safe animation.
- **Product copy stays honest.** Demo behaviour is labelled as demo. Don't add claims about customers,
  partnerships or traction.
