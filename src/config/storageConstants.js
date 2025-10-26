/**
 * Firebase Storage Folder Constants
 * Define storage paths for different types of uploads
 */

// Storage folder paths
export const STORAGE_FOLDERS = {
  // Quest confirmation images - for daily quest submissions
  QUESTS_CONFIRM: 'quests-confirm',
  
  // Achievement confirmation images - for achievement unlocks
  ACHIEVEMENTS_CONFIRM: 'achievements-confirm',
};

/**
 * Generate storage path for quest confirmation image
 * @param {string} questName - Name of the quest (will be sanitized)
 * @param {string} timestamp - Timestamp for uniqueness
 * @returns {string} Storage path
 * 
 * Example: quests-confirm/complete_workout_1730012345678.jpg
 */
export const getQuestConfirmPath = (questName, timestamp = Date.now()) => {
  // Sanitize quest name: lowercase, remove special chars, replace spaces with underscore
  const sanitizedName = questName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length
  
  return `${STORAGE_FOLDERS.QUESTS_CONFIRM}/${sanitizedName}_${timestamp}`;
};

/**
 * Generate storage path for achievement confirmation image
 * @param {string} achievementName - Name of the achievement (will be sanitized)
 * @param {string} timestamp - Timestamp for uniqueness
 * @returns {string} Storage path
 * 
 * Example: achievements-confirm/first_quest_1730012345678.jpg
 */
export const getAchievementConfirmPath = (achievementName, timestamp = Date.now()) => {
  const sanitizedName = achievementName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  return `${STORAGE_FOLDERS.ACHIEVEMENTS_CONFIRM}/${sanitizedName}_${timestamp}`;
};

/**
 * Extract quest name from storage path
 * @param {string} storagePath - Full storage path
 * @returns {string} Quest name prefix
 * 
 * Example: "quests-confirm/complete_workout_1730012345678.jpg" -> "complete_workout"
 */
export const extractQuestNameFromPath = (storagePath) => {
  const fileName = storagePath.split('/').pop(); // Get filename
  const nameWithoutExt = fileName.split('.')[0]; // Remove extension
  const parts = nameWithoutExt.split('_');
  parts.pop(); // Remove timestamp
  return parts.join('_');
};
