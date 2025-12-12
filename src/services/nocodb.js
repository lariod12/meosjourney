/**
 * NocoDB Service
 * Handles all NocoDB API interactions for the application
 *
 * Configuration:
 * - VITE_NOCODB_USE_STATIC=true: Use static JSON file (for offline development)
 * - VITE_NOCODB_USE_STATIC=false: Use real NocoDB API (requires valid token)
 *
 * API Token: Set in .env.development as VITE_NOCODB_TOKEN
 */

import { CHARACTER_ID } from '../config/constants';

const NOCODB_BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
const USE_STATIC_DATA = import.meta.env.VITE_NOCODB_USE_STATIC === 'true';

// Export CHARACTER_ID for use in other modules
export { CHARACTER_ID };

// Table IDs from NocoDB export
const TABLE_IDS_PRODUCTION = {
  STATUS: 'm0ik9l51n1dpn5a',
  PROFILE: 'mzm3hqgjmjh1mwz',
  CONFIG: 'm6ylndnmg21ecr2',
  HISTORY: 'me4mvbozt7qzr8u',
  JOURNALS: 'mijt02urzahbr2g',
  QUESTS: 'm2l33arlwkxniov',
  QUESTS_CONFIRM: 'muv829m3xzzcvm7',
  ACHIEVEMENTS: 'm4m6vrb5ylqoqxn',
  ACHIEVEMENTS_CONFIRM: 'mcynwxx2hpgcolt',
  ATTACHMENTS_GALLERY: 'mirssuqhjx529p5',
  ATTACHMENTS_ALBUM: 'mc6wu0v542g2bnr'
};

const TABLE_IDS_DEVELOPE = {
  STATUS: 'myzr03ds9q74zkp',
  PROFILE: 'm05nuwsedf20qp3',
  CONFIG: 'mes7u9lklksi0eh',
  HISTORY: 'm4k0ibuhxemhz7l',
  JOURNALS: 'medcjhz2xd8ynxw',
  QUESTS: 'mc8ntiumxfjxso1',
  QUESTS_CONFIRM: 'mt2865bgwsejxhz',
  ACHIEVEMENTS: 'mbvnmjgyovlitbc',
  ACHIEVEMENTS_CONFIRM: 'mv0l9jz8fhf1gjl',
  ATTACHMENTS_GALLERY: 'mpp72hgqxpn2p3k',
  ATTACHMENTS_ALBUM: 'mkwz7hrtyzkvji6'
};

const TABLE_IDS_STAGING = {
  STATUS: 'ms8en1op7vwznus',
  PROFILE: 'mntx3zoatts0mqs',
  CONFIG: 'mfknw80a7z9yq4k',
  HISTORY: 'm6gg7iz2652psmg',
  JOURNALS: 'm2vhvjmajhe57m1',
  QUESTS: 'm5zdtosf0at9r5e',
  QUESTS_CONFIRM: 'm9mcryxflb74irn',
  ACHIEVEMENTS: 'mn5q6w7t05bamhd',
  ACHIEVEMENTS_CONFIRM: 'mlayyfujdqnghzb',
  ATTACHMENTS_GALLERY: 'mc8mv7di4aadfz1',
  ATTACHMENTS_ALBUM: 'mi5yptema60aqcq'
};

// Use appropriate table IDs based on environment
const TABLE_IDS = import.meta.env.MODE === 'production' ? TABLE_IDS_PRODUCTION : 
                  import.meta.env.MODE === 'staging' ? TABLE_IDS_STAGING : 
                  TABLE_IDS_DEVELOPE;

// Helper function to check if current mode should use production behavior
const isProductionMode = () => import.meta.env.MODE === 'production' || import.meta.env.MODE === 'staging';

