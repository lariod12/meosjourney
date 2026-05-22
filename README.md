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
