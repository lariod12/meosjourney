/**
 * Cache Manager for Home Page Data
 * Prevents spam refresh by caching Firebase data in localStorage
 */

const CACHE_KEY = 'meo_journey_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Serialize Firestore Timestamp objects for caching
 * Converts Date objects to {type: "firestore/timestamp/1.0", seconds, nanoseconds}
 * @param {any} obj - Object to serialize
 * @returns {any} Serialized object
 */
const serializeTimestamps = (obj) => {
  if (!obj) return obj;

  // Convert Date objects to Firestore Timestamp format
  if (obj instanceof Date) {
    return {
      type: 'firestore/timestamp/1.0',
      seconds: Math.floor(obj.getTime() / 1000),
      nanoseconds: (obj.getTime() % 1000) * 1000000
    };
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeTimestamps(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = serializeTimestamps(obj[key]);
    }
    return result;
  }

  return obj;
};

/**
 * Deserialize Firestore Timestamp objects from cached data
 * Converts {type: "firestore/timestamp/1.0", seconds, nanoseconds} back to Date
 * @param {any} obj - Object to deserialize
 * @returns {any} Deserialized object
 */
const deserializeTimestamps = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  // Check if this is a Firestore Timestamp object
  if (obj.type === 'firestore/timestamp/1.0' && typeof obj.seconds === 'number') {
    // Convert to Date object
    return new Date(obj.seconds * 1000 + (obj.nanoseconds || 0) / 1000000);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeTimestamps(item));
  }

  // Handle nested objects
  const result = {};
  for (const key in obj) {
    result[key] = deserializeTimestamps(obj[key]);
  }
  return result;
};

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
      // Deserialize Firestore Timestamps before returning
      const deserializedData = deserializeTimestamps(data);
      console.log('✅ Cache loaded and timestamps deserialized');
      return deserializedData;
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
    // Serialize Firestore Timestamps before caching
    const serializedData = serializeTimestamps(data);
    
    const cacheObject = {
      data: serializedData,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    console.log('💾 Data cached successfully with serialized timestamps');
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


