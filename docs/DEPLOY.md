# Deployment Guide - GitHub Pages

## Overview

Meo's Journey deploys through GitHub Actions to GitHub Pages. The primary production URL is the custom domain:

```text
https://meosjourney.info/
```

The GitHub Pages project URL also remains compatible:

```text
https://lariod12.github.io/meosjourney/
```

The app uses Vite with production `base: './'`, so built assets resolve relative to either the custom domain root or the repository subpath. React Router chooses its basename at runtime based on the current host.

## Current Deploy Flow

Workflow file:

```text
.github/workflows/deploy.yml
```

The workflow runs on:

- Pushes to `main` only when the commit message starts with `public:`
- Manual `workflow_dispatch`

This means a normal local commit such as `update: docs refresh` will not deploy automatically. Use a `public:` commit only when you intentionally want GitHub Pages to rebuild.

## What The Workflow Does

1. Checks out the repository.
2. Sets up pnpm from `packageManager` in `package.json`.
3. Sets up Node.js 20 with pnpm cache.
4. Installs dependencies with `pnpm install`.
5. Reads `VITE_NOCODB_BASE_URL` and `VITE_NOCODB_TOKEN` from the GitHub Pages environment variables.
6. Builds with `pnpm run build`.
7. Uploads `dist/` as a Pages artifact.
8. Deploys with `actions/deploy-pages@v4`.

## Required GitHub Configuration

In repository settings:

- Pages source: GitHub Actions
- Environment: `github-pages`
- Variables:
  - `VITE_NOCODB_BASE_URL`
  - `VITE_NOCODB_TOKEN`

The workflow currently prints the base URL and token length for debugging. Do not print full secrets or tokens in logs.

## Local Build Check

Use local build checks before pushing a public deploy commit:

```bash
pnpm install
pnpm run build
```

Preview is available with:

```bash
pnpm run preview
```

Do not run deploy commands from local unless explicitly needed. This project is intended to deploy through GitHub Actions.

## Vite Configuration

Current `vite.config.js`:

- `base: '/'`
- `server.host: 'localhost'`
- `server.port: 5555`
- Production sourcemaps disabled
- Terser drops console/debugger in production builds
- JavaScript obfuscator plugin is installed but currently disabled in config

If the site moves back to a GitHub Pages subpath, `base` must be changed to the repo path. For the current custom domain, keep it as `/`.

## Deployment Commit Convention

Use normal project commit messages for regular work:

```bash
git commit -m "update: refresh project docs"
```

Use a deploy-triggering commit only when the public site should rebuild:

```bash
git commit -m "public: update homepage"
```

## Troubleshooting

### Workflow Does Not Run

Check the commit message. Push-triggered deploys require `public:` at the start, unless you run the workflow manually from the Actions tab.

### Blank Page Or 404 Assets

For compatibility with both the custom domain and the GitHub Pages project URL, production `base` should stay relative.

```js
base: mode === 'production' ? './' : '/',
```

If deploying only to a custom root domain, `base: '/'` is also valid. If deploying only to a GitHub Pages subpath, `base: '/meosjourney/'` is valid. Do not mix those fixed bases when both URLs need to work.

### NocoDB Requests Fail In Production

Check the `github-pages` environment variables:

- `VITE_NOCODB_BASE_URL`
- `VITE_NOCODB_TOKEN`

Then inspect browser console/network logs for NocoDB status codes.

### Build Fails

Run locally:

```bash
pnpm install
pnpm run build
```

If local build passes, compare GitHub Actions Node/pnpm setup and environment variables.

## Related Files

- `.github/workflows/deploy.yml`
- `vite.config.js`
- `package.json`
- `CNAME`
- `docs/TROUBLESHOOTING.md`
