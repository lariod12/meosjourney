/**
 * Discord Notification Service
 * Sends notifications to Discord when users submit quests
 */

// Icon mapping for Discord (icon names to emoji)
const ICON_TO_EMOJI = {
  // Achievement icons
  'trophy': '🏆',
  'medal': '🏅',
  'star': '⭐',
  'crown': '👑',
  'gem': '💎',
  'fire': '🔥',
  'lightning': '⚡',
  'target': '🎯',
  'rocket': '🚀',
  'mountain': '⛰️',
  'book': '📚',
  'graduation-cap': '🎓',
  'heart': '❤️',
  'shield': '🛡️',
  'sword': '⚔️',
  'magic-wand': '🪄',
  'key': '🗝️',
  'lock': '🔒',
  'unlock': '🔓',
  'gift': '🎁',
  'cake': '🎂',
  'party': '🎉',
  'music': '🎵',
  'art': '🎨',
  'camera': '📷',
  'computer': '💻',
  'phone': '📱',
  'game': '🎮',
  'dice': '🎲',
  'puzzle': '🧩',
  'brain': '🧠',
  'muscle': '💪',
  'eye': '👁️',
  'hand': '✋',
  'thumbs-up': '👍',
  'clap': '👏',
  'peace': '✌️',
  'ok-hand': '👌',
  'fist': '✊',
  'wave': '👋',
  'pray': '🙏',
  // Default fallback
  'default': '🏆'
};

/**
 * Convert icon name to emoji for Discord
 * @param {string} iconName - Icon name from achievement
 * @returns {string} - Corresponding emoji
 */
const getEmojiFromIcon = (iconName) => {
  if (!iconName) return ICON_TO_EMOJI.default;

  // Handle different icon formats
  const cleanIconName = iconName.toLowerCase()
    .replace(/^fa-/, '') // Remove FontAwesome prefix
    .replace(/^fas?-/, '') // Remove FontAwesome style prefix
    .replace(/^icon-/, '') // Remove generic icon prefix
    .replace(/_/g, '-'); // Convert underscores to dashes

  return ICON_TO_EMOJI[cleanIconName] || ICON_TO_EMOJI.default;
};

const resolveLocalizedText = (value, fallback = '') => {
  if (!value && value !== 0) {
    return typeof fallback === 'string' ? fallback : '';
  }

  if (typeof value === 'string') {
    return value;
  }

  // Handle array format from NocoDB: [{"en":"..."}, {"vi":"..."}]
  if (Array.isArray(value)) {
    // Convert array to object for easier access
    const translations = {};
    value.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.assign(translations, item);
      }
    });

    // Prefer Vietnamese first for Discord messages
    if (typeof translations.vi === 'string' && translations.vi.trim()) {
      return translations.vi.trim();
    }

    if (typeof translations.en === 'string' && translations.en.trim()) {
      return translations.en.trim();
    }

    // Fallback to first available string
    const firstString = Object.values(translations).find(
      (entry) => typeof entry === 'string' && entry.trim()
    );

    if (firstString) {
      return firstString.trim();
    }

    // If array contains strings directly
    const firstDirectString = value.find((entry) => typeof entry === 'string' && entry.trim());
    if (firstDirectString) {
      return firstDirectString.trim();
    }
  }

  // Handle object format: {en: "...", vi: "..."}
  if (typeof value === 'object' && value !== null) {
    const { en, vi, ...rest } = value;

    // Prefer Vietnamese first for Discord messages
    if (typeof vi === 'string' && vi.trim()) {
      return vi.trim();
    }

    if (typeof en === 'string' && en.trim()) {
      return en.trim();
    }

    const firstString = Object.values(rest).find(
      (entry) => typeof entry === 'string' && entry.trim()
    );

    if (firstString) {
      return firstString.trim();
    }
  }

  return typeof fallback === 'string' ? fallback : '';
};

