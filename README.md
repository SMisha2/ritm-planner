# RITM 1.3.2

RITM is a personal day planner designed to make everyday planning faster and clearer.

## Live site

https://smisha2.github.io/ritm-planner/

## What changed in 1.3.0

- Clearer navigation: "Неделя" and "Таймер" say what each section does.
- More explicit task creation: the quick-add form is labelled plainly and advanced details are named.
- Empty lists now tell you exactly how to add the first task or habit.
- Week cards identify days without tasks.
- Habits and the focus timer include short usage instructions.
- Search and local data-saving labels are clearer.
- Subtle task-entry, button, timer-mode and progress animations.
- The app continues to respect `prefers-reduced-motion` and remains offline-first.

## Theme transition

- Switching light/dark mode uses a smooth full-interface crossfade where supported, with a staged fade fallback for browsers without View Transitions.
- The theme icon has its own short rotation and spring animation.
- Browsers without View Transitions use a soft overlay fade; reduced-motion preferences disable the effects.

## Development and deployment

GitHub Actions rebuilds the original app from the base64 fragments in `source/archive-v2/part-*`, validates the ZIP, runs the app checks and tests, validates the motion and clarity scripts, injects the versioned assets, bumps the Service Worker cache and publishes the static app to `gh-pages`.

RITM does not require an account or server-side database. App data stays in the browser; use the backup export in Settings to keep a separate copy.
