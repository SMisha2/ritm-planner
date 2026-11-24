# RITM

RITM is a personal day planner for daily tasks, habits, notes, weekly planning and focus sessions. It is a static web app with local browser storage, dark and light themes, offline/PWA support, and backup export/import.

## Live site

https://smisha2.github.io/ritm-planner/

## Deployment

The GitHub Actions workflow rebuilds the original project ZIP from text fragments in `source/archive.part-*`, validates the archive, extracts the app, runs syntax checks and the automated test suite, then deploys the static site to GitHub Pages.

## Rebuild the source archive locally

From the repository root:

```bash
cat source/archive.part-* | base64 --decode > RITM.zip
unzip RITM.zip
cd RITM
npm run check
npm test
```

The app does not require a server-side database or account. User data is stored in the browser.