// Discord Configuration
const DISCORD_CONFIG = {
  // Discord webhook URL - bot name and avatar will be used from Discord bot settings
  WEBHOOK_URL: 'https://discord.com/api/webhooks/1409114023366230117/2g6lELXazBqSf9cTOtaobc3KQTb6M0XQTRjm_XQbZefIr4TsrjrO_C63GPlwU83EG0wl',
  // Set a dedicated admin webhook here (no env logic, no fallback)
  ADMIN_WEBHOOK_URL: 'https://discord.com/api/webhooks/1422653865014067352/Vfw_9sCrxXoupLUb_n-vKAOD9msHwSiTGCCXJYm8-LP5DjwRhhGNLC4YtnJD48LhsLLC'
};

const sendDiscordWebhookMessage = async (payload, webhookUrl) => {
  const targetUrl = webhookUrl;

  if (!targetUrl || targetUrl === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
    console.warn('⚠️ Discord webhook URL not configured');
    return false;
  }

  if (targetUrl === 'YOUR_ADMIN_DISCORD_WEBHOOK_URL_HERE') {
    console.warn('⚠️ Discord admin webhook URL not configured');
    return false;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    return true;
  }

  const errorText = await response.text();
  console.error('❌ Discord admin notification failed:', response.status, errorText);
  return false;
};