// Helper function to generate UTC+7 timestamp with milliseconds for uniqueness
const getUTC7Timestamp = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  // Add milliseconds for uniqueness (prevent duplicate key constraint)
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}+07:00`;
};

// Debug: Log current mode and table IDs (development and staging only)
if (!isProductionMode()) {
  const envName = import.meta.env.MODE === 'staging' ? 'STAGING' : 
                  import.meta.env.MODE === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`🔧 NocoDB Mode: ${import.meta.env.MODE}, Using ${envName} table IDs`);
}

// Track in-flight requests (prevents duplicate concurrent calls, e.g. React StrictMode)
const pendingRequests = new Map();

// Request throttling to prevent rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = import.meta.env.MODE === 'staging' ? 500 : 200; // 500ms for staging, 200ms for others

// Deduplicate concurrent requests - if same request is in-flight, return the same promise
const deduplicateRequest = async (key, requestFn) => {
  // Check if request is already in-flight
  if (pendingRequests.has(key)) {
    // Debug: Log waiting request (development only)
    if (!isProductionMode()) {
      console.log(`⏳ Waiting for in-flight request: ${key}`);
    }
    return pendingRequests.get(key);
  }

  // Execute the request and store the promise
  const promise = requestFn()
    .then(data => {
      pendingRequests.delete(key);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
};

/**
 * Clear all cached requests
 * Use this when you need to force fresh data (e.g., after updates)
 */
export const clearNocoDBCache = () => {
  pendingRequests.clear();
  // Debug: Log cache cleared (development only)
  if (!isProductionMode()) {
    console.log('🗑️ NocoDB cache cleared');
  }
};

/**
 * Clear specific cached request by key
 */
export const clearCachedRequest = (key) => {
  pendingRequests.delete(key);
};

/**
 * Fetch static data from public folder (development mode)
 */
const fetchStaticData = async () => {
  const response = await fetch('/nocodb-data.json');
  if (!response.ok) {
    throw new Error('Failed to fetch static NocoDB data');
  }
  return response.json();
};

/**
 * Make a request to NocoDB API with retry logic for rate limiting
 * Requests are executed in parallel when using Promise.all for better performance
 */
const nocoRequest = async (endpoint, options = {}, retries = 3) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${endpoint}`;

  // Throttle requests to prevent rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'xc-token': NOCODB_TOKEN,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (attempt < retries) {
          // Staging: 2s, 5s, 10s | Others: 1s, 2s, 4s
          const baseDelay = import.meta.env.MODE === 'staging' ? 2000 : 1000;
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(` Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`NocoDB API rate limit exceeded after ${retries} retries`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = errorText;
        }
        console.error(' NocoDB API error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          method: options.method || 'GET',
          errorDetail
        });
        throw new Error(`NocoDB API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorDetail)}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // For network errors, also retry with exponential backoff
      const baseDelay = import.meta.env.MODE === 'staging' ? 2000 : 1000;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(` Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Fetch status data from NocoDB
 * Returns the first (and only) status record
 */
export const fetchStatus = async () => {
  const cacheKey = 'status';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        const statusRecord = staticData.status.fields;

        return {
          id: staticData.status.id,
          doing: statusRecord.current_activity || [],
          mood: statusRecord.mood || [], // Changed from 'moods' to 'mood' to match database column
          location: statusRecord.location || [],
          timestamp: statusRecord.UpdatedAt || statusRecord.CreatedAt || new Date(),
          createdAt: statusRecord.CreatedAt,
          updatedAt: statusRecord.UpdatedAt
        };
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.STATUS}/records`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No status record found in NocoDB');
        return null;
      }

      const statusRecord = data.list[0];

      // Parse JSON fields
      const currentActivity = Array.isArray(statusRecord.current_activity)
        ? statusRecord.current_activity
        : (statusRecord.current_activity ? JSON.parse(statusRecord.current_activity) : []);

      const moods = Array.isArray(statusRecord.mood)
        ? statusRecord.mood
        : (statusRecord.mood ? JSON.parse(statusRecord.mood) : []);

      const location = Array.isArray(statusRecord.location)
        ? statusRecord.location
        : (statusRecord.location ? JSON.parse(statusRecord.location) : []);

      return {
        id: statusRecord.Id,
        doing: currentActivity,
        mood: moods, // Changed from 'moods' to 'mood' to match database column
        location: location,
        timestamp: statusRecord.UpdatedAt || statusRecord.CreatedAt || new Date(),
        createdAt: statusRecord.CreatedAt,
        updatedAt: statusRecord.UpdatedAt
      };
    } catch (error) {
      console.error('❌ Error fetching status from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch profile data from NocoDB
 */
export const fetchProfile = async () => {
  const cacheKey = 'profile';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        const profileRecord = staticData.profile.fields;

        // Note: 'interests' field renamed to 'hobbies' in NocoDB
        const hobbies = Array.isArray(profileRecord.hobbies)
          ? profileRecord.hobbies
          : (profileRecord.hobbies ? JSON.parse(profileRecord.hobbies) : []);

        const skills = Array.isArray(profileRecord.skills)
          ? profileRecord.skills
          : (profileRecord.skills ? JSON.parse(profileRecord.skills) : []);

        // Parse social_link array to object
        let socialLinks = {};
        if (Array.isArray(profileRecord.social_link)) {
          profileRecord.social_link.forEach(item => {
            Object.assign(socialLinks, item);
          });
        }

        // Get XP and level from database
        const currentXP = parseInt(profileRecord.current_xp, 10) || 0;
        const maxXP = parseInt(profileRecord.max_xp, 10) || 1000;
        const level = parseInt(profileRecord.level, 10) || 0;

        return {
          id: staticData.profile.id,
          name: profileRecord.name || profileRecord.title || 'Character',
          caption: profileRecord.caption || '',
          currentXP: currentXP,
          maxXP: maxXP,
          level: level,
          hobbies: hobbies,
          skills: skills,
          introduce: profileRecord.introduce || '',
          social: socialLinks,
          createdAt: profileRecord.CreatedAt,
          updatedAt: profileRecord.UpdatedAt
        };
      }

      // Use API in production
      // Step 1: Fetch profile record
      const data = await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No profile record found in NocoDB');
        return null;
      }

      const profileRecord = data.list[0];

      // Step 2: Fetch avatar image from attachments_gallery (if linked)
      let avatarUrl = null;
      try {
        // Debug: Log avatar fetching (development only)
        if (!isProductionMode()) {
          console.log('🔍 Fetching avatar for profile ID:', profileRecord.Id);
          console.log('🔍 Using ATTACHMENTS_GALLERY table ID:', TABLE_IDS.ATTACHMENTS_GALLERY);
        }

        let attachmentsData;

        // Development mode: different schema (no profile_id field, use signedPath)
        if (!isProductionMode()) {
          // Debug: Log development mode query (development only)
          if (!isProductionMode()) {
            console.log('🛠️ Development mode: using simplified query');
          }
          attachmentsData = await nocoRequest(
            `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=1`,
            { method: 'GET' }
          );
        } else {
          // Production mode: original query with profile_id filtering
          attachmentsData = await nocoRequest(
            `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,profile_id&where=(profile_id,eq,${profileRecord.Id})`,
            { method: 'GET' }
          );
        }

        // Debug: Log attachments found (development only)
        if (!isProductionMode()) {
          console.log('📎 Avatar attachments found:', attachmentsData.list?.length || 0);
        }

        if (attachmentsData.list && attachmentsData.list.length > 0) {
          const attachment = attachmentsData.list[0];
          // Debug: Log attachment processing (development only)
          if (!isProductionMode()) {
            console.log('🖼️ Processing attachment:', attachment.Id);
          }

          if (attachment.img_bw) {
            // Parse img_bw if it's a string (NocoDB returns it as JSON string)
            let imgBwArray = attachment.img_bw;
            if (typeof imgBwArray === 'string') {
              imgBwArray = JSON.parse(imgBwArray);
            }

            // Get first image from array
            if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
              const imgBw = imgBwArray[0];

              // Development mode: use signedPath, Production mode: use signedUrl
              if (!isProductionMode()) {
                // Debug: Log development mode URL handling (development only)
                if (!isProductionMode()) {
                  console.log('🛠️ Development mode: using signedPath');
                }
                avatarUrl = imgBw.signedPath || imgBw.path || null;
                // Construct full URL for signedPath
                if (avatarUrl) {
                  avatarUrl = `${NOCODB_BASE_URL}/${avatarUrl}`;
                }
              } else {
                // Debug: Log production mode URL handling (development only)
                if (!isProductionMode()) {
                  console.log('🏭 Production mode: using signedUrl');
                }
                avatarUrl = imgBw.signedUrl || imgBw.url || null;
              }

              // Debug: Log URL extraction result (development only)
              if (!isProductionMode()) {
                console.log('✅ Avatar URL extracted:', avatarUrl ? 'SUCCESS' : 'FAILED');
                if (avatarUrl) {
                  console.log('🔗 Final avatar URL:', avatarUrl);
                }
              }
            } else {
              // Debug: Log empty array (development only)
              if (!isProductionMode()) {
                console.log('❌ No images in img_bw array');
              }
            }
          } else {
            // Debug: Log missing field (development only)
            if (!isProductionMode()) {
              console.log('❌ No img_bw field in attachment');
            }
          }
        } else {
          // Debug: Log no attachments (development only)
          if (!isProductionMode()) {
            console.log('❌ No attachments found for profile');
          }
        }
      } catch (avatarError) {
        console.warn('⚠️ Failed to fetch avatar image:', avatarError);
      }

      // Parse JSON fields
      // Note: 'interests' field renamed to 'hobbies' in NocoDB
      const hobbies = Array.isArray(profileRecord.hobbies)
        ? profileRecord.hobbies
        : (profileRecord.hobbies ? JSON.parse(profileRecord.hobbies) : []);

      const skills = Array.isArray(profileRecord.skills)
        ? profileRecord.skills
        : (profileRecord.skills ? JSON.parse(profileRecord.skills) : []);

      // Parse social_link array to object
      // NocoDB format: [{facebook: "url"}, {instagram: "url"}, ...]
      // Frontend format: {facebook: "url", instagram: "url", ...}
      let socialLinks = {};
      if (Array.isArray(profileRecord.social_link)) {
        profileRecord.social_link.forEach(item => {
          Object.assign(socialLinks, item);
        });
      }

      // Get XP and level from database
      const currentXP = parseInt(profileRecord.current_xp, 10) || 0;
      const maxXP = parseInt(profileRecord.max_xp, 10) || 1000;
      const level = parseInt(profileRecord.level, 10) || 0;

      return {
        id: profileRecord.Id,
        name: profileRecord.name || profileRecord.title || 'Character',
        caption: profileRecord.caption || '',
        currentXP: currentXP,
        maxXP: maxXP,
        level: level,
        hobbies: hobbies,
        skills: skills,
        introduce: profileRecord.introduce || '',
        social: socialLinks,
        avatarUrl: avatarUrl, // Add avatar URL
        createdAt: profileRecord.CreatedAt,
        updatedAt: profileRecord.UpdatedAt
      };
    } catch (error) {
      console.error('❌ Error fetching profile from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch config data from NocoDB
 */
export const fetchConfig = async () => {
  const cacheKey = 'config';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        const configRecord = staticData.config.fields;

        return {
          id: staticData.config.id,
          autoApproveTasks: configRecord.auto_approve_tasks || false,
          levelGrowRate: configRecord.level_grow_rate || 10,
          pwDailyUpdate: configRecord.pw_daily_update || '',
          version: configRecord.version || '1.0',
          xpMultiplier: parseFloat(configRecord.xp_multiplier) || 1,
          createdAt: configRecord.CreatedAt,
          updatedAt: configRecord.UpdatedAt
        };
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.CONFIG}/records`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No config record found in NocoDB');
        return null;
      }

      const configRecord = data.list[0];

      return {
        id: configRecord.Id,
        autoApproveTasks: configRecord.auto_approve_tasks || false,
        levelGrowRate: configRecord.level_grow_rate || 10,
        pwDailyUpdate: configRecord.pw_daily_update || '',
        version: configRecord.version || '1.0',
        xpMultiplier: parseFloat(configRecord.xp_multiplier) || 1,
        createdAt: configRecord.CreatedAt,
        updatedAt: configRecord.UpdatedAt
      };
    } catch (error) {
      console.error('❌ Error fetching config from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch journals data from NocoDB
 * Returns journal entries sorted by created_time descending
 *
 * @param {number} limit - Maximum number of journals to fetch (default: 7 for initial load)
 * @param {number} offset - Number of records to skip (for pagination)
 * @returns {Promise<Array>} Array of journal entries
 */
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
export const fetchQuests = async () => {
  const cacheKey = 'quests';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have quests yet
        return [];
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.QUESTS}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No quest records found in NocoDB');
        return [];
      }

      // Fetched quests

      // Transform NocoDB quests to frontend format
      const quests = data.list.map(record => {
        // Parse quest_name JSON array to get localized names
        const questNameArray = Array.isArray(record.quest_name) ? record.quest_name : [];
        const nameTranslations = {};
        questNameArray.forEach(item => {
          Object.assign(nameTranslations, item);
        });

        // Parse desc JSON array to get localized descriptions
        const descArray = Array.isArray(record.desc) ? record.desc : [];
        const descTranslations = {};
        descArray.forEach(item => {
          Object.assign(descTranslations, item);
        });

        // Get English name as default
        const name = nameTranslations.en || nameTranslations.vi || record.title || 'Unnamed Quest';
        const desc = descTranslations.en || descTranslations.vi || '';

        // Get quest_confirm link ID (NocoDB returns this as quests_confirm_id)
        const questConfirmId = record.quests_confirm_id || null;

        return {
          id: record.Id,
          name: name,
          nameTranslations: nameTranslations,
          desc: desc,
          descTranslations: descTranslations,
          xp: record.xp || 0,
          questsConfirmId: questConfirmId, // Link to quest_confirm (ID of linked record)
          createdAt: record.created_time ? new Date(record.created_time) : null,
          completedAt: record.completed_time ? new Date(record.completed_time) : null,
          updatedAt: record.UpdatedAt
        };
      });

      return quests;
    } catch (error) {
      console.error('❌ Error fetching quests from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch quest confirmations data from NocoDB
 * Returns all quest confirmation records with image data from attachments_gallery
 */
export const fetchQuestConfirmations = async () => {
  const cacheKey = 'quest_confirmations';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have quest confirmations yet
        return [];
      }

      // Step 1: Fetch quest confirmations
      const data = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No quest confirmation records found in NocoDB');
        return [];
      }

      // Fetched quest confirmations

      // Step 2: Fetch all attachments_gallery records that link to these confirmations
      let attachmentsData;

      // Development mode: different schema (no quests_confirm_id field)
      if (!isProductionMode()) {
        // Debug: Log development mode quest confirmations (development only)
        if (!isProductionMode()) {
          console.log('🛠️ Development mode: fetching all attachments for quest confirmations');
        }
        attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=10`, {
          method: 'GET',
        });
      } else {
        // Production mode: original query with quests_confirm_id filtering
        attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,quests_confirm_id`, {
          method: 'GET',
        });
      }

      // Create a map of confirmationId -> attachment for quick lookup
      const attachmentMap = new Map();
      if (attachmentsData.list) {
        attachmentsData.list.forEach(attachment => {
          // Development mode: no quests_confirm_id field, use first attachment for first confirmation
          if (!isProductionMode()) {
            // In development, just use the first attachment for the first confirmation
            if (data.list.length > 0) {
              attachmentMap.set(data.list[0].Id, attachment);
            }
          } else {
            // Production mode: use quests_confirm_id field
            if (attachment.quests_confirm_id) {
              attachmentMap.set(attachment.quests_confirm_id, attachment);
            }
          }
        });
      }

      // Fetched attachments

      // Step 3: Transform and combine data
      const confirmations = data.list.map(record => {
        // Get linked attachment from map
        const attachment = attachmentMap.get(record.Id);

        let imgUrl = null;
        if (attachment && attachment.img_bw) {
          try {
            // Parse img_bw if it's a string (NocoDB returns it as JSON string)
            let imgBwArray = attachment.img_bw;
            if (typeof imgBwArray === 'string') {
              imgBwArray = JSON.parse(imgBwArray);
            }

            // Get first image from array
            if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
              const imgBw = imgBwArray[0];

              // Development mode: use signedPath, Production mode: use signedUrl
              if (!isProductionMode()) {
                imgUrl = imgBw.signedPath || imgBw.path || null;
                // Construct full URL for signedPath
                if (imgUrl) {
                  imgUrl = `${NOCODB_BASE_URL}/${imgUrl}`;
                }
              } else {
                imgUrl = imgBw.signedUrl || imgBw.url || null;
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse img_bw for confirmation:', record.Id, parseError);
          }
        }

        // Quest confirmation processed

        return {
          id: record.Id,
          name: record.quest_name || record.title || 'Unnamed Quest',
          desc: record.desc || '',
          imgUrl: imgUrl,
          status: record.status || 'pending',
          createdAt: record.created_time ? new Date(record.created_time) : new Date(record.CreatedAt)
        };
      });

      return confirmations;
    } catch (error) {
      console.error('❌ Error fetching quest confirmations from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Update config auto_approve_tasks field in NocoDB
 * @param {boolean} enabled - Auto-approve enabled flag
 * @returns {Promise<Object>} Result object with success status
 */
export const updateAutoApproveTasks = async (enabled) => {
  try {
    // Get the config record ID (assuming single config record)
    const configRecords = await nocoRequest(`${TABLE_IDS.CONFIG}/records`, {
      method: 'GET',
    });

    if (!configRecords.list || configRecords.list.length === 0) {
      throw new Error('No config record found');
    }

    const configId = configRecords.list[0].Id;

    // Update the config record
    const updatePayload = [{
      Id: configId,
      auto_approve_tasks: !!enabled
    }];

    // Debug: Log config update (development only)
    if (!isProductionMode()) {
      console.log('🔍 Sending Config auto_approve_tasks PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.CONFIG}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log config update success (development only)
    if (!isProductionMode()) {
      console.log('✅ Config auto_approve_tasks updated successfully in NocoDB:', response);
    }
    return { success: true, value: !!enabled };
  } catch (error) {
    console.error('❌ Error updating auto_approve_tasks in NocoDB:', error);
    throw new Error(`Failed to update config: ${error.message}`);
  }
};

/**
 * Update profile data in NocoDB
 * Only updates fields that have changed
 */
export const updateProfile = async (profileData, oldProfileData) => {
  try {
    const updates = {};
    let hasChanges = false;

    // Check introduce field
    if (profileData.introduce !== undefined && profileData.introduce !== oldProfileData.introduce) {
      updates.introduce = profileData.introduce;
      hasChanges = true;
      // Debug: Log profile changes (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('📝 Profile introduce changed:', { old: oldProfileData.introduce, new: profileData.introduce });
      }
    }

    // Check caption field
    if (profileData.caption !== undefined && profileData.caption !== oldProfileData.caption) {
      updates.caption = profileData.caption;
      hasChanges = true;
      // Debug: Log caption changes (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('📝 Profile caption changed:', { old: oldProfileData.caption, new: profileData.caption });
      }
    }

    // Check skills array
    if (profileData.skills !== undefined) {
      const oldSkills = JSON.stringify(oldProfileData.skills || []);
      const newSkills = JSON.stringify(profileData.skills || []);
      if (oldSkills !== newSkills) {
        updates.skills = profileData.skills;
        hasChanges = true;
        // Debug: Log skills changes (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('📝 Profile skills changed:', { old: oldProfileData.skills, new: profileData.skills });
        }
      }
    }

    // Check hobbies array
    if (profileData.hobbies !== undefined) {
      const oldHobbies = JSON.stringify(oldProfileData.hobbies || []);
      const newHobbies = JSON.stringify(profileData.hobbies || []);
      if (oldHobbies !== newHobbies) {
        updates.hobbies = profileData.hobbies;
        hasChanges = true;
        // Debug: Log hobbies changes (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('📝 Profile hobbies changed:', { old: oldProfileData.hobbies, new: profileData.hobbies });
        }
      }
    }

    if (!hasChanges) {
      return { success: true, message: 'No changes to save' };
    }

    // Get the profile record ID (assuming single profile record)
    const profileRecords = await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'GET',
    });

    if (!profileRecords.list || profileRecords.list.length === 0) {
      throw new Error('No profile record found');
    }

    const profileId = profileRecords.list[0].Id;

    // Update the profile record
    const updatePayload = [{
      Id: profileId,
      ...updates
    }];

    await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('❌ Error updating profile in NocoDB:', error);
    throw error;
  }
};

/**
 * Update profile XP and handle level-ups
 * @param {number} xpToAdd - Amount of XP to add (before multiplier)
 * @returns {Promise<Object>} Result with XP and level info
 */
export const updateProfileXP = async (xpToAdd) => {
  try {
    // Get current profile and config
    const [profile, config] = await Promise.all([
      fetchProfile(),
      fetchConfig()
    ]);

    if (!profile) {
      throw new Error('No profile found');
    }

    if (!config) {
      throw new Error('No config found');
    }

    // Apply XP multiplier from config
    const xpMultiplier = parseFloat(config.xpMultiplier) || 1;
    const actualXpToAdd = Math.floor(xpToAdd * xpMultiplier);

    const currentXP = parseInt(profile.currentXP, 10) || 0;
    const currentLevel = parseInt(profile.level, 10) || 0;
    let currentMaxXP = parseInt(profile.maxXP, 10) || 1000;

    // Get level grow rate from config (percentage)
    const levelGrowRate = parseInt(config.levelGrowRate, 10) || 10;

    // Add XP
    let newXP = currentXP + actualXpToAdd;
    let newLevel = currentLevel;
    let newMaxXP = currentMaxXP;
    let leveledUp = false;
    let levelsGained = 0;

    // Check for level up (can level up multiple times if XP is high enough)
    // maxXP increases by level_grow_rate% each level
    // When leveling up, excess XP is reduced by half
    while (newXP >= newMaxXP) {
      newXP -= newMaxXP;
      newLevel += 1;
      levelsGained += 1;
      leveledUp = true;

      // Increase maxXP by level_grow_rate% for next level
      newMaxXP = Math.floor(newMaxXP * (1 + levelGrowRate / 100));

      // Reduce excess XP by half (penalty for leveling up)
      newXP = Math.floor(newXP / 2);
    }

    // Get the profile record ID
    const profileRecords = await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'GET',
    });

    if (!profileRecords.list || profileRecords.list.length === 0) {
      throw new Error('No profile record found');
    }

    const profileId = profileRecords.list[0].Id;

    // Update profile with new XP, level, and maxXP
    const updatePayload = [{
      Id: profileId,
      current_xp: newXP,
      level: newLevel,
      max_xp: newMaxXP
    }];

    await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    return {
      success: true,
      oldXP: currentXP,
      newXP,
      addedXP: actualXpToAdd,
      rawXP: xpToAdd,
      xpMultiplier: xpMultiplier,
      oldLevel: currentLevel,
      newLevel,
      levelsGained,
      leveledUp,
      oldMaxXP: currentMaxXP,
      maxXP: newMaxXP,
      levelGrowRate: levelGrowRate
    };

  } catch (error) {
    console.error('❌ Error updating profile XP:', error);
    throw new Error(`Failed to update XP: ${error.message}`);
  }
};

/**
 * Save status data to NocoDB
 * Updates the existing status record
 */
export const saveStatus = async (statusData) => {
  try {
    // Get the current status record to find the ID
    const currentStatus = await fetchStatus();

    if (!currentStatus || !currentStatus.id) {
      throw new Error('No status record found to update');
    }

    const normalizeArray = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
          .filter(Boolean);
      }
      if (value === undefined || value === null) {
        return [];
      }
      const strValue = typeof value === 'string' ? value.trim() : String(value).trim();
      return strValue ? [strValue] : [];
    };

    const prependStatusValue = (newValue, existingList) => {
      const existing = normalizeArray(existingList);
      const strValue = typeof newValue === 'string' ? newValue.trim() : String(newValue || '').trim();

      if (!strValue) {
        return [];
      }

      const filteredExisting = existing.filter(
        (item) => item.toLowerCase() !== strValue.toLowerCase()
      );

      return [strValue, ...filteredExisting];
    };

    const currentActivities = normalizeArray(currentStatus.doing);
    const currentLocations = normalizeArray(currentStatus.location);
    const currentMoods = normalizeArray(currentStatus.mood);

    const updates = {};

    // Map frontend fields to NocoDB columns
    // Note: NocoDB columns are JSON/Array, so we wrap strings in arrays if needed
    if (statusData.doing !== undefined) {
      updates.current_activity = prependStatusValue(statusData.doing, currentActivities);
    }

    if (statusData.location !== undefined) {
      updates.location = prependStatusValue(statusData.location, currentLocations);
    }

    if (statusData.mood !== undefined) {
      updates.mood = prependStatusValue(statusData.mood, currentMoods);
    }

    // If no updates, return success
    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No data to save' };
    }

    const updatePayload = [{
      Id: currentStatus.id,
      ...updates
    }];

    // Debug: Log status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.STATUS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log status update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Status updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Status updated' };
  } catch (error) {
    console.error('❌ Error saving status to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Save journal entry to NocoDB
 * Creates a new journal record
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
const createMediaUploadJournal = async (eventType, description = '') => {
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
export const fetchAchievements = async () => {
  const cacheKey = 'achievements';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have achievements yet
        return [];
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No achievement records found in NocoDB');
        return [];
      }

      // Fetched achievements

      // Transform NocoDB achievements to frontend format
      const achievements = data.list.map(record => {
        // Parse achievement_name JSON array to get localized names
        const achievementNameArray = Array.isArray(record.achievement_name) ? record.achievement_name : [];
        const nameTranslations = {};
        achievementNameArray.forEach(item => {
          Object.assign(nameTranslations, item);
        });

        // Parse desc JSON array to get localized descriptions
        const descArray = Array.isArray(record.desc) ? record.desc : [];
        const descTranslations = {};
        descArray.forEach(item => {
          Object.assign(descTranslations, item);
        });

        // Parse special_reward JSON array to get localized special rewards
        const specialRewardArray = Array.isArray(record.special_reward) ? record.special_reward : [];
        const specialRewardTranslations = {};
        specialRewardArray.forEach(item => {
          Object.assign(specialRewardTranslations, item);
        });

        // Get English name as default
        const name = nameTranslations.en || nameTranslations.vi || record.title || 'Unnamed Achievement';
        const desc = descTranslations.en || descTranslations.vi || '';
        const specialReward = specialRewardTranslations.en || specialRewardTranslations.vi || '';

        // Determine status based on achievement_confirm
        // If achievement_confirm has value (linked record), it's pending review
        // If no value, it's available (pending)
        const hasConfirmation = record.achievement_confirm !== null && record.achievement_confirm !== undefined;

        // Parse due_date to ICT timezone if exists
        let dueDate = null;
        if (record.due_date) {
          try {
            // NocoDB returns date in UTC format: "2025-12-06 00:00:00+00:00"
            // Convert to ICT (UTC+7) for display
            const utcDate = new Date(record.due_date);
            // Convert to ICT by using toLocaleString
            const ictDateStr = utcDate.toLocaleString('en-US', {
              timeZone: 'Asia/Bangkok',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            dueDate = new Date(ictDateStr);
          } catch (e) {
            console.warn('⚠️ Failed to parse due_date:', record.due_date, e);
            dueDate = record.due_date;
          }
        }

        return {
          id: record.Id,
          name: name,
          nameTranslations: nameTranslations,
          desc: desc,
          descTranslations: descTranslations,
          specialReward: specialReward,
          specialRewardTranslations: specialRewardTranslations,
          icon: record.icon || '🏆',
          xp: record.xp || 0,
          dueDate: dueDate,
          achievementConfirmId: record.achievement_confirm || null, // Link to achievement_confirm
          hasConfirmation: hasConfirmation, // Helper flag
          createdAt: record.created_time ? new Date(record.created_time) : null,
          completedAt: record.completed_time ? new Date(record.completed_time) : null, // Completed timestamp
          updatedAt: record.UpdatedAt
        };
      });

      return achievements;
    } catch (error) {
      console.error('❌ Error fetching achievements from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch achievement confirmations data from NocoDB
 * Returns all achievement confirmation records with image data from attachments_gallery
 */
export const fetchAchievementConfirmations = async () => {
  const cacheKey = 'achievement_confirmations';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Use static data in development
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        // Static data doesn't have achievement confirmations yet
        return [];
      }

      // Step 1: Fetch achievement confirmations
      const data = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No achievement confirmation records found in NocoDB');
        return [];
      }

      // Fetched achievement confirmations

      // Step 2: Fetch all attachments_gallery records that link to these confirmations
      const attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,achievements_confirm_id`, {
        method: 'GET',
      });

      // Create a map of confirmationId -> attachment for quick lookup
      const attachmentMap = new Map();
      if (attachmentsData.list) {
        attachmentsData.list.forEach(attachment => {
          if (attachment.achievements_confirm_id) {
            attachmentMap.set(attachment.achievements_confirm_id, attachment);
          }
        });
      }

      // Fetched achievement attachments

      // Step 3: Transform and combine data
      const confirmations = data.list.map(record => {
        // Get linked attachment from map
        const attachment = attachmentMap.get(record.Id);

        let imageUrl = null;
        if (attachment && attachment.img_bw) {
          try {
            // Parse img_bw if it's a string (NocoDB returns it as JSON string)
            let imgBwArray = attachment.img_bw;
            if (typeof imgBwArray === 'string') {
              imgBwArray = JSON.parse(imgBwArray);
            }

            // Get first image from array
            if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
              const imgBw = imgBwArray[0];
              // Prefer signedUrl for S3 access, fallback to url
              imageUrl = imgBw.signedUrl || imgBw.url || null;
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse img_bw for achievement confirmation:', record.Id, parseError);
          }
        }

        // Achievement confirmation processed

        return {
          id: record.Id,
          title: record.title || '',
          achievementName: record.achievement_name || '',
          desc: record.desc || '',
          achievementsId: record.achievements_id || null,
          imageUrl: imageUrl,
          createdAt: record.created_time ? new Date(record.created_time) : null,
          updatedAt: record.UpdatedAt
        };
      });

      return confirmations;
    } catch (error) {
      console.error('❌ Error fetching achievement confirmations from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Create quest in NocoDB
 * @param {Object} questData - Quest data
 * @param {string} questData.nameEn - English name
 * @param {string} questData.nameVi - Vietnamese name
 * @param {string} questData.descEn - English description
 * @param {string} questData.descVi - Vietnamese description
 * @param {number} questData.xp - XP value
 * @param {boolean} questData.scheduleEnabled - Whether schedule is enabled
 * @param {string} questData.scheduleTime - Schedule time in HH:mm format
 * @returns {Promise<Object>} Result object with success status
 */
export const createQuest = async (questData) => {
  try {
    const { nameEn, nameVi, descEn, descVi, xp, scheduleEnabled, scheduleTime } = questData;

    // Validate required fields
    if (!nameEn || !nameVi) {
      return { success: false, message: 'Quest name (EN and VI) is required' };
    }

    // Get current ICT time
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

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: quest_<year>-<month>-<day>_<hh>-<mm>
    const title = `quest_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Format quest_name and desc as array of objects
    const questName = [
      { "en": nameEn },
      { "vi": nameVi }
    ];

    const desc = [
      { "en": descEn || '' },
      { "vi": descVi || '' }
    ];

    const payload = {
      title: title,
      quest_name: questName,
      desc: desc,
      xp: xp || 0,
      created_time: createdTime,
      // Schedule fields
      schedule_enabled: scheduleEnabled || false,
      schedule_time: scheduleEnabled ? scheduleTime : null
    };

    // Debug: Log quest creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log quest creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest created successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest created', data: response };
  } catch (error) {
    console.error('❌ Error creating quest in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Create achievement in NocoDB
 * @param {Object} achievementData - Achievement data
 * @param {string} achievementData.nameEn - English name
 * @param {string} achievementData.nameVi - Vietnamese name
 * @param {string} achievementData.descEn - English description
 * @param {string} achievementData.descVi - Vietnamese description
 * @param {string} achievementData.icon - Icon emoji
 * @param {number} achievementData.xp - XP value
 * @param {string} achievementData.specialRewardEn - English special reward (optional)
 * @param {string} achievementData.specialRewardVi - Vietnamese special reward (optional)
 * @param {string} achievementData.dueDate - Due date in YYYY-MM-DD format (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const createAchievement = async (achievementData) => {
  try {
    const { nameEn, nameVi, descEn, descVi, icon, xp, specialRewardEn, specialRewardVi, dueDate } = achievementData;

    // Validate required fields
    if (!nameEn || !nameVi) {
      return { success: false, message: 'Achievement name (EN and VI) is required' };
    }

    // Get current ICT time
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

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: achievement_<year>-<month>-<day>_<hh>-<mm>
    const title = `achievement_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Format achievement_name and desc as array of objects
    const achievementName = [
      { "en": nameEn },
      { "vi": nameVi }
    ];

    const desc = [
      { "en": descEn || '' },
      { "vi": descVi || '' }
    ];

    // Format special_reward as array of objects (only if provided)
    const specialReward = (specialRewardEn || specialRewardVi) ? [
      { "en": specialRewardEn || '' },
      { "vi": specialRewardVi || '' }
    ] : null;

    const payload = {
      title: title,
      achievement_name: achievementName,
      desc: desc,
      icon: icon || '🏆',
      xp: xp || 0,
      created_time: createdTime
    };

    // Add optional fields if provided
    if (specialReward) {
      payload.special_reward = specialReward;
      // Debug: Log special reward added (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Added special_reward to payload:', payload.special_reward);
      }
    } else {
      // Debug: Log no special reward (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('⚠️ No special_reward provided');
      }
    }

    if (dueDate) {
      payload.due_date = dueDate;
    }

    // Debug: Log achievement creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement POST to NocoDB:', JSON.stringify(payload, null, 2));
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log achievement creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement created successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement created', data: response };
  } catch (error) {
    console.error('❌ Error creating achievement in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete quest from NocoDB
 * @param {string} questId - Quest ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteQuest = async (questId) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: questId }])
    });

    // Debug: Log quest deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest deleted successfully from NocoDB');
    }
    return { success: true, message: 'Quest deleted' };
  } catch (error) {
    console.error('❌ Error deleting quest from NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete achievement from NocoDB
 * @param {string} achievementId - Achievement ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteAchievement = async (achievementId) => {
  try {
    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: achievementId }])
    });

    // Debug: Log achievement deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement deleted successfully from NocoDB');
    }
    return { success: true, message: 'Achievement deleted' };
  } catch (error) {
    console.error('❌ Error deleting achievement from NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update quest confirmation status in NocoDB
 * @param {string} confirmationId - Quest confirmation ID to update
 * @param {string} status - Status value ('pending', 'completed', 'failed')
 * @returns {Promise<Object>} Result object with success status
 */
export const updateQuestConfirmationStatus = async (confirmationId, status) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Quest confirmation ID is required' };
    }

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return { success: false, message: 'Invalid status value' };
    }

    const updatePayload = [{
      Id: confirmationId,
      status: status
    }];

    // Debug: Log quest confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log quest confirmation status update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation status updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest confirmation status updated' };
  } catch (error) {
    console.error('❌ Error updating quest confirmation status in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update achievement confirmation status in NocoDB
 * @param {string} confirmationId - Achievement confirmation ID to update
 * @param {string} status - Status value ('pending', 'completed', 'failed')
 * @returns {Promise<Object>} Result object with success status
 */
export const updateAchievementConfirmationStatus = async (confirmationId, status) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Achievement confirmation ID is required' };
    }

    if (!['pending', 'completed', 'failed'].includes(status)) {
      return { success: false, message: 'Invalid status value' };
    }

    const updatePayload = [{
      Id: confirmationId,
      status: status
    }];

    // Debug: Log achievement confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log achievement confirmation status update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation status updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement confirmation status updated' };
  } catch (error) {
    console.error('❌ Error updating achievement confirmation status in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Batch update multiple quest confirmation statuses in NocoDB
 * @param {Array<{id: string, status: string}>} updates - Array of updates with id and status
 * @returns {Promise<Object>} Result object with success status
 */
export const batchUpdateQuestConfirmationStatus = async (updates) => {
  try {
    if (!updates || updates.length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    // Validate all updates
    for (const update of updates) {
      if (!update.id || !['pending', 'completed', 'failed'].includes(update.status)) {
        return { success: false, message: 'Invalid update data' };
      }
    }

    const updatePayload = updates.map(u => ({
      Id: u.id,
      status: u.status
    }));

    // Debug: Log batch quest confirmation status update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Batch Quest Confirmation Status PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log batch update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`✅ ${updates.length} quest confirmation statuses updated successfully in NocoDB`);
    }
    return { success: true, message: `${updates.length} quest confirmations updated` };
  } catch (error) {
    console.error('❌ Error batch updating quest confirmation statuses in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Unlink quest confirmation from quest in NocoDB
 * Removes the relationship between quest and quest_confirm
 * @param {string} questId - Quest ID to unlink from
 * @param {string} confirmationId - Confirmation ID to unlink (required for negative ID method)
 * @returns {Promise<Object>} Result object with success status
 */
export const unlinkQuestConfirmation = async (questId, confirmationId) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    // NocoDB Link field unlink syntax for one-to-one relationship:
    // Need to unlink from BOTH sides of the relationship

    // 1. Unlink from quest side (quest.quest_confirm = null)
    const questUpdatePayload = [{
      Id: questId,
      quest_confirm: null
    }];

    // Debug: Log quest unlink (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest side):', questUpdatePayload);
    }

    const questResponse = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(questUpdatePayload)
    });

    // Debug: Log quest unlink success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest side unlinked:', questResponse);
    }

    // 2. Unlink from quest_confirm side (quest_confirm.quest = null)
    if (confirmationId) {
      const confirmUpdatePayload = [{
        Id: confirmationId,
        quest: null
      }];

      // Debug: Log quest confirmation unlink (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest_confirm side):', confirmUpdatePayload);
      }

      const confirmResponse = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
        method: 'PATCH',
        body: JSON.stringify(confirmUpdatePayload)
      });

      // Debug: Log quest confirmation unlink success (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Quest_confirm side unlinked:', confirmResponse);
      }
    }

    return { success: true, message: 'Quest confirmation unlinked from both sides' };

  } catch (error) {
    console.error('❌ Error unlinking quest confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update quest in NocoDB
 * @param {string} questId - Quest ID to update
 * @param {Object} updates - Fields to update
 * @param {Date} updates.completedAt - Completion timestamp (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const updateQuest = async (questId, updates) => {
  try {
    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    const payload = {};

    // Handle completedAt field
    if (updates.completedAt) {
      // Get current ICT time
      const completedDate = updates.completedAt instanceof Date ? updates.completedAt : new Date(updates.completedAt);

      const ictDateStr = completedDate.toLocaleString('en-US', {
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

      // Format completed_time with timezone offset
      payload.completed_time = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
    }

    // If no updates, return success
    if (Object.keys(payload).length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    const updatePayload = [{
      Id: questId,
      ...payload
    }];

    await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });
    return { success: true, message: 'Quest updated' };
  } catch (error) {
    console.error('❌ Error updating quest in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Update achievement in NocoDB
 * @param {string} achievementId - Achievement ID to update
 * @param {Object} updates - Fields to update
 * @param {Date} updates.completedAt - Completion timestamp (optional)
 * @returns {Promise<Object>} Result object with success status
 */
export const updateAchievement = async (achievementId, updates) => {
  try {
    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    const payload = {};

    // Handle completedAt field
    if (updates.completedAt) {
      // Get current ICT time
      const completedDate = updates.completedAt instanceof Date ? updates.completedAt : new Date(updates.completedAt);

      const ictDateStr = completedDate.toLocaleString('en-US', {
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

      // Format completed_time with timezone offset
      payload.completed_time = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
    }

    // If no updates, return success
    if (Object.keys(payload).length === 0) {
      return { success: true, message: 'No updates to apply' };
    }

    const updatePayload = [{
      Id: achievementId,
      ...payload
    }];

    // Debug: Log achievement update (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement PATCH to NocoDB:', updatePayload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log achievement update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement updated successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement updated' };
  } catch (error) {
    console.error('❌ Error updating achievement in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload image to attachments_gallery and link to quest_confirm
 * @param {File} imageFile - Image file to upload
 * @param {string} title - Title for the attachment record
 * @param {string} questConfirmId - Quest confirmation ID to link to
 * @returns {Promise<Object>} Result with attachment gallery ID
 */
export const uploadQuestConfirmationImage = async (imageFile, title, questConfirmId) => {
  try {
    if (!imageFile || !title) {
      return { success: false, message: 'Image file and title are required' };
    }

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = {
      title: title
    };

    // Debug: Log attachment creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Creating attachment gallery record:', recordPayload);
    }

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create attachment gallery record');
    }

    console.log('✅ Attachment gallery record created:', attachmentId);

    // Step 2: Upload the image to img_bw column using NocoDB storage API
    // NocoDB file upload endpoint: /api/v2/tables/{tableId}/columns/{columnId}
    const formData = new FormData();
    formData.append('file', imageFile);

    // Upload to NocoDB storage first
    const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

    const storageResponse = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      body: formData
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      throw new Error(`Storage upload failed: ${storageResponse.status} - ${errorText}`);
    }

    const storageResult = await storageResponse.json();
    // Debug: Log image upload success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Image uploaded to NocoDB storage:', storageResult);
    }

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult // NocoDB returns array of file objects
    }];

    // Debug: Log record update with image (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Updating record with image:', updatePayload);
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log record update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Record updated with image');
    }

    // Step 4: Link the attachment to quest_confirm if ID provided
    if (questConfirmId) {
      // Try using the foreign key field directly instead of the link field
      const linkPayload = [{
        Id: attachmentId,
        quests_confirm_id: questConfirmId // Use foreign key field name
      }];

      // Debug: Log attachment linking (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Linking attachment to quest_confirm (using FK):', linkPayload);
      }

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      // Debug: Log attachment linking success (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Attachment linked to quest_confirm. Response:', linkResponse);
      }

      // Verify the link was created
      const verifyResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records/${attachmentId}`, {
        method: 'GET'
      });
      // Debug: Log attachment verification (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Verify attachment record after FK link:', verifyResponse);
      }
    }

    return {
      success: true,
      attachmentId: attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading quest confirmation image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check if a quest is overdue (created before today in ICT timezone)
 * @param {Date} createdAt - Quest creation date
 * @returns {boolean} True if quest is overdue
 */
export const isQuestOverdue = (createdAt) => {
  if (!createdAt) return false;

  // Get today's date in ICT timezone (UTC+7)
  const now = new Date();
  const ictDateStr = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [month, day, year] = ictDateStr.split(', ')[0].split('/');
  const todayICT = new Date(`${year}-${month}-${day}T00:00:00+07:00`);

  // Convert createdAt to ICT timezone
  const createdDate = new Date(createdAt);
  const createdICTStr = createdDate.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [cMonth, cDay, cYear] = createdICTStr.split(', ')[0].split('/');
  const createdICT = new Date(`${cYear}-${cMonth}-${cDay}T00:00:00+07:00`);

  // Quest is overdue if created before today
  return createdICT < todayICT;
};

/**
 * Check if an achievement is overdue (past due date in ICT timezone)
 * @param {Date} dueDate - Achievement due date
 * @returns {boolean} True if achievement is overdue
 */
export const isAchievementOverdue = (dueDate) => {
  if (!dueDate) return false;

  // Get today's date in ICT timezone (UTC+7)
  const now = new Date();
  const ictDateStr = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [month, day, year] = ictDateStr.split(', ')[0].split('/');
  const todayICT = new Date(`${year}-${month}-${day}T00:00:00+07:00`);

  // Convert dueDate to ICT timezone
  const dueDateObj = new Date(dueDate);
  const dueICTStr = dueDateObj.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const [dMonth, dDay, dYear] = dueICTStr.split(', ')[0].split('/');
  const dueICT = new Date(`${dYear}-${dMonth}-${dDay}T00:00:00+07:00`);

  // Achievement is overdue if due date is before today
  return dueICT < todayICT;
};

/**
 * Save quest confirmation to NocoDB
 * Creates a new quest confirmation record and links it to the quest
 * If image is provided, uploads to attachments_gallery
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.questId - Quest ID to link to
 * @param {string} confirmData.questName - Quest name
 * @param {string} confirmData.desc - Description
 * @param {File} confirmData.imageFile - Image file to upload (optional)
 * @param {string} confirmData.imgUrl - Legacy image URL (optional, for backward compatibility)
 * @param {Date} confirmData.questCreatedAt - Quest creation date (for overdue check)
 * @param {boolean} confirmData.autoApprove - Auto-approve flag from config
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */
export const saveQuestConfirmation = async (confirmData) => {
  try {
    const { questId, questName, desc, imageFile, imgUrl, questCreatedAt, autoApprove } = confirmData;

    if (!questId) {
      return { success: false, message: 'Quest ID is required' };
    }

    // Get current ICT time
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

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: quest_confirm_<year>-<month>-<day>_<hh>-<mm>
    const title = `quest_confirm_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Determine initial status based on auto-approve and overdue check
    let initialStatus = 'pending';
    let shouldAutoComplete = false;

    if (autoApprove) {
      // Check if quest is overdue (created before today)
      const isOverdue = isQuestOverdue(questCreatedAt);

      if (isOverdue) {
        // Quest is overdue - mark as failed, auto-approve is disabled
        initialStatus = 'failed';
        // Debug: Log overdue quest warning (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('⚠️ Quest is overdue, marking as failed (auto-approve disabled)');
        }
      } else {
        // Quest is within deadline - auto-approve as completed
        initialStatus = 'completed';
        shouldAutoComplete = true;

      }
    }

    const payload = {
      title: title,
      quest_name: questName || '',
      desc: desc || '',
      created_time: createdTime,
      quest: questId, // Link to quest record (1-1 relationship)
      status: initialStatus
    };

    // Debug: Log quest confirmation creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Quest Confirmation POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log quest confirmation creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation created successfully in NocoDB:', response);
    }

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadQuestConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          // Debug: Log image upload success (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Image uploaded and linked to quest confirmation');
          }

          // Note: In NocoDB one-to-one relationship with belongs-to side,
          // we only need to update the belongs-to side (attachments_gallery.quest_confirm)
          // The other side (quests_confirm.quest_img) will be automatically linked
          // Debug: Log one-to-one link (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('ℹ️ One-to-one link established from belongs-to side (attachments_gallery)');
          }
        } else {
          console.warn('⚠️ Image upload failed:', uploadResult.message);
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload failed:', uploadError.message);
        // Continue without image
      }
    }

    return {
      success: true,
      message: 'Quest confirmation saved',
      id: confirmationId,
      attachmentId: attachmentId,
      shouldAutoComplete: shouldAutoComplete, // Flag to indicate if quest should be auto-completed
      autoApproved: shouldAutoComplete,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving quest confirmation to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete quest confirmation from NocoDB
 * Also deletes linked attachment from attachments_gallery
 * @param {string} confirmationId - Quest confirmation ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteQuestConfirmation = async (confirmationId) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Quest confirmation ID is required' };
    }

    // Debug: Log quest confirmation deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Deleting Quest Confirmation:', confirmationId);
    }

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(quests_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));

        // Debug: Log linked quest attachments deletion (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log(`🗑️ Deleting ${attachmentIds.length} linked attachment(s) from attachments_gallery`);
        }

        await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
          method: 'DELETE',
          body: JSON.stringify(attachmentIds)
        });

        // Debug: Log attachments deletion success (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Linked attachments deleted successfully');
        }
      } else {
        // Debug: Log no linked attachments (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('ℹ️ No linked attachments found for this confirmation');
        }
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the quest confirmation record
    // Debug: Log quest confirmation record deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🗑️ Deleting quest confirmation record');
    }

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    // Debug: Log quest confirmation deletion success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest confirmation deleted successfully in NocoDB:', response);
    }
    return { success: true, message: 'Quest confirmation and linked attachments deleted' };
  } catch (error) {
    console.error('❌ Error deleting quest confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload image to attachments_gallery and link to achievement_confirm
 * @param {File} imageFile - Image file to upload
 * @param {string} title - Title for the attachment record
 * @param {string} achievementConfirmId - Achievement confirmation ID to link to
 * @returns {Promise<Object>} Result with attachment gallery ID
 */
export const uploadAchievementConfirmationImage = async (imageFile, title, achievementConfirmId) => {
  try {
    if (!imageFile || !title) {
      return { success: false, message: 'Image file and title are required' };
    }

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = {
      title: title
    };

    console.log('🔍 Creating attachment gallery record for achievement:', recordPayload);

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create attachment gallery record');
    }

    console.log('✅ Attachment gallery record created:', attachmentId);

    // Step 2: Upload the image to NocoDB storage
    const formData = new FormData();
    formData.append('file', imageFile);

    const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

    const storageResponse = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      body: formData
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      throw new Error(`Storage upload failed: ${storageResponse.status} - ${errorText}`);
    }

    const storageResult = await storageResponse.json();
    // Debug: Log image upload success for achievement (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Image uploaded to NocoDB storage for achievement');
    }

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult
    }];

    // Debug: Log record update with image (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Updating record with image');
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Debug: Log record update success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Record updated with image');
    }

    // Step 4: Link the attachment to achievement_confirm if ID provided
    if (achievementConfirmId) {
      const linkPayload = [{
        Id: attachmentId,
        achievements_confirm_id: achievementConfirmId // Use foreign key field name
      }];

      // Debug: Log attachment linking to achievement (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Linking attachment to achievement_confirm (using FK):', linkPayload);
      }

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      // Debug: Log attachment linking success to achievement (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('✅ Attachment linked to achievement_confirm. Response:', linkResponse);
      }
    }

    return {
      success: true,
      attachmentId: attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading achievement confirmation image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Save achievement confirmation to NocoDB
 * Creates a new achievement confirmation record and links it to the achievement
 * If image is provided, uploads to attachments_gallery
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.achievementId - Achievement ID to link to
 * @param {string} confirmData.achievementName - Achievement name
 * @param {string} confirmData.desc - Description
 * @param {File} confirmData.imageFile - Image file to upload (optional)
 * @param {Date} confirmData.achievementDueDate - Achievement due date (for overdue check)
 * @param {boolean} confirmData.autoApprove - Auto-approve flag from config
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */

/**
 * Generate gallery title for profile images
 * Format: journal_<year>-<month>-<day>_<hh>-<mm>-<random3digits>
 */
const generateProfileGalleryTitle = () => {
  const now = new Date();
  const ictDateStr = now.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const [datePart, timePart] = ictDateStr.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');

  const random = Math.floor(100 + Math.random() * 900); // 100-999
  return `journal_${year}-${month}-${day}_${hours}-${minutes}-${random}`;
};

/**
 * Upload a single profile gallery image to attachments_gallery and link to profile
 * Uses img_bw column and profile_id foreign key (production)
 * In development, only attachment record and file are created (no FK field)
 */
export const uploadProfileGalleryImage = async (imageFile, profileId) => {
  try {
    if (!imageFile) {
      return { success: false, message: 'Image file is required' };
    }

    const debugEnabled = import.meta.env.MODE !== 'production' || import.meta.env.MODE === 'staging';

    const title = generateProfileGalleryTitle();

    // Step 1: Create the attachment gallery record with only title
    const recordPayload = { title };

    if (debugEnabled) {
      console.log('🔍 Creating profile gallery attachment record:', recordPayload);
    }

    const recordResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'POST',
      body: JSON.stringify(recordPayload)
    });

    const attachmentId = recordResponse.Id || (recordResponse.list && recordResponse.list[0]?.Id);

    if (!attachmentId) {
      throw new Error('Failed to create profile gallery attachment record');
    }

    if (debugEnabled) {
      console.log('✅ Profile gallery attachment record created:', attachmentId);
    }

    // Step 2: Upload the image file to NocoDB storage
    const formData = new FormData();
    formData.append('file', imageFile);

    const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

    const storageResponse = await fetch(storageUploadUrl, {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_TOKEN,
      },
      body: formData
    });

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text();
      throw new Error(`Storage upload failed: ${storageResponse.status} - ${errorText}`);
    }

    const storageResult = await storageResponse.json();

    if (debugEnabled) {
      console.log('✅ Profile gallery image uploaded to NocoDB storage:', storageResult);
    }

    // Step 3: Update the attachment record with img_bw
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult
    }];

    if (debugEnabled) {
      console.log('🔍 Updating profile gallery attachment with image data:', updatePayload);
    }

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    // Step 4: Link to profile via foreign key in production (profile_id)
    if (profileId && isProductionMode()) {
      const linkPayload = [{
        Id: attachmentId,
        profile_id: profileId
      }];

      if (debugEnabled) {
        console.log('🔍 Linking profile gallery attachment to profile_id:', linkPayload);
      }

      await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });
    }

    return {
      success: true,
      attachmentId,
      data: storageResult
    };
  } catch (error) {
    console.error('❌ Error uploading profile gallery image:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload profile gallery images to NocoDB
 * @param {string} profileId - Profile ID to link images to (production)
 * @param {File[]} imageFiles - Array of image files
 * @param {string} description - Gallery description
 */
export const uploadProfileGalleryImages = async (profileId, imageFiles, description = '') => {
  if (!imageFiles || imageFiles.length === 0) {
    return { success: false, message: 'No images to upload', uploadedCount: 0, totalCount: 0 };
  }

  try {
    // Debug: Log profile gallery upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Starting profile gallery upload:', { profileId, imageCount: imageFiles.length });
    }

    // Step 1: Upload all images to NocoDB storage
    const uploadedImages = [];

    // Debug: Log image upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`📤 Starting upload of ${imageFiles.length} gallery images`);
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      // Debug: Log individual image upload (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`📸 Uploading gallery image ${i + 1}/${imageFiles.length}:`, imageFile.name);
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

      const storageResponse = await fetch(storageUploadUrl, {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData
      });

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        // Debug: Log storage upload error (development only)
        if (import.meta.env.MODE !== 'production') {
          console.warn(`⚠️ Failed to upload gallery image ${i + 1}: ${errorText}`);
          console.warn(`⚠️ Storage response status: ${storageResponse.status}`);
        }
        continue; // Skip failed uploads
      }

      const storageResult = await storageResponse.json();
      // NocoDB storage upload returns an array, we need the first element
      const imageData = Array.isArray(storageResult) ? storageResult[0] : storageResult;

      // Debug: Log storage upload result (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`✅ Gallery image ${i + 1} uploaded successfully:`, imageData);
      }

      uploadedImages.push(imageData);
    }

    if (uploadedImages.length === 0) {
      return { success: false, message: 'Failed to upload any gallery images', uploadedCount: 0, totalCount: imageFiles.length };
    }

    // Step 2: Create single gallery record with all images
    // Generate title: gallery-YYYY-MM-DD-HHMMSS-XXX (XXX = 3-digit random + timestamp for uniqueness)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const galleryTitle = `gallery-${year}-${month}-${day}-${hours}${minutes}${seconds}-${randomDigits}`;

    const payload = {
      title: galleryTitle,
      img_bw: uploadedImages,
      created_time: getUTC7Timestamp()
    };

    // Add description if provided
    if (description && description.trim()) {
      payload.desc = description.trim();
    }

    // NOTE: Gallery records are standalone and NOT linked to profiles
    // Each submission creates a new gallery record with unique timestamp-based title

    // Create new gallery record
    console.log('🔍 Creating new gallery record with payload:', {
      ...payload,
      img_bw: `[${uploadedImages.length} images]`,
      mode: import.meta.env.MODE,
      tableId: TABLE_IDS.ATTACHMENTS_GALLERY
    });

    let response;
    try {
      response = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('✅ Gallery created successfully:', response);
    } catch (error) {
      console.error('❌ Failed to create gallery record:', {
        error: error.message,
        payload: {
          ...payload,
          img_bw: uploadedImages.length > 0 ? uploadedImages[0] : null
        },
        tableId: TABLE_IDS.ATTACHMENTS_GALLERY
      });
      throw error;
    }

    const galleryId = response.Id || (response.list && response.list[0]?.Id);

    // Create journal entry for gallery upload
    try {
      await createMediaUploadJournal('gallery', description);
    } catch (journalError) {
      console.warn('⚠️ Failed to create journal entry for gallery upload:', journalError);
    }

    return {
      success: true,
      galleryId,
      uploadedCount: uploadedImages.length,
      totalCount: imageFiles.length,
      message: `Successfully uploaded ${uploadedImages.length} gallery images`
    };

  } catch (error) {
    console.error('❌ Error uploading profile gallery images:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload gallery images',
      uploadedCount: 0,
      totalCount: imageFiles.length
    };
  }
};

