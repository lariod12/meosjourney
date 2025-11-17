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
        interests: hobbies,  // Map hobbies to interests for frontend compatibility
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
      interests: hobbies,  // Map hobbies to interests for frontend compatibility
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

    // Check interests/hobbies array (interests in frontend = hobbies in NocoDB)
    if (profileData.interests !== undefined) {
      const oldInterests = JSON.stringify(oldProfileData.interests || []);
      const newInterests = JSON.stringify(profileData.interests || []);
      if (oldInterests !== newInterests) {
        updates.hobbies = profileData.interests; // Map interests to hobbies
        hasChanges = true;
        console.log('📝 Profile interests changed:', { old: oldProfileData.interests, new: profileData.interests });
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

    // Update the profile record
    await nocoRequest(`${TABLE_IDS.PROFILE}/records`, {
      method: 'PATCH',
      body: JSON.stringify([{
        Id: profileId,
        ...updates
      }])
    });

    console.log('✅ Profile updated successfully in NocoDB');
    return { success: true, message: 'Profile updated' };
  } catch (error) {
    console.error('❌ Error updating profile in NocoDB:', error);
    throw error;
  }
};

export { TABLE_IDS };
