/**
 * Cache Manager for Home Page Data
 * Prevents spam refresh by caching Firebase data in localStorage
 */

const CACHE_KEY = 'meo_journey_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data if valid
 * @returns {Object|null} Cached data or null if expired/invalid
 */
export const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    console.log('⏰ Cache expired, will fetch fresh data');
    return null;
  } catch (error) {
    console.error('❌ Error reading cache:', error);
    return null;
  }
};

/**
 * Save data to cache
 * @param {Object} data - Data to cache
 */
export const setCachedData = (data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    console.log('💾 Data cached successfully');
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
};

/**
 * Clear cached data
 * Use this when data is updated (e.g., quest/achievement completed)
 */
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Cache cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};


