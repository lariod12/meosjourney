# Cache System Documentation

## Overview

The current app does not use the old Firebase/localStorage `meo_journey_home_cache`. Data flows through `src/services/nocodb.js`, which provides request deduplication, throttling, retry backoff, and small persisted timing guards for NocoDB API calls. Home page rendering also uses a short-lived `localStorage` snapshot so repeat visits can render immediately while NocoDB revalidates in the background.

The goal is to prevent duplicate concurrent requests and NocoDB rate-limit spikes while still allowing fresh data after user/admin updates.

## Current Implementation

### Service Layer

`src/services/nocodb.js` owns the cache-like behavior:

- `pendingRequests`: in-memory request registry that deduplicates identical in-flight requests.
- `deduplicateRequest`: returns the existing promise when the same request is already running.
- `clearNocoDBCache`: clears all in-flight request entries.
- `clearCachedRequest`: clears one in-flight request key.
- `nocoRequest`: applies request throttling, retry handling, and rate-limit backoff.

### Persisted Timing Guards

Two localStorage keys are used only for request pacing:

| Key | Purpose |
| --- | --- |
| `meo_noco_last_request_time` | Persists the last request timestamp across reloads. |
| `meo_noco_penalty_until` | Persists a temporary backoff window after rate limiting. |

These keys do not cache app data. They only help prevent immediate retry bursts after refreshes.

### Home Snapshot Cache

The home page stores a short-lived snapshot under `meo_home_data_snapshot`.

| Key | Purpose |
| --- | --- |
| `meo_home_data_snapshot` | Speeds up repeat home visits by rendering the latest non-sensitive home data immediately, then replacing it with fresh NocoDB data. |

The snapshot expires after 15 minutes. It intentionally omits sensitive config data.

### Hook Layer

`src/hooks/useCharacterData.js` fetches home-page data from NocoDB:

- Initial render: uses a short-lived `localStorage` home snapshot when available, otherwise renders fallback `characterData` immediately.
- First NocoDB hydration: status and profile with avatar.
- Background hydration: today's journals, config, quests, and achievements.
- Avatar image preloads in the background.
- `refetch` is exposed so `App.jsx` can refresh when it receives `meo:refresh`.

The home snapshot is stale-while-revalidate: it improves perceived load time but fresh NocoDB data still replaces it after fetches finish. Sensitive config data is not persisted in the snapshot.

## Main Data Flow

1. `App.jsx` renders the home route.
2. `useCharacterData(characterData)` renders cached/fallback data immediately.
3. Status/profile hydrate first from NocoDB.
4. Background fetch fills journals, config, quests, and achievements.
5. User/admin mutations call NocoDB helpers.
6. Mutation flows call `clearNocoDBCache` and dispatch refresh events when needed.

## Refresh Events

| Event | Listener | Purpose |
| --- | --- | --- |
| `meo:refresh` | `src/App.jsx` | Refetch home-page character data. |
| `photoalbum:refresh` | `PhotoAlbumTab.jsx` | Reload photo album content. |

`UserPage.jsx` dispatches these events after relevant profile/status/task/media updates.

## What Was Removed Or Replaced

The older docs referenced `src/utils/cacheManager.js` and `meo_journey_home_cache`. That module and key are not part of the current source tree. The replacement is request deduplication, rate-limit protection, and the short-lived `meo_home_data_snapshot` used only for faster home rendering.

## Environment Behavior

| Mode | Behavior |
| --- | --- |
| Development | Uses development table IDs, can use static data when `VITE_NOCODB_USE_STATIC=true`, allows up to 2 concurrent requests, shorter request spacing. |
| Staging | Uses staging table IDs, follows production-style image URL handling, limits concurrency more strictly. |
| Production | Uses production table IDs, signed URLs, one concurrent NocoDB request, production logging/minification behavior. |

## Troubleshooting

### Duplicate Requests

Check whether the same service function uses a stable cache key in `deduplicateRequest`. React StrictMode can trigger duplicate renders in development, so service-level deduplication is expected.

### Rate Limit Warnings

If the console shows rate-limit retry logs, wait for the backoff window or clear the persisted timing keys during local debugging:

```javascript
localStorage.removeItem('meo_noco_last_request_time');
localStorage.removeItem('meo_noco_penalty_until');
```

### Stale Home Data After Updates

Confirm the mutation flow calls `clearNocoDBCache` and dispatches `meo:refresh` when the home page should reflect the new data immediately.

## Related Files

- `src/services/nocodb.js`
- `src/hooks/useCharacterData.js`
- `src/App.jsx`
- `src/pages/UserPage/UserPage.jsx`
- `src/pages/AdminPage/AdminPage.jsx`
