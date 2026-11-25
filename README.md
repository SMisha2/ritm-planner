# RITM

RITM is a focused personal planner for days that feel lighter and more intentional. It combines a simple task list, weekly overview, habits, free-form notes and a focus timer in one calm, responsive interface.

## What's inside

- Fast task capture directly on the day screen - no form or extra steps required.
- Optional task details: date, time, priority, category and notes.
- A glanceable daily progress indicator, weekly overview and habits.
- Notes that save automatically, plus a focus timer with short and long breaks.
- Light and dark themes, offline support and installable PWA assets.
- Local-first storage. Your planner data stays in this browser unless you export a backup.

## Run locally

1. Open this folder in a terminal.
2. Run `npm run check`.
3. Run `npm test`.
4. Open `index.html` in a browser or serve the folder with any static web server.

## Data and privacy

RITM does not require an account or cloud backend. Tasks, habits, notes and focus history are stored in the browser's local storage. Use Settings to export or import a JSON backup. Clearing browser data can remove the local workspace, so keep a backup when moving devices.

## Publish

The GitHub Actions workflow checks the application and publishes static files to the `gh-pages` branch. GitHub Pages serves that branch.
