/**
 * Cache Manager for Home Page Data
 * Prevents spam refresh by caching data in localStorage
 */

const CACHE_KEY = 'meo_journey_home_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Serialize Date objects for caching
 * @param {any} obj - Object to serialize
 * @returns {any} Serialized object
 */
const serializeDates = (obj) => {
  if (!obj) return obj;

  // Convert Date objects to ISO strings
  if (obj instanceof Date) {
    return { __date: obj.toISOString() };
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDates(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = serializeDates(obj[key]);
    }
    return result;
  }

  return obj;
};

/**
 * Deserialize Date objects from cached data
 * @param {any} obj - Object to deserialize
 * @returns {any} Deserialized object
 */
const deserializeDates = (obj) => {
  if (!obj) return obj;

  // Handle primitive types
  if (typeof obj !== 'object') return obj;

  // Check if this is a serialized Date object
  if (obj.__date && typeof obj.__date === 'string') {
    return new Date(obj.__date);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deserializeDates(item));
  }

  // Handle nested objects
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deserializeDates(obj[key]);
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
      const deserializedData = deserializeDates(data);
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
    const serializedData = serializeDates(data);
    
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


