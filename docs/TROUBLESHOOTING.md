# Troubleshooting Guide

## Quick Checks

Run these first when something feels off:

```bash
git status
pnpm install
pnpm run build
```

The local dev server is configured for port `5555` in `vite.config.js`, but do not start it if one is already running.

## Common Issues

### Blank Page After Deploy

For the current custom domain deployment, Vite should use:

```js
base: '/',
```

If assets 404 in production, check:

- `vite.config.js`
- `CNAME`
- GitHub Pages source is GitHub Actions
- The workflow completed successfully
- Browser cache has been hard refreshed

### GitHub Actions Does Not Deploy

The workflow only runs automatically when pushing to `main` with a commit message that starts with `public:`.

Examples:

```bash
git commit -m "public: update homepage"
```

Normal commits do not trigger deploy:

```bash
git commit -m "update: refresh docs"
```

You can also trigger the workflow manually from GitHub Actions.

### Build Fails

Check the dependency/tooling versions:

- `packageManager`: `pnpm@10.14.0`
- React: `19.2.1`
- Vite: `7.1.9`
- GitHub Actions Node: `20`

Local check:

```bash
pnpm install
pnpm run build
```

Production build uses Terser and drops console/debugger output. The obfuscator plugin is installed but currently disabled in `vite.config.js`.

### NocoDB Data Does Not Load

Check environment variables:

- `VITE_NOCODB_BASE_URL`
- `VITE_NOCODB_TOKEN`
- `VITE_NOCODB_USE_STATIC` when using static local data
- `VITE_CHARACTER_ID` if overriding the default character

Then inspect browser Network logs for NocoDB status codes.

### NocoDB Rate Limit Or Slow Requests

`src/services/nocodb.js` throttles requests and stores timing guards in localStorage:

```javascript
localStorage.removeItem('meo_noco_last_request_time');
localStorage.removeItem('meo_noco_penalty_until');
```

Use this only during local debugging. If production hits rate limits, reduce parallel calls or keep the stricter production request pacing.

### Stale Data On Home Page

The current app does not use the old `meo_journey_home_cache` key. Home data refreshes through:

- `clearNocoDBCache`
- `window.dispatchEvent(new Event('meo:refresh'))`
- `useCharacterData().refetch`

If a mutation succeeds but home data stays stale, inspect the mutation flow in `UserPage.jsx` or `AdminPage.jsx`.

### Avatar Or Uploaded Images Do Not Load

For public assets in Vite:

```javascript
fetch('/avatars/avatar.png');
```

For NocoDB-uploaded images:

- Development: use `signedPath` or `path`, then build full URL from `VITE_NOCODB_BASE_URL`.
- Staging/Production: use `signedUrl` first, then `url` fallback.
- Parse NocoDB attachment fields if they arrive as JSON strings.

### Discord Notifications Fail

Check:

- Webhook still exists and has channel permissions.
- The browser console status code and response body.
- Embed fields are not over Discord limits.
- Proof image URLs are accessible.

Webhook URLs are secrets; do not paste full values into docs, logs, or chat.

### Password Modal Blocks User/Admin Page

Both protected routes read config from NocoDB:

- `/user/meos05`
- `/admin/meos05`

If password checks fail unexpectedly, verify `fetchConfig` and the `pwDailyUpdate` field in the active NocoDB environment.

## Current Routes

| Route | Source |
| --- | --- |
| `/` | `src/App.jsx` and `src/pages/HomePage/CharacterSheet.jsx` |
| `/user/meos05` | `src/pages/UserPage/UserPage.jsx` |
| `/admin/meos05` | `src/pages/AdminPage/AdminPage.jsx` |

## Related Docs

- `docs/CACHE-SYSTEM.md`
- `docs/WHEN-CACHE-CLEARS-VI.md`
- `docs/DEPLOY.md`
- `docs/DISCORD-SETUP.md`
