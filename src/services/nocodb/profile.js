import { TABLE_IDS, USE_STATIC_DATA, fetchStaticData, nocoRequest, deduplicateRequest, isProductionMode, parseNocoDate, NOCODB_BASE_URL } from './core.js';

const parseJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (typeof value !== 'string') {
    return [value];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value];
  }
};

const normalizeActivityItem = (item) => {
  if (typeof item === 'string') {
    const name = item.trim();
    return name ? { name, icon: '' } : null;
  }

  if (item && typeof item === 'object') {
    const name = typeof item.name === 'string' ? item.name.trim() : String(item.name || '').trim();
    const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
    return name ? { name, icon } : null;
  }

  const name = String(item || '').trim();
  return name ? { name, icon: '' } : null;
};

const normalizeActivityItems = (value) => (
  parseJsonArray(value)
    .map(normalizeActivityItem)
    .filter(Boolean)
);

const normalizeStatusItems = normalizeActivityItems;

const normalizeStringArray = (value) => (
  parseJsonArray(value)
    .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
    .filter(Boolean)
);

const STATUS_FIELDS_QUERY = 'fields=Id,current_activity,mood,location,UpdatedAt,CreatedAt&pageSize=1';
const PET_PASSWORD_CONFIG_FIELDS_QUERY = 'fields=Id,pw_daily_update&pageSize=1';

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
          doing: normalizeActivityItems(statusRecord.current_activity),
          mood: normalizeStatusItems(statusRecord.mood), // Changed from 'moods' to 'mood' to match database column
          location: normalizeStringArray(statusRecord.location),
          timestamp: statusRecord.UpdatedAt || statusRecord.CreatedAt || new Date(),
          createdAt: statusRecord.CreatedAt,
          updatedAt: statusRecord.UpdatedAt
        };
      }

      // Use API in production
      const data = await nocoRequest(`${TABLE_IDS.STATUS}/records?${STATUS_FIELDS_QUERY}`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No status record found in NocoDB');
        return null;
      }

      const statusRecord = data.list[0];

      // Parse JSON fields
      const currentActivity = normalizeActivityItems(statusRecord.current_activity);
      const moods = normalizeStatusItems(statusRecord.mood);
      const location = normalizeStringArray(statusRecord.location);

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

export const fetchPetPagePasswordConfig = async () => {
  const cacheKey = 'pet_password_config';

  return deduplicateRequest(cacheKey, async () => {
    try {
      if (USE_STATIC_DATA) {
        const staticData = await fetchStaticData();
        const configRecord = staticData.config.fields;

        return {
          id: staticData.config.id,
          pwDailyUpdate: configRecord.pw_daily_update || ''
        };
      }

      const data = await nocoRequest(`${TABLE_IDS.CONFIG}/records?${PET_PASSWORD_CONFIG_FIELDS_QUERY}`, {
        method: 'GET',
      });

      if (!data.list || data.list.length === 0) {
        console.warn('⚠️ No pet password config record found in NocoDB');
        return null;
      }

      const configRecord = data.list[0];

      return {
        id: configRecord.Id,
        pwDailyUpdate: configRecord.pw_daily_update || ''
      };
    } catch (error) {
      console.error('❌ Error fetching pet password config from NocoDB:', error);
      throw error;
    }
  });
};

/**
 * Fetch profile data from NocoDB
 */
export const fetchProfile = async (options = {}) => {
  const { includeAvatar = true } = options || {};
  const cacheKey = includeAvatar ? 'profile' : 'profile_light';

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
      if (includeAvatar) {
        try {
          // Debug: Log avatar fetching (development only)
          if (!isProductionMode()) {
            console.log('🔍 Fetching avatar for profile ID:', profileRecord.Id);
            console.log('🔍 Using ATTACHMENTS_GALLERY table ID:', TABLE_IDS.ATTACHMENTS_GALLERY);
          }

          let attachmentsData;

          // Development mode: different schema (no profile_id field, use signedPath)
          if (import.meta.env.MODE === 'development') {
            // Debug: Log development mode query (development only)
            if (!isProductionMode()) {
              console.log('🛠️ Development mode: using simplified query');
            }
            attachmentsData = await nocoRequest(
              `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?limit=1`,
              { method: 'GET' }
            );
          } else if (import.meta.env.MODE === 'staging') {
            // Staging uses production-style signed URLs, but its profile avatar
            // attachment is identified by title instead of profile_id.
            attachmentsData = await nocoRequest(
              `${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw&where=(title,eq,profile)&limit=1`,
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

                // Development mode: use signedPath, Production/Staging mode: use signedUrl
                if (import.meta.env.MODE === 'development') {
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

    const normalizeArray = (value) => normalizeStringArray(Array.isArray(value) ? value : [value]);

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

    const prependActivityValue = (newValue, existingList) => {
  const existing = normalizeActivityItems(existingList);
  const nextActivity = normalizeActivityItem(newValue);

  if (!nextActivity) {
    return [];
  }

  // Check if activity already exists (case-insensitive)
  const existingIndex = existing.findIndex(
    (item) => item.name.toLowerCase() === nextActivity.name.toLowerCase()
  );

  // If activity exists, update its icon and move to front
  if (existingIndex !== -1) {
    const updatedActivity = {
      name: nextActivity.name,
      icon: nextActivity.icon || existing[existingIndex].icon || ''
    };
    
    // Remove old entry and prepend updated one
    const filteredExisting = existing.filter((_, index) => index !== existingIndex);
    return [updatedActivity, ...filteredExisting];
  }

  // If activity doesn't exist, prepend new one
  return [{
    name: nextActivity.name,
    icon: nextActivity.icon || ''
  }, ...existing];
};

    const currentActivities = normalizeActivityItems(currentStatus.doing);
    const currentLocations = normalizeArray(currentStatus.location);
    const currentMoods = normalizeStatusItems(currentStatus.mood);

    const updates = {};

    // Map frontend fields to NocoDB columns
    // Note: NocoDB columns are JSON/Array, so we wrap strings in arrays if needed
    if (statusData.doing !== undefined) {
      updates.current_activity = prependActivityValue(statusData.doing, currentActivities);
    }

    if (statusData.location !== undefined) {
      updates.location = prependStatusValue(statusData.location, currentLocations);
    }

    if (statusData.mood !== undefined) {
      updates.mood = prependActivityValue(statusData.mood, currentMoods);
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
