# Meo's Journey

RPG character sheet and personal quest tracker built with React, Vite, NocoDB, and Discord webhooks. The UI follows a black-and-white sketch/game art style with mobile-first responsive layouts.

## Overview

Meo's Journey has three main surfaces:

| Route | Purpose |
| --- | --- |
| `/` | Public character sheet: profile, avatar, status, daily activities, journal, quests, achievements, gallery/photo content. |
| `/user/meos05` | Protected user update page for status/profile/journal entries, quest and achievement submissions, photo albums, and profile gallery uploads. |
| `/admin/meos05` | Protected admin page for creating/managing quests and achievements, reviewing submissions, updating XP, and approving completions. |

NocoDB is the primary data source. `src/data/characterData.js` is fallback/default data for the home page.

## Current Stack

- React `19.2.5`
- React Router DOM `7.9.4`
- Vite `7.1.9`
- pnpm `10.33.2`
- NocoDB API via `src/services/nocodb.js`
- Discord webhooks via `src/services/discord.js`
- Terser production minification
- GitHub Pages deployment with custom domain `https://meosjourney.info/`
- GitNexus code intelligence index for this repo

## Features

- Pure black, white, and grayscale sketch UI
- Mobile-first responsive design
- Public RPG character sheet
- Protected user/admin routes
- NocoDB-backed profile, status, config, quests, achievements, journals, confirmations, gallery, and photo album data
- Quest and achievement submission with proof images
- Admin review, approve/reject, XP update, and level-up flows
- Daily quest scheduling fields
- Photo album and profile gallery uploads
- Vietnamese/English localized task content
- Discord notifications for submissions, admin task creation, approvals, and level ups
- Request deduplication, throttling, and retry backoff for NocoDB calls

## Pet Page Changelogs

Agents must update this section whenever Pet Page behavior, UI, data flow, or user-visible content changes. Keep the newest version first, add changes under the matching version, bump `PET_PAGE_CHANGELOGS` in `src/features/pet/components/PetPage.jsx`, and always use the `vMAJOR.MINOR.PATCH` format, for example `v1.0.0`, `v1.0.1`, or `v1.1.0`. Do not use shortened versions such as `v1.0`. The Pet Page tab is named `Changelogs`: each version must be collapsed by default, show only the version number first, and expand to reveal its changes.

### v1.4.28

- Pet Page now saves mood and activity snapshots without waiting for a status refetch first.
- Rapid repeated mood/activity updates keep only the latest pending snapshot instead of queueing every click.
- Save Only keeps the current mood/activity at the front of the saved list.
- Pet Page falls back to the safer fetch-and-merge save path if status has not hydrated yet.
- The done popup now means the status PATCH succeeded while journal history saves in the background.

### v1.4.27

- Pet Page now shows a visible update popup while activity and mood saves are processing.
- The popup changes to done only after the API save finishes.
- The popup stays sticky over the item grid while the grid is scrolled.
- Activity and mood icon updates use the same completion popup.
- The popup helps users know when it is safe to leave after updating status.

### v1.4.26

- Pet Page now opens after critical pet and event data is ready.
- Activity, mood, location, and weather hydrate in the background after the stage appears.
- Pet password and status requests now fetch only the fields needed for faster staging loads.

### v1.4.25

- The claw machine now grabs the nearest plush when the claw is close enough.
- Nearby grabs snap the plush under the claw before lifting.
- The nearest valid plush is preferred so clustered toys are easier to catch.

### v1.4.24

- The claw machine now accepts strong claw-to-toy grip overlap, not only the exact claw center point.
- Grabs like a claw wrapped around a plush can lift the toy consistently.
- Far edge-only claw contact still fails so inaccurate grabs do not count.

### v1.4.23

- Debug mode can now add a usable claw machine coin directly for Game.
- The debug claim marks a coin as claimed so the Game care item can open without tapping the stage coin.
- The existing Spawn claw coin action remains available for testing coin placement.

### v1.4.22

- The claw machine now requires the claw center to land on the plush.
- Edge-only misaligned grabs no longer count as successful catches.
- Centered grabs now work consistently for smaller plush toys.

### v1.4.21

- Stinky events now only require one Shower per day.
- The stinky event default now uses one daily trigger instead of two.
- Clearing the daily stinky event with Shower no longer schedules a second evening stinky event.

### v1.4.20

- Birthday mode now stops mosquito events from starting.
- Any visible mosquito wave is cleared when birthday mode turns on.
- Forced debug mosquito mode stays paused while birthday mode is active.

### v1.4.19

- The birthday teddy now keeps visible black pupils inside the white eyes.
- The teddy eye shadow no longer inherits the transparent toy text color.
- The birthday teddy size and gift-box animation remain unchanged.

### v1.4.18

