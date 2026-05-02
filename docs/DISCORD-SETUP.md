# Discord Notification Setup

## Overview

`src/services/discord.js` sends Discord webhook notifications for user submissions, admin-created tasks, admin approvals, and level-up events.

There are two webhook channels in the current service:

- User-facing submission webhook
- Admin webhook for task creation, approval, and level-up notifications

Do not paste real webhook URLs into documentation or chat. Treat webhook URLs as secrets.

## Notification Types

| Function | Trigger |
| --- | --- |
| `sendQuestSubmissionNotification` | User submits a quest confirmation. |
| `sendAchievementNotification` | User submits an achievement confirmation. |
| `sendAdminQuestCreatedNotification` | Admin creates a quest. |
| `sendAdminAchievementCreatedNotification` | Admin creates an achievement. |
| `sendAdminQuestCompletedNotification` | Admin approves a quest completion. |
| `sendAdminAchievementCompletedNotification` | Admin approves an achievement completion. |
| `sendLevelUpNotification` | XP update causes a level increase. |
| `testDiscordWebhook` | Manual webhook smoke test. |

## Current Integration Points

### User Page

`src/pages/UserPage/UserPage.jsx` calls Discord helpers during quest/achievement submission and auto-approval flows.

Related NocoDB operations:

- `saveQuestConfirmation`
- `saveAchievementConfirmation`
- `updateProfileXP`
- `saveQuestCompletionJournal`
- `saveAchievementCompletionJournal`

### Admin Page

`src/pages/AdminPage/AdminPage.jsx` calls Discord helpers when admins create quests/achievements and approve completions.

Related NocoDB operations:

- `createQuest`
- `createAchievement`
- `updateQuestConfirmationStatus`
- `updateAchievementConfirmationStatus`
- `updateProfileXP`

## Message Content

Discord embeds include:

- Quest or achievement name
- Localized description where available
- Submission text
- XP reward
- Special reward for achievements when available
- Proof image URL when provided
- Timestamp

The service resolves localized text from string, object, or NocoDB array formats and prefers Vietnamese text for Discord messages.

## Configuration

Webhook URLs are currently configured inside `src/services/discord.js` in `DISCORD_CONFIG`.

Recommended improvement for future work:

```javascript
const DISCORD_CONFIG = {
  WEBHOOK_URL: import.meta.env.VITE_DISCORD_WEBHOOK_URL,
  ADMIN_WEBHOOK_URL: import.meta.env.VITE_DISCORD_ADMIN_WEBHOOK_URL
};
```

Then add those variables to local `.env.*` files and GitHub Pages environment variables.

## Security Notes

- Never commit new webhook URLs directly to code.
- Rotate a webhook immediately if it appears in public logs or screenshots.
- Do not print full webhook URLs in GitHub Actions logs.
- Keep error logs useful, but avoid exposing secret tokens.

## Testing

Manual test from app code:

```javascript
import { testDiscordWebhook } from './src/services/discord.js';

testDiscordWebhook();
```

Practical test:

1. Submit a quest or achievement from `/user/meos05`.
2. Approve it from `/admin/meos05`.
3. Confirm the expected Discord channels receive submission/admin messages.
4. If XP crosses a level boundary, confirm the level-up notification.

## Troubleshooting

### Webhook Does Not Send

- Verify the webhook still exists in Discord.
- Check browser console for HTTP status and error text.
- Confirm the webhook has permission to post in the target channel.
- Make sure the payload embed fields are not too long for Discord limits.

### Image Does Not Render

- Confirm the proof image URL is publicly accessible.
- For NocoDB/S3 images, prefer `signedUrl` in staging and production.
- Avoid expired or unauthenticated direct storage URLs.

### Rate Limited

Discord webhooks can rate limit bursts. Avoid loops that send many notifications at once, and keep admin/user notification calls scoped to actual create/submit/approve events.

## Related Files

- `src/services/discord.js`
- `src/pages/UserPage/UserPage.jsx`
- `src/pages/AdminPage/AdminPage.jsx`
- `src/utils/questJournalUtils.js`
