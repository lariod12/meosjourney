/**
 * Utility functions for creating journal entries from quest completions and status changes
 */

import { saveJournal } from '../services/firestore';

/**
 * Generate journal entry content for completed quest
 * @param {Object} quest - Quest object with name, desc, xp
 * @returns {string} Formatted journal entry content
 */
export const generateQuestJournalEntry = (quest) => {
  // Create journal entry template following the specified format
  let journalContent = `[Quest Completed] ${quest.name}`;

  if (quest.desc && quest.desc.trim()) {
    journalContent += `: ${quest.desc}`;
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
  let journalContent = `[Achievement Unlocked] ${achievement.name}`;

  if (achievement.desc && achievement.desc.trim()) {
    journalContent += `: ${achievement.desc}`;
  }

  // Add rewards
  const rewards = [];
  if (achievement.xp > 0) {
    rewards.push(`+${achievement.xp} XP`);
  }
  if (achievement.specialReward && achievement.specialReward.trim()) {
    rewards.push(achievement.specialReward);
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

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    console.log('✅ Quest completion journal saved:', quest.name);
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

    const result = await saveJournal({
      caption: journalContent
    }, characterId);

    console.log('✅ Achievement completion journal saved:', achievement.name);
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

    console.log(`✅ Profile ${action} journal saved: ${type} - ${item}`);
    return result;
  } catch (error) {
    console.error('❌ Error saving profile change journal:', error);
    throw error;
  }
};