- The birthday teddy now appears smaller after jumping from the gift box.
- The teddy root keeps relative positioning so the full bear remains visible.
- The claw machine teddy preview keeps a separate compact scale.

### v1.4.17

- The Game coin count badge now anchors to the top-right card corner.
- The badge no longer appears beside the Game icon.
- The Game icon remains centered on the card.

### v1.4.16

- The Game card now shows a small numeric coin count badge in the top-right corner.
- The Game icon remains centered and visible on the card front face.
- The coin badge no longer changes the front card layout.

### v1.4.15

- The Game card front face now shows only the game console icon and label.
- The `Coin x0` badge was removed from the Game card front face.
- The missing coin warning still appears on the Game card back face when tapped without coins.

### v1.4.14

- The Game card icon is centered consistently with other care item icons.
- The Game card badge layout was adjusted before the badge was later removed from the front face.
- The Game card back face still shows only the short coin warning.

### v1.4.13

- The Game card front face keeps the game console icon visible with the coin badge.
- The coin badge no longer overlaps the Game icon.
- The short coin warning remains on the Game card back face only.

### v1.4.12

- The Game card front face keeps its normal icon, label, and coin badge.
- The Game card back face now shows only the shorter `Cần thêm coin` message.
- The back-face text is smaller, centered, and wraps inside the card.

### v1.4.11

- Tapping Game without a claw coin now flips the Game card to its back face.
- The missing coin message appears directly inside the card for better visibility.
- The Game card returns automatically when the notice timeout ends.

### v1.4.10

- Fixed the Game card no-coin notice so it is no longer clipped by the card button.
- Care items now use an item slot that can show a notice above the card.
- The missing coin message remains anchored to the Game card in the Care tab.

### v1.4.9

- The missing claw machine coin notice now appears from the Game card in the Care tab.
- The notice points at the item that needs a coin instead of floating on the Pet stage.
- The message still closes automatically after a short delay.

### v1.4.8

- Pet Page now clears runtime NocoDB request cache before loading pet data.
- Supported mobile browsers also clear related Cache Storage entries on Pet Page open or refresh.
- NocoDB API requests now use `no-store` fetch options to reduce stale mobile browser data.

### v1.4.7

- Replaced the browser alert for missing claw machine coins with an in-page Pet notice.
- The no-coin message now appears as a black-and-white sketch notification on the Pet stage.
- The notice closes automatically after a short delay.

### v1.4.6

- Added Head Pat as a required Care tab item with a hand icon and description.
- Using Head Pat increases Sanity by 12% without changing Health.
- The staging pet care inventory now includes Head Pat while preserving existing care items.

### v1.4.5

- Stinky events now schedule sequentially across morning (`06:00-12:00`) and evening (`17:00-23:00`) windows.
- Clearing a morning stinky event with Shower schedules the evening event at least three hours later when enough time remains.
- Extra overdue pending stinky triggers are skipped so stinky events no longer stack.

### v1.4.4

- Claw machine coins now keep only one claimable coin active on the Pet stage at a time.
- After a coin is claimed, any overdue pending coins are rescheduled to later random times instead of appearing immediately as a backlog.

### v1.4.3

- Claiming a claw machine coin now makes the coin disappear and shows a floating `+1` from the claimed position.
- The `+1` feedback fades out automatically without blocking stage interactions.

### v1.4.2

- Claw machine coins now spawn only on the ground area of the Pet stage.
- Existing saved coin positions are normalized back onto the ground when Pet events load.

### v1.4.1

- Added a debug action that spawns a claw machine coin immediately on the Pet stage.
- Moved the Game care card coin count into a compact top badge so it no longer crowds the card footer.

### v1.4.0

- Added daily claw machine coins stored in the `events.clawmachine` JSON field.
- Each day schedules three random coin spawn times; due coins appear on the Pet stage and can be tapped to claim.
- Care item Game now shows the available coin count and requires one claimed coin before opening the claw machine.

### v1.3.1

- Care item Game now treats every grabbed plush as a success, even if it lands outside the collection point.
- Successful claw machine rounds now increase Sanity by 25%.
- Fully missed grabs still end as failed attempts with the smaller Sanity reward.

### v1.3.0

- Care item Game opens the full `claw-machine.html` screen from the Pet Page.
- Each game round ends after one grab attempt; catching a plush gives a larger Sanity reward, while missing still gives a smaller reward.
- After completion, the game closes automatically and the Pet Page shows the Sanity increase animation.
- The default Care tab list now only keeps Game; existing saved care inventory should be cleaned in the database if old care items should disappear.
- Debug mode includes a stinky preview for the not-showered state with smell wisps and small buzzing particles around the pet.

### v1.2.0

