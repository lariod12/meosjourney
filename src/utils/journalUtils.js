/**
 * Journal utilities for grouping and processing journal entries
 */

/**
 * Group journal entries by date (Vietnam timezone)
 * @param {Array} journals - Array of journal entries with timestamp
 * @returns {Array} Array of grouped entries by date, sorted by date descending
 */
export const groupJournalsByDate = (journals) => {
  if (!Array.isArray(journals) || journals.length === 0) {
    return [];
  }

  // Group journals by date
  const groupedByDate = {};

  journals.forEach(journal => {
    if (!journal.timestamp) return;

    // Ensure timestamp is a Date object
    let timestamp = journal.timestamp;
    if (!(timestamp instanceof Date)) {
      timestamp = new Date(timestamp);
    }

    // Skip invalid dates
    if (isNaN(timestamp.getTime())) return;

    // Convert to Vietnam timezone date string (YYYY-MM-DD)
    const dateStr = timestamp.toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Ho_Chi_Minh'
    });

    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = {
        date: new Date(timestamp.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })),
        entries: []
      };
    }

    groupedByDate[dateStr].entries.push({
      id: journal.id,
      time: journal.time,
      entry: journal.entry
    });
  });

  // Convert to array and sort by date descending (newest first)
  const groupedArray = Object.values(groupedByDate);
  groupedArray.sort((a, b) => b.date - a.date);

  // Sort entries within each day by time descending (newest first)
  groupedArray.forEach(day => {
    day.entries.sort((a, b) => {
      // Convert time strings to comparable format
      const timeA = convertTimeToMinutes(a.time);
      const timeB = convertTimeToMinutes(b.time);
      return timeB - timeA; // Descending order
    });
  });

  return groupedArray;
};

/**
 * Convert time string (e.g., "2:30 PM") to minutes for comparison
 * @param {string} timeStr - Time string in format "H:MM AM/PM"
 * @returns {number} Minutes since midnight
 */
const convertTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = (hours % 12) * 60 + minutes;
  if (period === 'PM') {
    totalMinutes += 12 * 60;
  }
  
  return totalMinutes;
};