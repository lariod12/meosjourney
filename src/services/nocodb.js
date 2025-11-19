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

const NOCODB_BASE_URL = import.meta.env.VITE_NOCODB_BASE_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
const NOCODB_BASE_ID = import.meta.env.VITE_NOCODB_BASE_ID;
const USE_STATIC_DATA = import.meta.env.VITE_NOCODB_USE_STATIC === 'true';

// Table IDs from NocoDB export
const TABLE_IDS = {
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
  ATTACHMENTS_ALBUM: 'mxqvvqxqxqxqxqx' // placeholder
};

// Simple in-memory cache to prevent duplicate requests (especially in dev mode with StrictMode)
const requestCache = new Map();
const pendingRequests = new Map(); // Track in-flight requests
const CACHE_DURATION = 5000; // 5 seconds

const getCachedRequest = (key) => {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached data for: ${key}`);
    return cached.data;
  }
  return null;
};

const setCachedRequest = (key, data) => {
  requestCache.set(key, { data, timestamp: Date.now() });
};

// Deduplicate concurrent requests - if same request is in-flight, return the same promise
const deduplicateRequest = async (key, requestFn) => {
  // Check cache first
  const cached = getCachedRequest(key);
  if (cached) return cached;

  // Check if request is already in-flight
  if (pendingRequests.has(key)) {
    console.log(`⏳ Waiting for in-flight request: ${key}`);
    return pendingRequests.get(key);
  }

  // Execute the request and store the promise
  const promise = requestFn()
    .then(data => {
      setCachedRequest(key, data);
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
 * Make a request to NocoDB API with retry logic for rate limiting
 */
const nocoRequest = async (endpoint, options = {}, retries = 3) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${endpoint}`;

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
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(`⚠️ Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`NocoDB API rate limit exceeded after ${retries} retries`);
      }

      if (!response.ok) {
        throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // For network errors, also retry
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`⚠️ Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
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

        // Calculate level from XP
        const currentXP = parseInt(profileRecord.current_xp, 10) || 0;
        const maxXP = profileRecord.max_xp || 1000;
        const level = Math.floor(currentXP / maxXP);

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
      const data = await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No profile record found in NocoDB');
        return null;
      }

      const profileRecord = data.list[0];

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

      // Calculate level from XP (same logic as Firestore)
      const currentXP = parseInt(profileRecord.current_xp, 10) || 0;
      const maxXP = profileRecord.max_xp || 1000;
      const level = Math.floor(currentXP / maxXP);

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
 * Returns all journal entries sorted by created_time descending
 * Fetches all records using pagination (NocoDB default pageSize is 25)
 */
export const fetchJournals = async () => {
  try {
    // Use static data in development
    if (USE_STATIC_DATA) {
      const staticData = await fetchStaticData();
      // Static data doesn't have journals yet
      return [];
    }

    // Use API in production - fetch all journals with pagination
    let allJournals = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100; // Fetch 100 per page

    while (hasMore) {
      const data = await nocoRequest(`${TABLE_IDS.JOURNALS}/records?sort=-created_time&page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
      });

      if (data.list && data.list.length > 0) {
        allJournals = allJournals.concat(data.list);

        // Check if there are more pages
        hasMore = data.pageInfo && !data.pageInfo.isLastPage;
        page++;
      } else {
        hasMore = false;
      }
    }

    if (allJournals.length === 0) {
      console.warn('⚠️ No journal records found in NocoDB');
      return [];
    }

    console.log(`📊 Fetched ${allJournals.length} journal entries from NocoDB`);

    // Transform NocoDB journals to frontend format
    const journals = allJournals.map(record => {
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
        createdAt: record.CreatedAt
      };
    });

    return journals;
  } catch (error) {
    console.error('❌ Error fetching journals from NocoDB:', error);
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

      console.log(`📊 Fetched ${data.list.length} quests from NocoDB`);

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

        // Debug: Log date fields
        console.log(`🔍 Quest ID ${record.Id} dates:`, {
          created_time: record.created_time,
          completed_time: record.completed_time,
          createdAt: record.created_time ? new Date(record.created_time) : null,
          completedAt: record.completed_time ? new Date(record.completed_time) : null
        });

        return {
          id: record.Id,
          name: name,
          nameTranslations: nameTranslations,
          desc: desc,
          descTranslations: descTranslations,
          xp: record.xp || 0,
          questsConfirmId: record.quests_confirm_id || null, // Link to quest_confirm
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
 * Returns all quest confirmation records
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

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records?sort=-created_time`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No quest confirmation records found in NocoDB');
        return [];
      }

      console.log(`📊 Fetched ${data.list.length} quest confirmations from NocoDB`);

      // Transform NocoDB quest confirmations to frontend format
      const confirmations = data.list.map(record => {
        // Debug: Log confirmation date fields
        console.log(`🔍 Quest Confirmation ID ${record.Id} dates:`, {
          created_time: record.created_time,
          CreatedAt: record.CreatedAt,
          createdAt: record.created_time ? new Date(record.created_time) : new Date(record.CreatedAt)
        });

        return {
          id: record.Id,
          name: record.quest_name || record.title || 'Unnamed Quest',
          desc: record.desc || '',
          imgUrl: record.quest_img?.fields?.url || '', // Will need to handle attachment properly
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
      console.log('📝 Profile introduce changed:', { old: oldProfileData.introduce, new: profileData.introduce });
    }

    // Check caption field
    if (profileData.caption !== undefined && profileData.caption !== oldProfileData.caption) {
      updates.caption = profileData.caption;
      hasChanges = true;
      console.log('📝 Profile caption changed:', { old: oldProfileData.caption, new: profileData.caption });
    }

    // Check skills array
    if (profileData.skills !== undefined) {
      const oldSkills = JSON.stringify(oldProfileData.skills || []);
      const newSkills = JSON.stringify(profileData.skills || []);
      if (oldSkills !== newSkills) {
        updates.skills = profileData.skills;
        hasChanges = true;
        console.log('📝 Profile skills changed:', { old: oldProfileData.skills, new: profileData.skills });
      }
    }

    // Check hobbies array
    if (profileData.hobbies !== undefined) {
      const oldHobbies = JSON.stringify(oldProfileData.hobbies || []);
      const newHobbies = JSON.stringify(profileData.hobbies || []);
      if (oldHobbies !== newHobbies) {
        updates.hobbies = profileData.hobbies;
        hasChanges = true;
        console.log('📝 Profile hobbies changed:', { old: oldProfileData.hobbies, new: profileData.hobbies });
      }
    }

    if (!hasChanges) {
      console.log('ℹ️ No profile changes detected');
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

    // Debug: Log the update payload
    const updatePayload = [{
      Id: profileId,
      ...updates
    }];
    console.log('🔍 Sending PATCH to NocoDB:', updatePayload);

    // Update the profile record
    const response = await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Profile updated successfully in NocoDB:', response);
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('❌ Error updating profile in NocoDB:', error);
    throw error;
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

    const updates = {};

    // Map frontend fields to NocoDB columns
    // Note: NocoDB columns are JSON/Array, so we wrap strings in arrays if needed
    if (statusData.doing !== undefined) {
      updates.current_activity = statusData.doing ? [statusData.doing] : [];
    }

    if (statusData.location !== undefined) {
      updates.location = statusData.location ? [statusData.location] : [];
    }

    if (statusData.mood !== undefined) {
      updates.mood = statusData.mood ? [statusData.mood] : [];
    }

    // If no updates, return success
    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No data to save' };
    }

    const updatePayload = [{
      Id: currentStatus.id,
      ...updates
    }];

    console.log('🔍 Sending Status PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.STATUS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Status updated successfully in NocoDB:', response);
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
        console.log('✅ Found existing history record:', historyTitle);
      } else {
        // Create new history record
        console.log('Pm Creating new history record:', historyTitle);
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
        console.log('✅ Created new history record:', historyTitle);
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

    console.log('🔍 Sending Journal POST to NocoDB:', payload);

    const response = await nocoRequest(`${TABLE_IDS.JOURNALS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Journal saved successfully in NocoDB:', response);
    return { success: true, message: 'Journal saved' };
  } catch (error) {
    console.error('❌ Error saving journal to NocoDB:', error);
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

      console.log(`📊 Fetched ${data.list.length} achievements from NocoDB`);
      console.log('🔍 First achievement record:', data.list[0]);

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
 * Returns all achievement confirmation records with image data
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

      // Use API in production - fetch with nested data
      const data = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records?sort=-created_time&nested[achievement_img][fields]=img_bw,title`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No achievement confirmation records found in NocoDB');
        return [];
      }

      console.log(`📊 Fetched ${data.list.length} achievement confirmations from NocoDB`);

      // Transform NocoDB achievement confirmations to frontend format
      const confirmations = data.list.map(record => {
        // Get image URL from nested achievement_img -> img_bw
        let imageUrl = null;
        if (record.achievement_img && Array.isArray(record.achievement_img.img_bw) && record.achievement_img.img_bw.length > 0) {
          const imgBw = record.achievement_img.img_bw[0];
          imageUrl = imgBw.signedUrl || imgBw.url || null;
        }

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

    console.log('🔍 Special Reward Data:', {
      specialRewardEn,
      specialRewardVi,
      specialReward
    });

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
      console.log('✅ Added special_reward to payload:', payload.special_reward);
    } else {
      console.log('⚠️ No special_reward provided');
    }

    if (dueDate) {
      payload.due_date = dueDate;
    }

    console.log('🔍 Sending Achievement POST to NocoDB:', JSON.stringify(payload, null, 2));

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Achievement created successfully in NocoDB:', response);
    return { success: true, message: 'Achievement created', data: response };
  } catch (error) {
    console.error('❌ Error creating achievement in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

export { TABLE_IDS };