- Sau popup Happy Birthday đếm ngược 3-2-1, sân khấu mở overlay gắp thú bông ngay trong Pet Page.
- Con thú bông gắp thành công đầu tiên sẽ thay gấu teddy bay ra khỏi hộp quà.
- Sau khi gắp xong, gift box tiếp tục rung lắc, mở bung, confetti, pháo hoa và mũ sinh nhật như trước.
- Thú bông được chọn vẫn có thể tap để nhảy quanh pet giống teddy birthday cũ.
- Kết quả chỉ giữ trong phiên birthday hiện tại và reset khi birthday event kết thúc hoặc reload.

### v1.1.0

- Có birthday event đọc từ `events.birthday` với format `MM-DD` và `enabled`.
- Khi đúng ngày birthday, sân khấu chỉ hiển thị gift box trắng đen.
- Trong ngày birthday, Health, Hunger và Sanity luôn được buff full khi vào app và giữ full cho tới khi hết birthday.
- Sau khi bấm gift box, popup lời chúc làm mờ màn hình, hiện dòng chờ surprise bằng tiếng Anh và đếm ngược 3-2-1 rồi tự đóng.
- Khi popup đóng, gift box trắng đen rung lắc trước khi mở bung, rồi sân khấu unlock confetti, pháo hoa cùng mũ sinh nhật cho pet.
- Gấu bông màu bay ra từ đúng vị trí hộp quà, đáp bên phải, chờ 0.5 giây rồi lắc lư vui nhộn đến gần pet.
- Sau khi gấu bông đứng gần pet, có thể tap vào gấu để gấu nhảy ngẫu nhiên quanh trục X hiện tại.
- Gift box chỉ mở một lần trong phiên birthday để tránh click lặp lại.
- Debug mode có Force birthday để preview effect mà không cần sửa ngày trong database.

### v1.0.0

- Quản lý đồ ăn và vật phẩm chăm sóc cho pet.
- Theo dõi Health, Hunger, Sanity và trạng thái ngủ/thức.
- Quản lý hoạt động hiện tại, mood hiện tại và vị trí của Méo.
- Chụp ảnh pet để lưu vào album hoặc gallery.
- Hiển thị journal, history, album, gallery và status trong bottom tabs.
- Thêm tab Changelogs ở bottom sheet để theo dõi nhiều version.
- Mỗi version trong Changelogs mặc định collapse, chỉ hiện số version và expand ra mới thấy changes.
- Cho phép bấm từng change trong version đã expand để mở popup mô tả chi tiết feature.
- Lấy thời tiết thật để đồng bộ nền mưa và hiệu ứng mưa trên sân khấu pet.
- Hiển thị nhiệt độ thật hoặc fallback theo khung giờ bằng thermometer.
- Có mosquito event với wave, path bay, tap diệt muỗi, bite effect và lưu tiến độ event.
- Thay đổi background, bedtime, meal time và biểu cảm pet theo thời gian trong ngày.

## Quick Start

### Prerequisites

- Node.js 18+ for local development
- pnpm

```bash
npm install -g pnpm
pnpm install
```

### Development

The Vite dev server is configured for `localhost:5555`.

```bash
pnpm run dev
```

Do not start another dev server if one is already running.

### Build

```bash
pnpm run build
```

Preview a production build:

```bash
pnpm run preview
```

## Environment Variables

NocoDB service reads these Vite variables:

| Variable | Purpose |
| --- | --- |
| `VITE_NOCODB_BASE_URL` | NocoDB base URL |
| `VITE_NOCODB_TOKEN` | NocoDB API token |
| `VITE_NOCODB_USE_STATIC` | Use `/nocodb-data.json` when set to `true` |
| `VITE_CHARACTER_ID` | Optional character ID override |
| `VITE_COLLECTION_ROOT` | Optional collection/root override |

Modes use different NocoDB table IDs:

- `development`: `TABLE_IDS_DEVELOPE`
- `staging`: `TABLE_IDS_STAGING`
- `production`: `TABLE_IDS_PRODUCTION`

Staging follows production-style image loading and should use signed URLs.

## Project Structure

```text
src/
├── components/        # Shared UI, layout, modals, common components
├── config/            # Environment-backed constants
├── contexts/          # Character and language providers
├── data/              # Static fallback character data
├── features/          # Character, quests, journal, achievements, photo album UI
├── hooks/             # Custom hooks such as useCharacterData
├── locales/           # Home page translations
├── pages/             # HomePage, UserPage, AdminPage
├── services/          # NocoDB, Discord, storage service layer
├── styles/            # Global CSS
├── utils/             # Date and journal helpers
├── App.jsx            # Router setup
└── main.jsx           # Vite entry point
```

Important root/docs files:

