# Cache System Documentation

## Overview

The current app does not use the old Firebase/localStorage home-page data cache. Data now flows through `src/services/nocodb.js`, which provides request deduplication, throttling, retry backoff, and small persisted timing guards for NocoDB API calls.

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

### Hook Layer

`src/hooks/useCharacterData.js` fetches home-page data from NocoDB:

- Critical first paint: status, config, today journals, profile with avatar.
- Avatar image preloads in the background.
- Quests and achievements load afterward without blocking the first render.
- `refetch` is exposed so `App.jsx` can refresh when it receives `meo:refresh`.

## Main Data Flow

1. `App.jsx` renders the home route.
2. `useCharacterData(characterData)` fetches critical NocoDB data.
3. Home page displays fallback/default data only if fetching fails.
4. Background fetch fills quests and achievements.
5. User/admin mutations call NocoDB helpers.
6. Mutation flows call `clearNocoDBCache` and dispatch refresh events when needed.

## Refresh Events

| Event | Listener | Purpose |
| --- | --- | --- |
| `meo:refresh` | `src/App.jsx` | Refetch home-page character data. |
| `photoalbum:refresh` | `PhotoAlbumTab.jsx` | Reload photo album content. |

`UserPage.jsx` dispatches these events after relevant profile/status/task/media updates.

## What Was Removed Or Replaced

The older docs referenced `src/utils/cacheManager.js` and `meo_journey_home_cache`. That module and key are not part of the current source tree. The current behavior is request deduplication and rate-limit protection, not a five-minute persisted home-data cache.

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
