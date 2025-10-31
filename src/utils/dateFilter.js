/**
 * Date filtering utilities for Vietnam timezone (UTC+7)
 */

/**
 * Get start and end of today in Vietnam timezone
 * @returns {Object} { startOfDay, endOfDay } - Date objects
 */
export const getTodayRange = () => {
  // Get current time in Vietnam (UTC+7)
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Start of day: 00:00:00
  const startOfDay = new Date(vietnamTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  // End of day: 23:59:59.999
  const endOfDay = new Date(vietnamTime);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
};

/**
 * Check if a timestamp is from today (Vietnam timezone)
 * @param {Date|Timestamp} timestamp - Firestore Timestamp or Date object
 * @returns {boolean}
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  
  // Convert Firestore Timestamp to Date
  let date = timestamp;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (!(timestamp instanceof Date)) {
    date = new Date(timestamp);
  }
  
  const { startOfDay, endOfDay } = getTodayRange();
  
  return date >= startOfDay && date <= endOfDay;
};

/**
 * Filter array of items by today's date based on createdAt field
 * @param {Array} items - Array of items with createdAt field
 * @returns {Array} Filtered items from today
 */
export const filterTodayItems = (items) => {
  if (!Array.isArray(items)) return [];
  
  return items.filter(item => {
    if (!item.createdAt) return false;
    return isToday(item.createdAt);
  });
};

/**
 * Get today's date string in Vietnam timezone (YYYY-MM-DD)
 * @returns {string}
 */
export const getTodayDateString = () => {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
