# RITM

RITM is a calm personal day planner for tasks, habits, notes, weekly planning and focus sessions.

## Project source

The complete application source, assets, tests and local development files are included in [`RITM.zip`](./RITM.zip). The archive preserves the complete `RITM/` project folder.

## GitHub Pages

The repository publishes the contents of the `RITM/` folder through GitHub Actions. The workflow extracts the archive, runs JavaScript syntax checks and the automated test suite, then deploys the static app to GitHub Pages.

After the first successful Actions deployment, the site will be available at:

https://smisha2.github.io/ritm-planner/

## Local development

1. Extract `RITM.zip`.
2. Open the extracted `RITM` folder.
3. Run `npm run check` and `npm test`.
4. Start a local static server, or open `index.html` in a browser.

RITM stores app data locally in the browser. It does not require an account or a backend service.