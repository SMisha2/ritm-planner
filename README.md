# RITM 1.1.0

RITM is a personal day planner designed to make everyday planning faster and calmer.

## Live site

https://smisha2.github.io/ritm-planner/

## What changed in 1.1.0

- Quick-add task capture directly from the day screen. No edit dialog needed for simple tasks.
- A clearer daily progress overview.
- A simpler dashboard with less duplicated information and fewer competing cards.
- A more expressive visual system with a deep, atmospheric hero, restrained glow, stronger typography and cleaner mobile layouts.
- Existing tasks, habits, notes, calendar, focus timer, backup and offline support remain available.

## Development and deployment

The GitHub Actions workflow reconstructs the application archive from the base64 text fragments in `source/archive-v2/part-*`, validates the ZIP, runs JavaScript syntax checks and the complete automated test suite, then publishes the static site to the `gh-pages` branch. GitHub Pages serves the root of that branch.

To rebuild the archive locally:

```bash
cat source/archive-v2/part-* | base64 --decode > RITM.zip
unzip RITM.zip
cd RITM
npm run check
npm test
```

RITM does not require an account or server-side database. App data stays in the browser; use the backup export in Settings to keep a separate copy.
