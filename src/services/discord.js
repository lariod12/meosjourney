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

// Discord Configuration
const DISCORD_CONFIG = {
  // Discord webhook URL - bot name and avatar will be used from Discord bot settings
  WEBHOOK_URL: 'https://discord.com/api/webhooks/1409114023366230117/2g6lELXazBqSf9cTOtaobc3KQTb6M0XQTRjm_XQbZefIr4TsrjrO_C63GPlwU83EG0wl'
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
    const embed = {
      title: 'Quest Submitted!',
      color: 0x000000, // Black color to match theme
      fields: [
        {
          name: 'Quest Name',
          value: questData.name,
          inline: false
        },
        {
          name: '📝 Submission Details',
          value: confirmationData.desc || 'No details provided',
          inline: false
        },
        {
          name: '📋 Quest Description',
          value: questData.desc || 'No description available',
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

    // Get emoji from achievement icon
    const achievementEmoji = getEmojiFromIcon(achievementData.icon);

    // Create embed message
    const embed = {
      title: `Achievement Submitted!`,
      color: 0xFFD700, // Gold color for achievements
      fields: [
        {
          name: `Achievement Name`,
          value: achievementData.name,
          inline: false
        },
        {
          name: '📝 Submission Details',
          value: confirmationData.desc || 'No details provided',
          inline: false
        },
        {
          name: '📋 Achievement Description',
          value: achievementData.desc || 'No description available',
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
    if (achievementData.specialReward) {
      embed.fields.push({
        name: '🎁 Special Reward',
        value: achievementData.specialReward,
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
    // Validate webhook URL
    if (!DISCORD_CONFIG.WEBHOOK_URL || DISCORD_CONFIG.WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
      console.warn('⚠️ Discord webhook URL not configured');
      return false;
    }

    // Create embed message
    const embed = {
      title: '🎉 Level Up!',
      description: `**${userData.name || 'Unknown User'}** has leveled up!`,
      color: 0x00FF00, // Green color for level up
      fields: [
        {
          name: '📊 New Level',
          value: `Level ${levelUpData.newLevel}`,
          inline: true
        },
        {
          name: '📈 Previous Level',
          value: `Level ${levelUpData.oldLevel}`,
          inline: true
        },
        {
          name: '⭐ Current XP',
          value: `${levelUpData.newXP}/${levelUpData.maxXP}`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Meo\'s Journey'
      }
    };

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
      console.log('✅ Discord level up notification sent successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Discord webhook failed:', response.status, errorText);
      return false;
    }

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