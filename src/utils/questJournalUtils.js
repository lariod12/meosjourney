/**
 * Utility functions for creating journal entries from quest completions
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