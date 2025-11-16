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

/**
 * Make a request to NocoDB API
 */
const nocoRequest = async (endpoint, options = {}) => {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'xc-token': NOCODB_TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`NocoDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
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
  try {
    // Use static data in development
    if (USE_STATIC_DATA) {
      const staticData = await fetchStaticData();
      const statusRecord = staticData.status.fields;
      
      return {
        id: staticData.status.id,
        doing: statusRecord.current_activity || [],
        moods: statusRecord.moods || [],
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
    
    const moods = Array.isArray(statusRecord.moods)
      ? statusRecord.moods
      : (statusRecord.moods ? JSON.parse(statusRecord.moods) : []);
    
    const location = Array.isArray(statusRecord.location)
      ? statusRecord.location
      : (statusRecord.location ? JSON.parse(statusRecord.location) : []);

    return {
      id: statusRecord.Id,
      doing: currentActivity,
      moods: moods,
      location: location,
      timestamp: statusRecord.UpdatedAt || statusRecord.CreatedAt || new Date(),
      createdAt: statusRecord.CreatedAt,
      updatedAt: statusRecord.UpdatedAt
    };
  } catch (error) {
    console.error('❌ Error fetching status from NocoDB:', error);
    throw error;
  }
};

/**
 * Fetch profile data from NocoDB
 */
export const fetchProfile = async () => {
  try {
    // Use static data in development
    if (USE_STATIC_DATA) {
      const staticData = await fetchStaticData();
      const profileRecord = staticData.profile.fields;
      
      const interests = Array.isArray(profileRecord.interests)
        ? profileRecord.interests
        : (profileRecord.interests ? JSON.parse(profileRecord.interests) : []);

      return {
        id: staticData.profile.id,
        caption: profileRecord.caption || '',
        currentXP: parseInt(profileRecord.current_xp, 10) || 0,
        maxXP: profileRecord.max_xp || 1000,
        interests: interests,
        introduce: profileRecord.introduce || '',
        title: profileRecord.title || '',
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
    const interests = Array.isArray(profileRecord.interests)
      ? profileRecord.interests
      : (profileRecord.interests ? JSON.parse(profileRecord.interests) : []);

    return {
      id: profileRecord.Id,
      caption: profileRecord.caption || '',
      currentXP: parseInt(profileRecord.current_xp, 10) || 0,
      maxXP: profileRecord.max_xp || 1000,
      interests: interests,
      introduce: profileRecord.introduce || '',
      title: profileRecord.title || '',
      createdAt: profileRecord.CreatedAt,
      updatedAt: profileRecord.UpdatedAt
    };
  } catch (error) {
    console.error('❌ Error fetching profile from NocoDB:', error);
    throw error;
  }
};

/**
 * Fetch config data from NocoDB
 */
export const fetchConfig = async () => {
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
};

export { TABLE_IDS };
