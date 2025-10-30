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
 * Also handles plain {seconds, nanoseconds} objects
 * @param {any} obj - Object to deserialize
 * @returns {any} Deserialized object
 */
const deserializeTimestamps = (obj) => {
  if (!obj) return obj;

  // Handle primitive types
  if (typeof obj !== 'object') return obj;

  // Check if this is a serialized Firestore Timestamp object
  if (obj.type === 'firestore/timestamp/1.0' && typeof obj.seconds === 'number') {
    return new Date(obj.seconds * 1000 + (obj.nanoseconds || 0) / 1000000);
  }

  // Check if this is a plain Firestore Timestamp object {seconds, nanoseconds}
  // Must have ONLY seconds and nanoseconds properties (and no other keys except maybe __proto__)
  const keys = Object.keys(obj);
  if (
    keys.length === 2 &&
    keys.includes('seconds') &&
    keys.includes('nanoseconds') &&
    typeof obj.seconds === 'number' &&
    typeof obj.nanoseconds === 'number'
  ) {
    return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeTimestamps(item));
  }

  // Handle nested objects - recursively deserialize all properties
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deserializeTimestamps(obj[key]);
    }
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
      return deserializedData;
    }

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


