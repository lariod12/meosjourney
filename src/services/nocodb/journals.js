import { TABLE_IDS, USE_STATIC_DATA, fetchStaticData, nocoRequest, deduplicateRequest } from './core.js';

export const fetchJournals = async (limit = 25, offset = 0, options = {}) => {
  try {
    // Use static data in development
    if (USE_STATIC_DATA) {
      const staticData = await fetchStaticData();
      // Static data doesn't have journals yet
      return [];
    }

    const { source } = options || {};

    // NocoDB limits pageSize to 25, fetch single page per call for lazy loading
    const NOCO_PAGE_SIZE = 25;
    const page = Math.floor(offset / NOCO_PAGE_SIZE) + 1;
    const endpoint = `${TABLE_IDS.JOURNALS}/records?sort=-created_time&page=${page}&pageSize=${NOCO_PAGE_SIZE}`;

    const data = await nocoRequest(endpoint, { method: 'GET' });

    if (!data.list || data.list.length === 0) {
      console.warn('⚠️ No journal records found in NocoDB');
      return [];
    }

    // Transform NocoDB journals to frontend format
    const journals = data.list.map(record => {
      // Parse created_time to Date object
      let timestamp = new Date();
      if (record.created_time) {
        timestamp = new Date(record.created_time);
      }

      // Format time for display (HH:mm AM/PM)
      const timeStr = timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return {
        id: record.Id || record.title,
        entry: record.caption || '',
        time: timeStr,
        timestamp: timestamp,
        createdAt: timestamp
      };
    });

    if (import.meta.env.MODE !== 'production' && source === 'daily') {
      const sample = journals.slice(0, 10).map((j) => ({
        id: j.id,
        time: j.time,
        entry: (j.entry || '').toString().slice(0, 120)
      }));
      console.log('[DailyJournal][fetchJournals] Response', {
        count: journals.length,
        sample
      });
    }

    return journals;
  } catch (error) {
    console.error('❌ Error fetching journals from NocoDB:', error);
    return [];
  }
};

/**
 * Fetch all journals for today from NocoDB
 * Keeps fetching batches of 25 until no more today's journals found
 * @returns {Promise<Array>} Array of today's journal entries
 */
