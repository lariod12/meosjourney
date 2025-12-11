/**
 * Utility functions for creating journal entries from quest completions and status changes
 */

import { saveJournal } from '../services/nocodb';

const extractLocalizedField = (value, fallback = '') => {
  if (!value && value !== 0) {
    return typeof fallback === 'string' ? fallback : '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const en = value.en;
    const vi = value.vi;

    if (typeof en === 'string' && en.trim()) return en.trim();
    if (typeof vi === 'string' && vi.trim()) return vi.trim();

    const firstString = Object.values(value).find(
      (entry) => typeof entry === 'string' && entry.trim()
    );

    if (firstString) {
      return firstString.trim();
    }
  }

  if (Array.isArray(value)) {
    const firstString = value.find((entry) => typeof entry === 'string' && entry.trim());
    if (firstString) {
      return firstString.trim();
    }
  }

  return typeof fallback === 'string' ? fallback : '';
};

/**
 * Generate journal entry content for completed quest
 * @param {Object} quest - Quest object with name, desc, xp
 * @returns {string} Formatted journal entry content
 */
export const generateQuestJournalEntry = (quest) => {
  // Create journal entry template following the specified format
  const questName = extractLocalizedField(quest.nameTranslations, quest.name);
  const questDesc = extractLocalizedField(quest.descTranslations, quest.desc);

  let journalContent = `[Quest Completed] ${questName}`;

  if (questDesc && questDesc.trim()) {
    journalContent += `: ${questDesc}`;
  }

  journalContent += ` (+${quest.xp} XP)`;

  return journalContent;
};

/**
 * Generate journal entry content for completed achievement
 * @param {Object} achievement - Achievement object with name, desc, xp, specialReward
 * @returns {string} Formatted journal entry content
 */
export const generateAchievementJournalEntry = (achievement) => {
  // Create journal entry template following the specified format
  const achievementName = extractLocalizedField(
    achievement.nameTranslations,
    achievement.name
  );
  const achievementDesc = extractLocalizedField(
    achievement.descTranslations,
    achievement.desc
  );
  const rewardText = extractLocalizedField(
    achievement.specialRewardTranslations,
    achievement.specialReward
  );

  let journalContent = `[Achievement Unlocked] ${achievementName}`;

  if (achievementDesc && achievementDesc.trim()) {
    journalContent += `: ${achievementDesc}`;
  }

  // Add rewards
  const rewards = [];
  if (achievement.xp > 0) {
    rewards.push(`+${achievement.xp} XP`);
  }
  if (rewardText && rewardText.trim()) {
    rewards.push(rewardText);
  }

  if (rewards.length > 0) {
    journalContent += ` (${rewards.join(', ')})`;
  }

  return journalContent;
};

/**
 * Save quest completion as journal entry
 * @param {Object} quest - Quest object
 * @param {string} characterId - Character ID
 * @returns {Promise<Object>} Save result
 */
export const saveQuestCompletionJournal = async (quest, characterId) => {
  try {
    const journalContent = generateQuestJournalEntry(quest);
    const questName = extractLocalizedField(quest.nameTranslations, quest.name);

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Quest completion journal saved:', questName);
    }

    return result;
  } catch (error) {
    console.error('❌ Error saving quest completion journal:', error);
    throw error;
  }
};

/**
 * Save achievement completion as journal entry
 * @param {Object} achievement - Achievement object
 * @param {string} characterId - Character ID
 * @returns {Promise<Object>} Save result
 */
export const saveAchievementCompletionJournal = async (achievement, characterId) => {
  try {
    const journalContent = generateAchievementJournalEntry(achievement);
    const achievementName = extractLocalizedField(
      achievement.nameTranslations,
      achievement.name
    );

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    if (import.meta.env.MODE !== 'production') {
      console.log('✅ Achievement completion journal saved:', achievementName);
    }

    return result;
  } catch (error) {
    console.error('❌ Error saving achievement completion journal:', error);
    throw error;
  }
};

/**
 * Generate journal entry content for status change
 * @param {string} fieldType - Type of field ('mood', 'location', 'doing', 'caption')
 * @param {string} oldValue - Old value
 * @param {string} newValue - New value
 * @returns {string} Formatted journal entry content
 */
export const generateStatusChangeJournalEntry = (fieldType, oldValue, newValue) => {
  // Format: [Status Update] Field: old_value → new_value
  const fieldMap = {
    'mood': 'Mood',
    'location': 'Location',
    'doing': 'Activity',
    'caption': 'Caption'
  };

  const fieldName = fieldMap[fieldType] || fieldType;
  const old = typeof oldValue === 'string' ? oldValue.trim() : String(oldValue || '').trim();
  const newVal = typeof newValue === 'string' ? newValue.trim() : String(newValue || '').trim();

  if (old && newVal) return `[Status Update] ${fieldName}: ${old} → ${newVal}`;
  if (newVal) return `[Status Update] ${fieldName}: ${newVal}`;
  if (old) return `[Status Update] ${fieldName}: ${old}`;
  return `[Status Update] ${fieldName}`;
};

/**
 * Save status change as journal entry
 * @param {string} fieldType - Type of field ('mood', 'location', 'doing')
 * @param {string} oldValue - Old value
 * @param {string} newValue - New value
 * @param {string} characterId - Character ID
 * @returns {Promise<Object>} Save result
 */
export const saveStatusChangeJournal = async (fieldType, oldValue, newValue, characterId) => {
  try {
    const journalContent = generateStatusChangeJournalEntry(fieldType, oldValue, newValue);

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    return result;
  } catch (error) {
    console.error('❌ Error saving status change journal:', error);
    throw error;
  }
};

/**
 * Generate journal entry content for profile skill/interest changes
 * @param {string} action - 'added' or 'removed'
 * @param {string} type - 'skill' or 'interest'
 * @param {string} item - The skill or interest name
 * @returns {string} Formatted journal entry content
 */
export const generateProfileChangeJournalEntry = (action, type, item) => {
  // Format: [Profile Update] Added skill: JavaScript
  // Format: [Profile Update] Removed interest: Gaming
  const actionText = action === 'added' ? 'Added' : 'Removed';
  const typeText = type === 'skill' ? 'skill' : 'interest';

  return `[Profile Update] ${actionText} ${typeText}: ${item}`;
};

/**
 * Save profile skill/interest change as journal entry
 * @param {string} action - 'added' or 'removed'
 * @param {string} type - 'skill' or 'interest'
 * @param {string} item - The skill or interest name
 * @param {string} characterId - Character ID
 * @returns {Promise<Object>} Save result
 */
export const saveProfileChangeJournal = async (action, type, item, characterId) => {
  try {
    const journalContent = generateProfileChangeJournalEntry(action, type, item);

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    if (import.meta.env.MODE !== 'production') {
      console.log(`✅ Profile ${action} journal saved: ${type} - ${item}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error saving profile change journal:', error);
    throw error;
  }
};