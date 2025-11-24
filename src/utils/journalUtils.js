/**
 * Journal utilities for grouping and processing journal entries
 */

/**
 * Translate journal entry text for UI display (Vietnamese mode)
 * @param {string} entryText - Original journal entry text (in English format)
 * @param {string} lang - Current language ('EN' or 'VI')
 * @param {Function} t - Translation function from useLanguage
 * @returns {string} Translated journal entry text
 */
export const translateJournalEntry = (entryText, lang, t) => {
  let translated = (entryText || '').toString();

  // Cleanup legacy placeholders like "N/A" in status updates (apply for all languages)
  translated = translated.replace(/:\s*N\/?A\s*→\s*/gi, ': '); // ": N/A → New" -> ": New"
  translated = translated.replace(/:\s*N\/?A\s*$/gi, '');       // trailing ": N/A" -> removed
  translated = translated.trim();

  if (!translated) return '';
  if (lang !== 'VI') {
    return translated;
  }

  // Translate [Achievement Unlocked] format
  translated = translated.replace(
    /\[Achievement Unlocked\]/gi,
    `[${t('journal.achievement_unlocked')}]`
  );

  // Translate [Quest Completed] format
  translated = translated.replace(
    /\[Quest Completed\]/gi,
    `[${t('journal.quest_completed')}]`
  );

  // Translate [Status Update] format with field names
  translated = translated.replace(
    /\[Status Update\]/gi,
    `[${t('journal.status_update')}]`
  );

  // Translate field names in status updates
  translated = translated.replace(/\bMood\b/g, t('journal.status_mood'));
  translated = translated.replace(/\bLocation\b/g, t('journal.status_location'));
  translated = translated.replace(/\bActivity\b/g, t('journal.status_activity'));
  translated = translated.replace(/\bCaption\b/g, t('journal.status_caption'));

  // Translate [Profile Update] format and its parts
  translated = translated.replace(
    /\[Profile Update\]/gi,
    `[${t('journal.profile_update')}]`
  );
  translated = translated.replace(/\bAdded\b/g, t('journal.profile_added'));
  translated = translated.replace(/\bRemoved\b/g, t('journal.profile_removed'));
  translated = translated.replace(/\bskill\b/g, t('journal.profile_skill'));
  translated = translated.replace(/\binterest\b/g, t('journal.profile_interest'));

  // Translate [Album Update] format
  translated = translated.replace(
    /\[Album Update\]/gi,
    `[${t('journal.album_update')}]`
  );

  // Translate [Gallery Update] format
  translated = translated.replace(
    /\[Gallery Update\]/gi,
    `[${t('journal.gallery_update')}]`
  );

  // Translate "Note:" to "Ghi chú:" in album/gallery updates
  translated = translated.replace(/\bNote:/g, 'Ghi chú:');

  return translated;
};

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