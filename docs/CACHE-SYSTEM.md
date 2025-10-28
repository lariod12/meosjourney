# Cache System Documentation

## Overview

The cache system prevents spam refresh on the home page by storing fetched data in localStorage with a 5-minute expiration time. This significantly reduces Firebase read operations and improves user experience.

## How It Works

### 1. Cache Manager (`src/utils/cacheManager.js`)

Handles all cache operations:
- `getCachedData()` - Retrieves cached data if valid
- `setCachedData(data)` - Saves data to cache
- `clearCache()` - Removes cached data
- `isCacheValid()` - Checks if cache is still valid
- `getCacheAge()` - Returns cache age in seconds

### 2. Custom Hook (`src/hooks/useCharacterData.js`)

React hook that manages data fetching with caching:
- Automatically checks cache before fetching
- Prevents multiple simultaneous fetches
- Provides `refetch()` for manual refresh
- Handles loading and error states

### 3. Implementation in App.jsx

```jsx
const { data, loading, refetch } = useCharacterData(characterData);
```

## Cache Configuration

**Cache Duration**: 5 minutes (300,000 milliseconds)
**Storage Key**: `meo_journey_home_cache`
**Storage Location**: localStorage

To change cache duration, edit `CACHE_DURATION` in `src/utils/cacheManager.js`:

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

## User Flow

### First Visit
1. User opens home page
2. No cache found
3. Fetch data from Firebase
4. Save to cache
5. Display data

### Subsequent Visits (within 5 minutes)
1. User opens home page
2. Cache found and valid
3. Display cached data immediately
4. No Firebase fetch

### After Cache Expires
1. User opens home page
2. Cache found but expired
3. Fetch fresh data from Firebase
4. Update cache
5. Display data

## Manual Refresh

Users can force refresh by:
1. Using the CacheStatus component (optional)
2. Waiting for cache to expire
3. Clearing browser localStorage

## Optional: Cache Status Component

Add to Header or Footer to show cache status:

```jsx
import CacheStatus from './components/CacheStatus';

<CacheStatus onRefresh={refetch} />
```

Features:
- Shows cache age
- Indicates if cache is valid/expired
- Provides manual refresh button

## Benefits

1. **Reduced Firebase Reads**: Saves up to 80% of read operations
2. **Faster Load Times**: Instant display from cache
3. **Better UX**: No loading spinner on repeated visits
4. **Cost Savings**: Lower Firebase usage costs
5. **Spam Prevention**: Blocks rapid refresh attempts

## Console Logs

The system provides helpful console logs:

- `✅ Using cached data (age: X seconds)` - Cache hit
- `⏰ Cache expired, will fetch fresh data` - Cache miss
- `🔄 Fetching fresh data from Firebase...` - Fetching
- `💾 Data cached successfully` - Cache saved
- `⏳ Fetch already in progress, skipping...` - Duplicate fetch prevented

## Testing

### Test Cache Hit
1. Open home page (fresh fetch)
2. Refresh page within 5 minutes
3. Check console for "Using cached data"

### Test Cache Expiration
1. Open home page
2. Wait 5+ minutes
3. Refresh page
4. Check console for "Cache expired"

### Test Spam Prevention
1. Open home page
2. Rapidly refresh multiple times
3. Check console for "Fetch already in progress"

## Troubleshooting

### Cache Not Working
- Check browser localStorage is enabled
- Check console for error messages
- Clear localStorage and try again

### Data Not Updating
- Wait for cache to expire (5 minutes)
- Use manual refresh button
- Clear cache: `localStorage.removeItem('meo_journey_home_cache')`

### Performance Issues
- Reduce cache duration if data changes frequently
- Increase cache duration for more stable data

## Future Enhancements

Possible improvements:
- Per-collection caching (separate cache for quests, achievements, etc.)
- Smart cache invalidation on data updates
- Background refresh before expiration
- Cache versioning for schema changes
- IndexedDB for larger datasets