/**
 * Fetch profile gallery images from attachments_gallery
 * In development: fetch limited recent records
 */
export const fetchProfileGallery = async (profileId) => {
  const cacheKey = `profileGallery_${profileId || 'dev'}`;

  return deduplicateRequest(cacheKey, async () => {
    try {
      let response;

      if (import.meta.env.MODE !== 'production') {
        // Development: schema may not have profile_id, so just fetch recent records
        response = await nocoRequest(
          `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=20&sort=-CreatedAt`,
          { method: 'GET' }
        );
      } else {
        if (!profileId) {
          return [];
        }
        response = await nocoRequest(
          `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,profile_id&where=(profile_id,eq,${profileId})&sort=-CreatedAt`,
          { method: 'GET' }
        );
      }

      const list = response.list || [];

      const galleryItems = list.map(item => {
        let imgUrl = null;

        if (item.img_bw) {
          let imgBwArray = item.img_bw;
          if (typeof imgBwArray === 'string') {
            try {
              imgBwArray = JSON.parse(imgBwArray);
            } catch (parseError) {
              if (import.meta.env.MODE !== 'production') {
                console.warn('⚠️ Failed to parse img_bw JSON for profile gallery:', parseError);
              }
            }
          }

          if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
            const imgObj = imgBwArray[0];

            if (import.meta.env.MODE !== 'production') {
              imgUrl = imgObj.signedPath || imgObj.path || null;
              if (imgUrl) {
                imgUrl = `${NOCODB_BASE_URL}/${imgUrl}`;
              }
            } else {
              imgUrl = imgObj.signedUrl || imgObj.url || null;
            }
          }
        }

        return {
          id: item.Id,
          title: item.title,
          imgUrl,
          raw: item
        };
      });

      return galleryItems;
    } catch (error) {
      console.error('❌ Error fetching profile gallery from NocoDB:', error);
      return [];
    }
  });
};

