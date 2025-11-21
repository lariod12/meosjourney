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

      console.log(`📊 Fetched ${data.list.length} quest confirmations from NocoDB`);

      // Step 2: Fetch all attachments_gallery records that link to these confirmations
      const attachmentsData = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,quests_confirm_id`, {
        method: 'GET',
      });

      // Create a map of confirmationId -> attachment for quick lookup
      const attachmentMap = new Map();
      if (attachmentsData.list) {
        attachmentsData.list.forEach(attachment => {
          if (attachment.quests_confirm_id) {
            attachmentMap.set(attachment.quests_confirm_id, attachment);
          }
        });
      }

      console.log(`📊 Fetched ${attachmentsData.list?.length || 0} attachments, ${attachmentMap.size} linked to confirmations`);

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
              // Prefer signedUrl for S3 access, fallback to url
              imgUrl = imgBw.signedUrl || imgBw.url || null;
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse img_bw for confirmation:', record.Id, parseError);
          }
        }

        // Debug: Log confirmation with image data
        console.log(`🔍 Quest Confirmation ID ${record.Id}:`, {
          created_time: record.created_time,
          status: record.status,
          hasImage: !!imgUrl,
          hasAttachment: !!attachment,
          imgUrl: imgUrl ? imgUrl.substring(0, 80) + '...' : null
        });

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

      console.log(`📊 Fetched ${data.list.length} achievement confirmations from NocoDB`);

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

      console.log(`📊 Fetched ${attachmentsData.list?.length || 0} attachments, ${attachmentMap.size} linked to achievement confirmations`);

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

        // Debug: Log confirmation with image data
        console.log(`🔍 Achievement Confirmation ID ${record.Id}:`, {
          created_time: record.created_time,
          hasImage: !!imageUrl,
          hasAttachment: !!attachment,
          imageUrl: imageUrl ? imageUrl.substring(0, 80) + '...' : null
        });

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
 * @returns {Promise<Object>} Result object with success status
 */
export const createQuest = async (questData) => {
  try {
    const { nameEn, nameVi, descEn, descVi, xp } = questData;

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
      created_time: createdTime
    };

    console.log('🔍 Sending Quest POST to NocoDB:', payload);

    const response = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Quest created successfully in NocoDB:', response);
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

    console.log('🔍 Sending Quest Confirmation Status PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Quest confirmation status updated successfully in NocoDB:', response);
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

    console.log('🔍 Sending Achievement Confirmation Status PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Achievement confirmation status updated successfully in NocoDB:', response);
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

    console.log('🔍 Sending Batch Quest Confirmation Status PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log(`✅ ${updates.length} quest confirmation statuses updated successfully in NocoDB`);
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

    console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest side):', questUpdatePayload);

    const questResponse = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(questUpdatePayload)
    });

    console.log('✅ Quest side unlinked:', questResponse);

    // 2. Unlink from quest_confirm side (quest_confirm.quest = null)
    if (confirmationId) {
      const confirmUpdatePayload = [{
        Id: confirmationId,
        quest: null
      }];

      console.log('🔍 Sending Quest Unlink PATCH to NocoDB (quest_confirm side):', confirmUpdatePayload);

      const confirmResponse = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
        method: 'PATCH',
        body: JSON.stringify(confirmUpdatePayload)
      });

      console.log('✅ Quest_confirm side unlinked:', confirmResponse);
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

    console.log('🔍 Sending Quest PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.QUESTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Quest updated successfully in NocoDB:', response);
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

    console.log('🔍 Sending Achievement PATCH to NocoDB:', updatePayload);

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Achievement updated successfully in NocoDB:', response);
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

    console.log('🔍 Creating attachment gallery record:', recordPayload);

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
    console.log('✅ Image uploaded to NocoDB storage:', storageResult);

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult // NocoDB returns array of file objects
    }];

    console.log('🔍 Updating record with image:', updatePayload);

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Record updated with image');

    // Step 4: Link the attachment to quest_confirm if ID provided
    if (questConfirmId) {
      // Try using the foreign key field directly instead of the link field
      const linkPayload = [{
        Id: attachmentId,
        quests_confirm_id: questConfirmId // Use foreign key field name
      }];

      console.log('🔍 Linking attachment to quest_confirm (using FK):', linkPayload);

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      console.log('✅ Attachment linked to quest_confirm. Response:', linkResponse);
      
      // Verify the link was created
      const verifyResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records/${attachmentId}`, {
        method: 'GET'
      });
      console.log('🔍 Verify attachment record after FK link:', verifyResponse);
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
 * Save quest confirmation to NocoDB
 * Creates a new quest confirmation record and links it to the quest
 * If image is provided, uploads to attachments_gallery
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.questId - Quest ID to link to
 * @param {string} confirmData.questName - Quest name
 * @param {string} confirmData.desc - Description
 * @param {File} confirmData.imageFile - Image file to upload (optional)
 * @param {string} confirmData.imgUrl - Legacy image URL (optional, for backward compatibility)
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */
export const saveQuestConfirmation = async (confirmData) => {
  try {
    const { questId, questName, desc, imageFile, imgUrl } = confirmData;

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

    const payload = {
      title: title,
      quest_name: questName || '',
      desc: desc || '',
      created_time: createdTime,
      quest: questId, // Link to quest record (1-1 relationship)
      status: 'pending' // Set initial status as pending
    };

    console.log('🔍 Sending Quest Confirmation POST to NocoDB:', payload);

    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Quest confirmation created successfully in NocoDB:', response);

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadQuestConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          console.log('✅ Image uploaded and linked to quest confirmation');
          
          // Note: In NocoDB one-to-one relationship with belongs-to side,
          // we only need to update the belongs-to side (attachments_gallery.quest_confirm)
          // The other side (quests_confirm.quest_img) will be automatically linked
          console.log('ℹ️ One-to-one link established from belongs-to side (attachments_gallery)');
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

    console.log('🔍 Deleting Quest Confirmation:', confirmationId);

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(quests_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));
        
        console.log(`🗑️ Deleting ${attachmentIds.length} linked attachment(s) from attachments_gallery`);
        
        await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
          method: 'DELETE',
          body: JSON.stringify(attachmentIds)
        });

        console.log('✅ Linked attachments deleted successfully');
      } else {
        console.log('ℹ️ No linked attachments found for this confirmation');
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the quest confirmation record
    console.log('🗑️ Deleting quest confirmation record');
    
    const response = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    console.log('✅ Quest confirmation deleted successfully in NocoDB:', response);
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
    console.log('✅ Image uploaded to NocoDB storage for achievement');

    // Step 3: Update the record with the uploaded file info
    const updatePayload = [{
      Id: attachmentId,
      img_bw: storageResult
    }];

    console.log('🔍 Updating record with image');

    await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload)
    });

    console.log('✅ Record updated with image');

    // Step 4: Link the attachment to achievement_confirm if ID provided
    if (achievementConfirmId) {
      const linkPayload = [{
        Id: attachmentId,
        achievements_confirm_id: achievementConfirmId // Use foreign key field name
      }];

      console.log('🔍 Linking attachment to achievement_confirm (using FK):', linkPayload);

      const linkResponse = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
        method: 'PATCH',
        body: JSON.stringify(linkPayload)
      });

      console.log('✅ Attachment linked to achievement_confirm. Response:', linkResponse);
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
 * @returns {Promise<Object>} Result object with success status and confirmation ID
 */