export const sendAdminQuestCreatedNotification = async (questData) => {
  try {
    const nameValue = questData?.nameTranslations ?? questData?.name;
    const descValue = questData?.descTranslations ?? questData?.desc;
    const questName = resolveLocalizedText(nameValue);
    const questDesc = resolveLocalizedText(descValue);

    const embed = {
      title: '📜 New Quest Added',
      description: `**${questName}**`,
      color: 0x1E90FF,
      fields: [
        {
          name: '📋 Description',
          value: questDesc || 'No description provided',
          inline: false
        },
        {
          name: '⭐ XP Reward',
          value: `+${questData.xp} XP`,
          inline: true
        }
      ],
      footer: {
        text: 'Meo\'s Journey'
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      embeds: [embed]
    };

    return await sendDiscordWebhookMessage(payload, DISCORD_CONFIG.ADMIN_WEBHOOK_URL);
  } catch (error) {
    console.error('❌ Error sending quest creation notification:', error);
    return false;
  }
};

export const sendAdminAchievementCreatedNotification = async (achievementData) => {
  try {
    const nameValue = achievementData?.nameTranslations ?? achievementData?.name;
    const descValue = achievementData?.descTranslations ?? achievementData?.desc;
    const rewardValue = achievementData?.specialRewardTranslations ?? achievementData?.specialReward;
    const achievementName = resolveLocalizedText(nameValue);
    const achievementDesc = resolveLocalizedText(descValue);
    const specialReward = resolveLocalizedText(rewardValue);

    const embed = {
      title: '🏆 New Achievement Added',
      description: `**${achievementName}**`,
      color: 0xFFD700,
      fields: [
        {
          name: '📋 Description',
          value: achievementDesc || 'No description provided',
          inline: false
        },
        {
          name: '⭐ XP Reward',
          value: achievementData.xp > 0 ? `+${achievementData.xp} XP` : 'None',
          inline: true
        }
      ],
      footer: {
        text: 'Meo\'s Journey'
      },
      timestamp: new Date().toISOString()
    };

    if (specialReward) {
      embed.fields.push({
        name: '🎁 Special Reward',
        value: specialReward,
        inline: false
      });
    }

    const payload = {
      embeds: [embed]
    };

    return await sendDiscordWebhookMessage(payload, DISCORD_CONFIG.ADMIN_WEBHOOK_URL);
  } catch (error) {
    console.error('❌ Error sending achievement creation notification:', error);
    return false;
  }
};

export const sendAdminQuestCompletedNotification = async (questData, confirmationData = {}) => {
  try {
    const nameValue = questData?.nameTranslations ?? questData?.name;
    const descValue = questData?.descTranslations ?? questData?.desc;
    const questName = resolveLocalizedText(nameValue);
    const questDesc = resolveLocalizedText(descValue);

    const embed = {
      title: '📜 Quest Completed (Approved)',
      description: `**${questName}**`,
      color: 0x1E90FF,
      fields: [
        { name: '📋 Quest Description', value: questDesc || 'No description available', inline: false },
        { name: '📝 Submission', value: confirmationData.desc || 'No details provided', inline: false },
        { name: '⭐ XP Awarded', value: `+${questData.xp || 0} XP`, inline: true }
      ],
      footer: { text: "Meo's Journey • Admin" },
      timestamp: new Date().toISOString()
    };

    if (confirmationData.imgUrl) {
      embed.image = { url: confirmationData.imgUrl };
    }

    const payload = { embeds: [embed] };
    return await sendDiscordWebhookMessage(payload, DISCORD_CONFIG.ADMIN_WEBHOOK_URL);
  } catch (error) {
    console.error('❌ Error sending quest completed notification:', error);
    return false;
  }
};

export const sendAdminAchievementCompletedNotification = async (achievementData, confirmationData = {}) => {
  try {
    const nameValue = achievementData?.nameTranslations ?? achievementData?.name;
    const descValue = achievementData?.descTranslations ?? achievementData?.desc;
    const rewardValue = achievementData?.specialRewardTranslations ?? achievementData?.specialReward;
    const achievementName = resolveLocalizedText(nameValue);
    const achievementDesc = resolveLocalizedText(descValue);
    const specialReward = resolveLocalizedText(rewardValue);

    const embed = {
      title: '🏆 Achievement Completed (Approved)',
      description: `**${achievementName}**`,
      color: 0xFFD700,
      fields: [
        { name: '📋 Achievement Description', value: achievementDesc || 'No description available', inline: false },
        { name: '📝 Submission', value: confirmationData.desc || 'No details provided', inline: false },
        { name: '⭐ XP Awarded', value: `+${achievementData.xp || 0} XP`, inline: true }
      ],
      footer: { text: "Meo's Journey • Admin" },
      timestamp: new Date().toISOString()
    };

    if (specialReward) {
      embed.fields.push({ name: '🎁 Special Reward', value: specialReward, inline: false });
    }

    if (confirmationData.imgUrl) {
      embed.image = { url: confirmationData.imgUrl };
    }

    const payload = { embeds: [embed] };
    return await sendDiscordWebhookMessage(payload, DISCORD_CONFIG.ADMIN_WEBHOOK_URL);
  } catch (error) {
    console.error('❌ Error sending achievement completed notification:', error);
    return false;
  }
};

/**
 * Send quest submission notification to Discord
 * @param {Object} questData - Quest information
 * @param {Object} userData - User information
 * @param {Object} confirmationData - Submission details
 * @returns {Promise<boolean>} Success status
 */
export const sendQuestSubmissionNotification = async (questData, userData, confirmationData) => {
  try {
    // Validate webhook URL
    if (!DISCORD_CONFIG.WEBHOOK_URL || DISCORD_CONFIG.WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
      console.warn('⚠️ Discord webhook URL not configured');
      return false;
    }

    // Create embed message
    const nameValue = questData?.nameTranslations ?? questData?.name;
    const descValue = questData?.descTranslations ?? questData?.desc;
    const questName = resolveLocalizedText(nameValue);
    const questDesc = resolveLocalizedText(descValue);

    const embed = {
      title: '📜 Quest Submitted!',
      description: `**${questName}**`,
      color: 0x1E90FF,
      fields: [
        {
          name: '📝 Submission Details',
          value: confirmationData.desc || 'No details provided',
          inline: false
        },
        {
          name: '📋 Quest Description',
          value: questDesc || 'No description available',
          inline: false
        },
        {
          name: '⭐ XP Reward',
          value: `+${questData.xp} XP`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Meo\'s Journey'
      }
    };

    // Add image if provided
    if (confirmationData.imgUrl) {
      embed.image = {
        url: confirmationData.imgUrl
      };
    }

    // Prepare webhook payload - bot name and avatar will be used from Discord bot settings
    const payload = {
      embeds: [embed]
    };

    // Send to Discord
    const response = await fetch(DISCORD_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Discord notification sent successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Discord webhook failed:', response.status, errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Error sending Discord notification:', error);
    return false;
  }
};

/**
 * Send achievement completion notification to Discord
 * @param {Object} achievementData - Achievement information
 * @param {Object} userData - User information
 * @param {Object} confirmationData - Submission details
 * @returns {Promise<boolean>} Success status
 */
export const sendAchievementNotification = async (achievementData, userData, confirmationData) => {
  try {
    // Validate webhook URL
    if (!DISCORD_CONFIG.WEBHOOK_URL || DISCORD_CONFIG.WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
      console.warn('⚠️ Discord webhook URL not configured');
      return false;
    }

    // Create embed message
    const nameValue = achievementData?.nameTranslations ?? achievementData?.name;
    const descValue = achievementData?.descTranslations ?? achievementData?.desc;
    const rewardValue = achievementData?.specialRewardTranslations ?? achievementData?.specialReward;
    const achievementName = resolveLocalizedText(nameValue);
    const achievementDesc = resolveLocalizedText(descValue);
    const specialReward = resolveLocalizedText(rewardValue);

    const embed = {
      title: `🏆 Achievement Submitted!`,
      description: `**${achievementName}**`,
      color: 0xFFD700, // Gold color for achievements
      fields: [
        {
          name: '📝 Submission Details',
          value: confirmationData.desc || 'No details provided',
          inline: false
        },
        {
          name: '📋 Achievement Description',
          value: achievementDesc || 'No description available',
          inline: false
        },
        {
          name: '⭐ XP Reward',
          value: `+${achievementData.xp} XP`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Meo\'s Journey'
      }
    };

    // Add special reward if exists
    if (specialReward) {
      embed.fields.push({
        name: '🎁 Special Reward',
        value: specialReward,
        inline: false
      });
    }

    // Add image if provided
    if (confirmationData.imgUrl) {
      embed.image = {
        url: confirmationData.imgUrl
      };
    }

    // Prepare webhook payload - bot name and avatar will be used from Discord bot settings
    const payload = {
      embeds: [embed]
    };

    // Send to Discord
    const response = await fetch(DISCORD_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Discord achievement notification sent successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Discord webhook failed:', response.status, errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Error sending Discord achievement notification:', error);
    return false;
  }
};

/**
 * Send level up notification to Discord
 * @param {Object} userData - User information
 * @param {Object} levelUpData - Level up details
 * @returns {Promise<boolean>} Success status
 */
export const sendLevelUpNotification = async (userData, levelUpData) => {
  try {
    // Validate admin webhook URL
    if (!DISCORD_CONFIG.ADMIN_WEBHOOK_URL || DISCORD_CONFIG.ADMIN_WEBHOOK_URL === 'YOUR_ADMIN_DISCORD_WEBHOOK_URL_HERE') {
      console.warn('⚠️ Discord admin webhook URL not configured');
      return false;
    }

    // Create embed message
    const embed = {
      title: '🎉 Level Up!',
      description: `**${userData.name || 'Unknown User'}** has leveled up!`,
      color: 0x9B59B6, // Purple for level up (distinct from quest/achievement)
      fields: [
        { name: '⬆️ Level', value: `${levelUpData.oldLevel} → ${levelUpData.newLevel}`, inline: true },
        { name: '⭐ Current XP', value: `${levelUpData.newXP}/${levelUpData.maxXP}`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Meo's Journey • Admin" }
    };

    const payload = { embeds: [embed] };

    const ok = await sendDiscordWebhookMessage(payload, DISCORD_CONFIG.ADMIN_WEBHOOK_URL);
    if (ok) console.log('✅ Discord level up notification sent successfully');
    return ok;

  } catch (error) {
    console.error('❌ Error sending Discord level up notification:', error);
    return false;
  }
};

/**
 * Test Discord webhook connection
 * @returns {Promise<boolean>} Success status
 */
export const testDiscordWebhook = async () => {
  try {
    // Validate webhook URL
    if (!DISCORD_CONFIG.WEBHOOK_URL || DISCORD_CONFIG.WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
      console.warn('⚠️ Discord webhook URL not configured');
      return false;
    }

    const payload = {
      content: '🧪 **Test Message** - Discord integration is working! ✅'
    };

    const response = await fetch(DISCORD_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Discord webhook test successful');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Discord webhook test failed:', response.status, errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing Discord webhook:', error);
    return false;
  }
};

// Export configuration for easy access
export { DISCORD_CONFIG };