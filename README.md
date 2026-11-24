# RITM

RITM is a personal day planner for daily tasks, habits, notes, weekly planning and focus sessions. It is a static web app with local browser storage, dark and light themes, offline/PWA support, and backup export/import.

## Live site

https://smisha2.github.io/ritm-planner/

## Deployment

GitHub Actions rebuilds the original project ZIP from the base64 text fragments in `source/archive.part-*`, validates the archive, runs JavaScript syntax checks and all automated tests, then publishes the static app to the `gh-pages` branch. GitHub Pages serves the root of that branch.

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