```text
AGENTS.md                    # Agent/project rules plus GitNexus context
docs/project-architecture.md # Architecture, structure, data flow, and maintenance overview
docs/nocodb-database-architecture.md # NocoDB tables, relationships, constraints, and data rules
docs/CACHE-SYSTEM.md         # Current NocoDB request cache/throttle behavior
docs/WHEN-CACHE-CLEARS-VI.md # Vietnamese cache/refresh notes
docs/DEPLOY.md               # GitHub Pages deployment guide
docs/DISCORD-SETUP.md        # Discord webhook integration
docs/TROUBLESHOOTING.md      # Common operational issues
```

## Architecture Notes

### Home Page Data Flow

`useCharacterData()` renders immediately from cached/fallback data, then hydrates NocoDB data in priority order:

- status
- profile with avatar
- today's journals
- config

Quests and achievements load afterward in the background to avoid blocking first paint. Avatar preloading is non-blocking. A short-lived home snapshot in `localStorage` keeps repeat visits fast while fresh NocoDB data revalidates.

### NocoDB Service

`src/services/nocodb.js` owns:

- table IDs for development, staging, and production
- request throttling and concurrency limits
- retry/backoff handling for rate limits
- in-flight request deduplication
- image upload and signed URL handling
- CRUD functions for status, profile, journals, quests, achievements, confirmations, galleries, albums, pet state, and event state

### Refresh Behavior

The app no longer uses the old `meo_journey_home_cache` home-data cache. Home rendering now uses a short-lived `meo_home_data_snapshot` for fast repeat visits, then fresh data is requested through:

- `clearNocoDBCache`
- `meo:refresh`
- `photoalbum:refresh`
- `useCharacterData` refetch

See `docs/CACHE-SYSTEM.md` for details.

### Maintenance Notes

Keep future updates aligned with the current maintenance direction:

- Route pages stay thin. `/user/meos05` and `/admin/meos05` are lazy-loaded from `src/App.jsx`, with feature implementations under `src/features/user/` and `src/features/admin/`.
- Keep large page UI split into feature section components/hooks. Do not move user/admin logic back into `src/pages/` wrappers or grow new all-in-one page files.
- Keep CSS split by feature/section. User page styles live under `src/features/user/styles/`; admin page styles live under `src/features/admin/styles/`; shared global rules stay in `src/styles/global.css`.
- NocoDB service code stays modular under `src/services/nocodb/`, with `src/services/nocodb.js` acting as the compatibility barrel export.
- Avoid broad `react-icons` imports. Add supported icons to `src/components/IconRenderer/iconRegistry.js` so the bundle stays small.
- User submit flow uses dirty-section tracking and skips heavy quest/achievement reloads when only profile/status/journal/media changed.
- Home page uses stale-while-revalidate loading: show cached/fallback UI immediately, hydrate profile/status first, and load journal/config/quests/achievements in the background.
- Status updates still write to the same NocoDB `status` structure. Status journal history is grouped into one `journals.caption` record per status submit, with multiple lines for changed fields.
- Do not reintroduce Firebase/storage legacy services. NocoDB is the active data and upload path.

## Deployment

GitHub Actions deploys to GitHub Pages from `.github/workflows/deploy.yml`.

Automatic deploy runs only when:

- pushing to `main`
- commit message starts with `public:`

Manual deploy is available from GitHub Actions via `workflow_dispatch`.

See `docs/DEPLOY.md`.

## GitNexus

This repository is indexed as `meosjourney`.

Current index stats:

- 87 files
- 1,631 symbols
- 2,412 relationships
- 34 clusters
- 140 execution flows

Useful commands:

```bash
cmd /c npx gitnexus status
cmd /c npx gitnexus analyze
cmd /c npx gitnexus list
```

Agent guidance and MCP resource links are in `AGENTS.md`.

## Design Rules

- Use only black, white, and grayscale colors.
- Keep the sketch/game-art aesthetic.
- Design mobile-first.
- Use component-prefixed CSS classes in component CSS files.
- Keep touch targets at least 44px.
- Keep global styles in `src/styles/global.css`.

See `AGENTS.md` for the full development and design rules.

## Documentation

- `AGENTS.md` - Development rules, architecture standards, database notes, and GitNexus block
- `docs/project-architecture.md` - Architecture, structure, data flow, services, styling, and extension guide
- `docs/nocodb-database-architecture.md` - NocoDB table map, relationships, field rules, image handling, and data constraints
- `docs/CACHE-SYSTEM.md` - Current cache/request deduplication behavior
- `docs/WHEN-CACHE-CLEARS-VI.md` - Vietnamese cache refresh explanation
- `docs/DEPLOY.md` - GitHub Pages deployment
- `docs/DISCORD-SETUP.md` - Discord notification setup
- `docs/TROUBLESHOOTING.md` - Common issues and fixes

## License

ISC
