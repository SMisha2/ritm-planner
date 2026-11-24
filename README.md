# RITM 1.2.0

RITM is a personal day planner designed to make everyday planning faster and calmer.

## Live site

https://smisha2.github.io/ritm-planner/

## Motion update

- Cinematic staggered transitions between sections.
- Slow, ambient light movement in the day hero.
- Spring-like feedback on buttons, navigation and cards.
- Cursor-following spotlight on desktop.
- A sparkle burst when a task is completed.
- Soft timer, progress and modal animations.
- Mobile-friendly motion and full `prefers-reduced-motion` support.

## Development and deployment

GitHub Actions rebuilds the original app from the base64 text fragments in `source/archive-v2/part-*`, validates the ZIP, runs the original JavaScript checks and tests, validates `motion.js`, injects the motion assets and publishes the static site to the `gh-pages` branch. GitHub Pages serves that branch's root.

RITM does not require an account or server-side database. App data stays in the browser; use the backup export in Settings to keep a separate copy.