export const saveAchievementConfirmation = async (confirmData) => {
  try {
    const { achievementId, achievementName, desc, imageFile, achievementDueDate, autoApprove } = confirmData;

    if (!achievementId) {
      return { success: false, message: 'Achievement ID is required' };
    }

    // Get current ICT time
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

    // Parse the ICT date string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = ictDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');

    // Generate title: achievement_confirm_<year>-<month>-<day>_<hh>-<mm>
    const title = `achievement_confirm_${year}-${month}-${day}_${hours}-${minutes}`;

    // Format created_time with timezone offset
    const createdTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;

    // Determine initial status based on auto-approve and overdue check
    let initialStatus = 'pending';
    let shouldAutoComplete = false;

    if (autoApprove) {
      // Check if achievement has due date and is overdue
      if (achievementDueDate) {
        const isOverdue = isAchievementOverdue(achievementDueDate);

        if (isOverdue) {
          // Achievement is overdue - mark as failed, auto-approve is disabled
          initialStatus = 'failed';
          // Debug: Log achievement overdue warning (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('⚠️ Achievement is overdue, marking as failed (auto-approve disabled)');
          }
        } else {
          // Achievement is within deadline - auto-approve as completed
          initialStatus = 'completed';
          shouldAutoComplete = true;
          // Debug: Log achievement auto-approve (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Achievement is within deadline, auto-approving as completed');
          }
        }
      } else {
        // No due date - auto-approve as completed
        initialStatus = 'completed';
        shouldAutoComplete = true;
        // Debug: Log achievement no due date (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Achievement has no due date, auto-approving as completed');
        }
      }
    }

    const payload = {
      title: title,
      achievement_name: achievementName || '',
      desc: desc || '',
      created_time: createdTime,
      achievements_id: achievementId, // Link to achievement record using FK field (1-1 relationship)
      status: initialStatus
    };

    // Debug: Log achievement confirmation creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Sending Achievement Confirmation POST to NocoDB:', payload);
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log achievement confirmation creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation created successfully in NocoDB:', response);
    }

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadAchievementConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          // Debug: Log achievement image upload success (development only)
          if (import.meta.env.MODE !== 'production') {
            console.log('✅ Image uploaded and linked to achievement confirmation');
          }
        } else {
          console.warn('⚠️ Image upload failed:', uploadResult.message);
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload failed:', uploadError.message);
        // Continue without image
      }
    }

    return {
      success: true,
      message: 'Achievement confirmation saved',
      id: confirmationId,
      attachmentId: attachmentId,
      shouldAutoComplete: shouldAutoComplete, // Flag to indicate if achievement should be auto-completed
      autoApproved: shouldAutoComplete,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving achievement confirmation to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete achievement confirmation from NocoDB
 * Also deletes linked attachment from attachments_gallery
 * @param {string} confirmationId - Achievement confirmation ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteAchievementConfirmation = async (confirmationId) => {
  try {
    if (!confirmationId) {
      return { success: false, message: 'Achievement confirmation ID is required' };
    }

    // Debug: Log achievement confirmation deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Deleting Achievement Confirmation:', confirmationId);
    }

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(achievements_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));

        // Debug: Log linked achievement attachments deletion (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log(`🗑️ Deleting ${attachmentIds.length} linked attachment(s) from attachments_gallery`);
        }

        await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
          method: 'DELETE',
          body: JSON.stringify(attachmentIds)
        });

        // Debug: Log attachments deletion success (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('✅ Linked attachments deleted successfully');
        }
      } else {
        // Debug: Log no achievement attachments (development only)
        if (import.meta.env.MODE !== 'production') {
          console.log('ℹ️ No linked attachments found for this achievement confirmation');
        }
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the achievement confirmation record
    // Debug: Log achievement confirmation record deletion (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🗑️ Deleting achievement confirmation record');
    }

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    // Debug: Log achievement confirmation deletion success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement confirmation deleted successfully in NocoDB:', response);
    }
    return { success: true, message: 'Achievement confirmation and linked attachments deleted' };
  } catch (error) {
    console.error('❌ Error deleting achievement confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Upload photo album to NocoDB attachments_album table
 * Uploads multiple images and creates a record with description
 * @param {Object} albumData - Album data
 * @param {string} albumData.description - Album description
 * @param {File[]} albumData.imageFiles - Array of image files to upload
 * @returns {Promise<Object>} Result object with success status and album ID
 */
export const savePhotoAlbum = async (albumData) => {
  try {
    // Debug: Log photo album save start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Starting photo album save:', albumData);
    }

    const { description, imageFiles } = albumData;

    if (!imageFiles || imageFiles.length === 0) {
      return { success: false, message: 'At least one image is required' };
    }

    // Step 1: Upload all images to NocoDB storage
    const uploadedImages = [];

    // Debug: Log image upload start (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log(`📤 Starting upload of ${imageFiles.length} images`);
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];

      // Debug: Log individual image upload (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`📸 Uploading image ${i + 1}/${imageFiles.length}:`, imageFile.name);
      }

      const formData = new FormData();
      formData.append('file', imageFile);

      const storageUploadUrl = `${NOCODB_BASE_URL}/api/v2/storage/upload`;

      const storageResponse = await fetch(storageUploadUrl, {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData
      });

      if (!storageResponse.ok) {
        const errorText = await storageResponse.text();
        // Debug: Log storage upload error (development only)
        if (import.meta.env.MODE !== 'production') {
          console.warn(`⚠️ Failed to upload image ${i + 1}: ${errorText}`);
          console.warn(`⚠️ Storage response status: ${storageResponse.status}`);
        }
        continue; // Skip failed uploads
      }

      const storageResult = await storageResponse.json();
      // NocoDB storage upload returns an array, we need the first element
      const imageData = Array.isArray(storageResult) ? storageResult[0] : storageResult;

      // Debug: Log storage upload result (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log(`✅ Image ${i + 1} uploaded successfully:`, imageData);
      }

      uploadedImages.push(imageData);
    }

    if (uploadedImages.length === 0) {
      return { success: false, message: 'Failed to upload any images' };
    }

    // Step 2: Create the album record with description and images
    const payload = {
      desc: description || '',
      img: uploadedImages,
      created_time: getUTC7Timestamp()
    };

    // Debug: Log album creation (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('🔍 Creating album record with payload:', payload);
      console.log('🔍 Using ATTACHMENTS_ALBUM table ID:', TABLE_IDS.ATTACHMENTS_ALBUM);
    }

    const response = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_ALBUM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Debug: Log album creation success (development only)
    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Album created successfully:', response);
    }

    const albumId = response.Id || (response.list && response.list[0]?.Id);

    // Create journal entry for album upload
    try {
      await createMediaUploadJournal('album', description);
    } catch (journalError) {
      console.warn('⚠️ Failed to create journal entry for album upload:', journalError);
    }

    return {
      success: true,
      message: `Photo album saved with ${uploadedImages.length} images`,
      id: albumId,
      uploadedCount: uploadedImages.length,
      totalCount: imageFiles.length,
      data: response
    };
  } catch (error) {
    console.error('❌ Error saving photo album to NocoDB:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch photo albums from NocoDB attachments_album table
 * @returns {Promise<Array>} Array of photo album records
 */
export const fetchPhotoAlbums = async () => {
  const cacheKey = 'photoAlbums';

  return deduplicateRequest(cacheKey, async () => {
    try {
      // Debug: Log photo albums fetch start (development only)
      if (import.meta.env.MODE !== 'production') {
        console.log('🔍 Fetching photo albums from NocoDB...');
      }

      const response = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_ALBUM}/records?sort=-created_time&limit=50`,
        { method: 'GET' }
      );

      const albums = response.list || [];

      // Process image URLs for each album
      const processedAlbums = albums.map(album => {
        if (album.img && Array.isArray(album.img)) {
          const processedImages = album.img.map(imageObj => {
            // Handle different image URL formats
            let imageUrl = null;

            // Development mode: construct URL from path
            // Production/Staging mode: use signedUrl directly
            if (import.meta.env.MODE === 'development') {
              // Debug: Log development mode URL handling (development only)
              if (!isProductionMode()) {
                console.log('🛠️ PhotoAlbum Development mode: resolving local path');
              }
              const rawPath = imageObj.path || imageObj.signedPath || imageObj.url || null;
              if (rawPath) {
                const normalizedPath = rawPath.replace(/\\/g, '/');
                const trimmedPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
                imageUrl = `${NOCODB_BASE_URL}/${trimmedPath}`;
              } else {
                imageUrl = null;
              }
            } else {
              // Production/Staging mode: use signedUrl directly
              if (!isProductionMode()) {
                console.log('🏭 PhotoAlbum Production/Staging mode: using signedUrl');
              }
              imageUrl = imageObj.signedUrl || imageObj.url || null;
            }

            // Debug: Log image URL processing (development only)
            if (!isProductionMode()) {
              console.log('🖼️ Processing photo album image:', {
                original: imageObj,
                finalUrl: imageUrl
              });
            }

            return {
              ...imageObj,
              signedUrl: imageUrl,
              url: imageUrl
            };
          });

          return {
            ...album,
            img: processedImages
          };
        }

        return album;
      });

      return processedAlbums;
    } catch (error) {
      console.error('❌ Error fetching photo albums from NocoDB:', error);
      return [];
    }
  });
};

/**
 * Fetch gallery items from NocoDB attachments_gallery table
 * Filters records with title containing "gallery"
 * Each record can contain multiple images (like photo albums)
 * @returns {Promise<Array>} Array of gallery records with processed image URLs
 */
export const fetchHomePageGallery = async () => {
  const cacheKey = 'homePageGallery';

  return deduplicateRequest(cacheKey, async () => {
    try {

      const response = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?sort=-CreatedAt&limit=100`,
        { method: 'GET' }
      );

      const allRecords = response.list || [];

      // Filter records where title contains "gallery" (case-insensitive)
      const galleryRecords = allRecords.filter(record => {
        const title = typeof record.title === 'string' ? record.title : '';
        return title.toLowerCase().includes('gallery');
      });

      // Process image URLs for each gallery record (like photo albums)
      const processedGallery = galleryRecords.map(record => {
        // Parse img_bw field (it's usually a JSON string)
        let imgBwArray = [];
        if (record.img_bw) {
          try {
            imgBwArray = typeof record.img_bw === 'string'
              ? JSON.parse(record.img_bw)
              : Array.isArray(record.img_bw)
                ? record.img_bw
                : [];
          } catch (e) {
            console.warn('⚠️ Failed to parse img_bw for gallery record:', record.Id, e);
            imgBwArray = [];
          }
        }

        // Process all images in the array
        const processedImages = imgBwArray.map(imageObj => {
          let imageUrl = null;

          // Development mode: construct URL from path
          // Production/Staging mode: use signedUrl directly
          if (import.meta.env.MODE === 'development') {
            const rawPath = imageObj.path || imageObj.signedPath || imageObj.url || null;
            if (rawPath) {
              const normalizedPath = rawPath.replace(/\\/g, '/');
              const trimmedPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
              imageUrl = `${NOCODB_BASE_URL}/${trimmedPath}`;
            } else {
              imageUrl = null;
            }
          } else {
            // Production/Staging mode: use signedUrl directly
            imageUrl = imageObj.signedUrl || imageObj.url || null;
          }

          return {
            ...imageObj,
            signedUrl: imageUrl,
            url: imageUrl
          };
        });

        return {
          Id: record.Id,
          title: typeof record.title === 'string' ? record.title : '',
          desc: typeof record.desc === 'string' ? record.desc : '',
          img: processedImages,
          created_time: record.created_time || record.CreatedAt
        };
      });

      return processedGallery;
    } catch (error) {
      console.error('❌ Error fetching home page gallery from NocoDB:', error);
      return [];
    }
  });
};

export { TABLE_IDS };