export const saveAchievementConfirmation = async (confirmData) => {
  try {
    const { achievementId, achievementName, desc, imageFile } = confirmData;

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

    const payload = {
      title: title,
      achievement_name: achievementName || '',
      desc: desc || '',
      created_time: createdTime,
      achievements_id: achievementId, // Link to achievement record using FK field (1-1 relationship)
      status: 'pending' // Set initial status as pending
    };

    console.log('🔍 Sending Achievement Confirmation POST to NocoDB:', payload);

    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('✅ Achievement confirmation created successfully in NocoDB:', response);

    // Extract the confirmation ID from response
    const confirmationId = response.Id || (response.list && response.list[0]?.Id);

    // Upload image to attachments_gallery if provided
    let attachmentId = null;
    if (imageFile && confirmationId) {
      try {
        const uploadResult = await uploadAchievementConfirmationImage(imageFile, title, confirmationId);
        if (uploadResult.success) {
          attachmentId = uploadResult.attachmentId;
          console.log('✅ Image uploaded and linked to achievement confirmation');
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

    console.log('🔍 Deleting Achievement Confirmation:', confirmationId);

    // Step 1: Find and delete linked attachment from attachments_gallery
    try {
      const attachmentsData = await nocoRequest(
        `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?where=(achievements_confirm_id,eq,${confirmationId})`,
        { method: 'GET' }
      );

      if (attachmentsData.list && attachmentsData.list.length > 0) {
        const attachmentIds = attachmentsData.list.map(att => ({ Id: att.Id }));
        
        console.log(`🗑️ Deleting ${attachmentIds.length} linked attachment(s) from attachments_gallery`);
        
        await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
          method: 'DELETE',
          body: JSON.stringify(attachmentIds)
        });

        console.log('✅ Linked attachments deleted successfully');
      } else {
        console.log('ℹ️ No linked attachments found for this achievement confirmation');
      }
    } catch (attachmentError) {
      console.warn('⚠️ Failed to delete linked attachments:', attachmentError.message);
      // Continue with confirmation deletion even if attachment deletion fails
    }

    // Step 2: Delete the achievement confirmation record
    console.log('🗑️ Deleting achievement confirmation record');
    
    const response = await nocoRequest(`${TABLE_IDS.ACHIEVEMENTS_CONFIRM}/records`, {
      method: 'DELETE',
      body: JSON.stringify([{ Id: confirmationId }])
    });

    console.log('✅ Achievement confirmation deleted successfully in NocoDB:', response);
    return { success: true, message: 'Achievement confirmation and linked attachments deleted' };
  } catch (error) {
    console.error('❌ Error deleting achievement confirmation in NocoDB:', error);
    return { success: false, message: error.message };
  }
};

export { TABLE_IDS };