export const fetchTodayJournals = async (options = {}) => {
  try {
    if (USE_STATIC_DATA) {
      return [];
    }

    const { source } = options || {};

    const NOCO_PAGE_SIZE = 25;
    let allTodayJournals = [];
    let page = 1;
    let hasMore = true;
    let foundNonTodayEntry = false;

    // Get today's date range in Vietnam timezone
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const startOfDay = new Date(vietnamTime);
    startOfDay.setHours(0, 0, 0, 0);

    if (import.meta.env.MODE !== 'production' && source === 'daily') {
      console.log('[DailyJournal][fetchTodayJournals] Start', {
        date: vietnamTime.toDateString(),
      });
    }

    while (hasMore && !foundNonTodayEntry) {
      const endpoint = `${TABLE_IDS.JOURNALS}/records?sort=-created_time&page=${page}&pageSize=${NOCO_PAGE_SIZE}`;
      const data = await nocoRequest(endpoint, { method: 'GET' });

      if (!data.list || data.list.length === 0) {
        hasMore = false;
        break;
      }

      // Filter and check each record
      for (const record of data.list) {
        const timestamp = record.created_time ? new Date(record.created_time) : new Date();
        
        // Check if this entry is from today (Vietnam timezone)
        const recordVietnamTime = new Date(timestamp.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        
        if (recordVietnamTime >= startOfDay) {
          // Transform to frontend format
          const timeStr = timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          allTodayJournals.push({
            id: record.Id || record.title,
            entry: record.caption || '',
            time: timeStr,
            timestamp: timestamp,
            createdAt: timestamp
          });
        } else {
          // Found an entry from before today, stop fetching
          foundNonTodayEntry = true;
          break;
        }
      }

      hasMore = data.pageInfo && !data.pageInfo.isLastPage;
      page++;

      // Small delay between pages
      if (hasMore && !foundNonTodayEntry) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (import.meta.env.MODE !== 'production' && source === 'daily') {
      const sample = allTodayJournals.slice(0, 15).map((j) => ({
        id: j.id,
        time: j.time,
        entry: (j.entry || '').toString().slice(0, 120)
      }));
      console.log('[DailyJournal][fetchTodayJournals] Done', {
        count: allTodayJournals.length,
        pagesFetched: page - 1,
        sample
      });
    }

    return allTodayJournals;
  } catch (error) {
    console.error('❌ Error fetching today journals from NocoDB:', error);
    return [];
  }
};

/**
 * Fetch all journals data from NocoDB (for lazy loading)
 * Returns all journal entries sorted by created_time descending
 */
export const fetchAllJournals = async () => {
  try {
    if (USE_STATIC_DATA) {
      const staticData = await fetchStaticData();
      return [];
    }

    // Fetch all journals with pagination
    let allJournals = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100;
    const maxPages = 5; // Limit to 5 pages (500 journals max)

    while (hasMore && page <= maxPages) {
      const data = await nocoRequest(
        `${TABLE_IDS.JOURNALS}/records?sort=-created_time&page=${page}&pageSize=${pageSize}`,
        { method: 'GET' }
      );

      if (data.list && data.list.length > 0) {
        allJournals = allJournals.concat(data.list);
        hasMore = data.pageInfo && !data.pageInfo.isLastPage;
        page++;

        // Add delay between pages to avoid rate limiting
        if (hasMore && page <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } else {
        hasMore = false;
      }
    }

    // Fetched all journals

    // Transform to frontend format
    const journals = allJournals.map(record => {
      let timestamp = new Date();
      if (record.created_time) {
        timestamp = new Date(record.created_time);
      }

      const timeStr = timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return {
        id: record.Id || record.title,
        entry: record.caption || '',
        time: timeStr,
        timestamp: timestamp,
        createdAt: record.CreatedAt
      };
    });

    return journals;
  } catch (error) {
    console.error('❌ Error fetching all journals from NocoDB:', error);
    return [];
  }
};

/**
 * Fetch quests data from NocoDB
 * Returns all quest records
 */

export const saveJournal = async (journalData) => {
  try {
    if (!journalData.caption) {
      return { success: false, message: 'Journal entry is empty' };
    }

    // Generate title with format: journal_<year>-<month>-<day>_<hh>-<mm>-<ss>-<3 random digits>
    // Use ICT timezone (UTC+7) for all date/time calculations
    const now = new Date();

    // Convert to ICT (UTC+7) by using toLocaleString with Asia/Bangkok timezone
    const ictDateStr = now.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate 3 random digits
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const title = `journal_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${randomDigits}`;

    // Format with timezone offset: YYYY-MM-DDTHH:mm:ss+07:00 (ISO 8601 with ICT timezone)
    // This tells NocoDB that the time is already in ICT, not UTC
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Handle History Record (Check/Create and Link)
    const historyTitle = `history_${year}-${month}-${day}`;
    const historyDateStr = `${year}-${month}-${day}`;
    let historyId = null;

    try {
      // Check if history record exists for today
      const historyQuery = await nocoRequest(`${TABLE_IDS.HISTORY}/records?where=(title,eq,${historyTitle})`, {
        method: 'GET'
      });

      if (historyQuery.list && historyQuery.list.length > 0) {
        historyId = historyQuery.list[0].Id;
        // Debug: Log history record (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Found existing history record:', historyTitle);
        }
      } else {
        // Create new history record
        // Debug: Log creating history (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('Pm Creating new history record:', historyTitle);
        }
        const newHistoryPayload = {
          title: historyTitle,
          created_time: historyDateStr
        };

        const createHistoryResponse = await nocoRequest(`${TABLE_IDS.HISTORY}/records`, {
          method: 'POST',
          body: JSON.stringify(newHistoryPayload)
        });

        // Handle response which could be the record or an object containing it
        historyId = createHistoryResponse.Id || (createHistoryResponse.list && createHistoryResponse.list[0]?.Id);
        // Debug: Log history creation success (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Created new history record:', historyTitle);
        }
      }
    } catch (historyError) {
      console.error('⚠️ Failed to handle history record:', historyError);
      // Proceed without linking if history operations fail
    }

    const payload = {
      title: title,
      caption: journalData.caption,
      created_time: createdTime,
      ...(historyId && { history: historyId }) // Link to history record
    };

    // Debug: Log journal submission (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Journal POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.JOURNALS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log journal save success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Journal saved successfully in NocoDB:', response);
    }
    return { success: true, message: 'Journal saved' };
  } catch (error) {
    console.error('❌ Error saving journal to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Create journal entry for album/gallery upload
 * @param {string} eventType - 'album' or 'gallery'
 * @param {string} description - Description of the upload
 * @returns {Promise<Object>} Result object with success status
 */
export const createMediaUploadJournal = async (eventType, description = '') => {
  try {
    // Generate title and timestamp
    const now = new Date();
    const ictDateStr = now.toLocaleString('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const title = `journal_${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${randomDigits}`;
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Handle History Record
    const historyTitle = `history_${year}-${month}-${day}`;
    const historyDateStr = `${year}-${month}-${day}`;
    let historyId = null;

    try {
      const historyQuery = await nocoRequest(`${TABLE_IDS.HISTORY}/records?where=(title,eq,${historyTitle})`, {
        method: 'GET'
      });

      if (historyQuery.list && historyQuery.list.length > 0) {
        historyId = historyQuery.list[0].Id;
      } else {
        const newHistoryPayload = {
          title: historyTitle,
          created_time: historyDateStr
        };

        const createHistoryResponse = await nocoRequest(`${TABLE_IDS.HISTORY}/records`, {
          method: 'POST',
          body: JSON.stringify(newHistoryPayload)
        });

        historyId = createHistoryResponse.Id || (createHistoryResponse.list && createHistoryResponse.list[0]?.Id);
      }
    } catch (historyError) {
      console.error('⚠️ Failed to handle history record:', historyError);
    }

    // Create caption based on event type
    const eventLabel = eventType === 'album' ? '[Album Update]' : '[Gallery Update]';
    const caption = description ? `${eventLabel}\nNote: ${description}` : eventLabel;

    const payload = {
      title: title,
      caption: caption,
      created_time: createdTime,
      ...(historyId && { history: historyId })
    };

    await nocoRequest(`${TABLE_IDS.JOURNALS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (import.meta.env.MODE !== 'production') {
      console.log(`✅ Journal entry created for ${eventType} upload`);
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Error creating journal entry for ${eventType}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch achievements data from NocoDB
 * Returns all achievement records
 */
