# Agent Instructions for blog-art-minimal

## Project Overview
Meo's Journey is an RPG character sheet and quest/journal tracker built with React 19, Vite 7, React Router, NocoDB, and Discord webhooks. The public home page shows the character sheet, while protected user/admin routes handle status updates, journals, quest and achievement submissions, photo albums, profile gallery uploads, approvals, XP updates, and notifications.

## Recent Updates (2026-05-04)

### Pet Page Activity Management System
Added comprehensive activity management with current activity tracking:

**Features:**
- Add new activities with icon picker
- Two save modes: "Save Only" (add to list) and "Save & Show" (set as current)
- Click existing activities to set as current (with confirmation modal)
- Visual indicator for current activity (black background, white text, "Current" badge)
- Current activity displayed on home page

**Components:**
- `AddActivityModal.jsx`: 3-button modal (Cancel, Save Only, Save & Show)
- `ConfirmActivityModal.jsx`: Confirmation dialog for setting current activity
- Activity cards with dashed border for "Add" button
- Current activity card with inverted colors and badge

**Data Structure:**
- Activities stored in `status.current_activity` as JSON array
- First item in array = current activity (displayed on home)
- Format: `[{ "name": "Gaming", "icon": "LuGamepad2" }, ...]`
- Food and care inventory are stored in the staging `pet` table as JSON arrays: `[{ "name": "value", "icon": "" }]`
- Pet status values are stored in the staging `pet` table numeric columns: `status_health`, `status_hunger`, `status_sanity`
- Pet level is not stored in the `pet` table

**Styling:**
- Black/white theme with Playfair Display italic font
- Dashed borders for add/placeholder elements
- Solid black borders (3-4px) with offset shadows
- Current activity: black background, white text, "Current" badge top-right

## File Structure
```
src/
├── components/        # Shared components and layout/common UI
├── config/            # Environment-backed constants
├── contexts/          # Character and language context providers
├── data/              # Static fallback character data
├── features/          # Feature modules for character, quests, journal, achievements, photo album
│   ├── pet/
│   │   ├── components/
│   │   │   ├── PetPage.jsx              # Main pet page with activity management
│   │   │   ├── AddActivityModal.jsx     # Add activity modal (3 buttons)
│   │   │   └── ConfirmActivityModal.jsx # Confirm set current modal
│   │   └── styles/
│   │       ├── pet.css                  # Pet page styles + current activity indicator
│   │       ├── add-activity-modal.css   # Add modal styles
│   │       └── confirm-activity-modal.css # Confirm modal styles
├── hooks/             # Custom React hooks
├── locales/           # Home page translations
├── pages/             # Routed pages: HomePage, UserPage, AdminPage
├── services/          # NocoDB, Discord, storage service layer
│   └── nocodb/
│       └── profile.js # Status & profile services (fetchStatus, saveStatus)
├── styles/            # Global CSS
├── utils/             # Date, journal, and quest journal helpers
├── App.jsx            # Router and page wiring
└── main.jsx           # Vite entry point
```


## Code Style Guidelines
- **Pure Black & White Theme**: ONLY use #000000, #ffffff, and grayscale. NO colors (red, blue, yellow, etc.)
- **Responsive**: Mobile-first with breakpoints at 1024px, 768px, 480px
- **Naming**: 
  - camelCase for JS/JSX variables/functions
  - PascalCase for React components
- **Comments**: Minimal code comments
- **Documentation language**: Always write project documentation in English


## Git & Development Workflow
- Commit messages sort and clean: `update: <clean and concise message>`
- Use English for all code and commits
- Remove debug console.log statements after commits (keep error handling logs)
- Use pnpm for all package management operations


## Architecture Standards
- **Mobile-first design**: All components must be optimized for mobile devices first
- Component-based React structure with separation of concerns
- Routes are defined in `src/App.jsx`: `/`, `/user/meos05`, `/admin/meos05`
- Follow established folder structure: `src/components/`, `src/features/`, `src/pages/`, `src/services/`
- Use React hooks and context for state management
- NocoDB is the primary data source; `src/data/characterData.js` is fallback/default data
- `src/services/nocodb.js` owns table IDs, request throttling, deduplication, image URL handling, and CRUD operations
- `src/services/discord.js` owns user/admin webhook notifications
- Maintain component scalability and reusability

## Maintenance Continuity Rules
- Before changing code, read `README.md` and this `AGENTS.md`, then preserve the maintenance direction already established.
- Keep `/user/meos05` and `/admin/meos05` lazy-loaded from `src/App.jsx`; do not make route imports eager again.
- Keep `src/pages/UserPage/` and `src/pages/AdminPage/` as thin wrappers only. Feature implementations belong in `src/features/user/` and `src/features/admin/`.
- Continue splitting large User/Admin UI into section components and hooks. Prefer adding focused files under `components/sections/`, `hooks/`, or `styles/` instead of growing giant page files.
- Keep user/admin CSS split by section: user styles in `src/features/user/styles/`, admin styles in `src/features/admin/styles/`, and only truly shared rules in `src/styles/global.css`.
- Keep NocoDB helpers modular under `src/services/nocodb/`; `src/services/nocodb.js` should stay a barrel/compatibility export.
- Do not reintroduce Firebase or old storage service files. Uploads and data operations should use NocoDB helpers.
- Keep `IconRenderer` and `IconPicker` backed by `src/components/IconRenderer/iconRegistry.js`; avoid wildcard or whole-pack `react-icons` imports.
- Preserve optimized user submit behavior: use dirty-section tracking, skip heavy quest/achievement reloads unless task submissions or auto-approve require them, and keep simple profile/status/journal submits fast.
- Preserve optimized home loading: render cached/fallback data immediately, hydrate profile/status first, then load journal/config/quests/achievements in the background.
- Preserve NocoDB table structure for status and journals. Status saves still update the same status fields; status journal history should be one grouped `journals.caption` record per status submit with one line per changed field.
- When adding new behavior, update existing docs/rules when the maintenance contract changes; do not create new `.md` files unless explicitly requested.

## Design System Requirements
- **Color palette**: Strict black (#000000), white (#ffffff), and grayscale only
- **Typography**: Use sketch fonts (Patrick Hand, Kalam, Architects Daughter)
- **Borders**: 2-4px solid black borders consistently
- **Effects**: Subtle rotations (-1deg to 1deg) for hand-drawn aesthetic
- **Shadows**: Solid black shadows (4px 4px 0 #000000)
- **Touch targets**: Minimum 44px for mobile interactions

## CSS Class Naming Convention
- **Component-specific classes**: Always prefix with component name (e.g., `.admin-container`, `.quest-modal-header`)
- **Global classes**: Only define in `src/styles/global.css`
- **Never reuse generic names** like `.empty-message`, `.container` in component CSS files
- Use BEM-like naming: `.component-element-modifier`

## File Organization
- Documentation: update existing `.md` files only unless explicitly asked to create a new one
- Primary docs: root `README.md`, root `AGENTS.md`, and existing files in `docs/`
- All documentation content must be written in English unless the user explicitly asks for another language
- Local database/reference exports: `local/`
- Component CSS: Co-located with components, use prefixed class names
- Global styles: Single file `src/styles/global.css` (imported in App.jsx)
- Static assets: `src/assets/` for images, fonts, icons only
- Firebase data: Reference `local/firestore_data_*.json` for current structure

## Database Operations
- Reference `local/DatabaseArchitecture.md` for schema understanding
- Use NocoDB service helpers in `src/services/nocodb.js` for app data operations
- Check existing data structure in `local/firestore_data_*.json` files when legacy Firebase context is needed

### NocoDB MCP Access

- This project has a local NocoDB MCP server configured as `nocodb-meosjourney` for agent-assisted database inspection and record work.
- Codex local config: `C:\Users\ADMIN\.codex\config.toml` under `[mcp_servers.nocodb_meosjourney]`.
- Claude Code project config: `.mcp.json` in this repo. This file contains a private MCP token and is ignored by git through the root dot-folder ignore rule.
- Never copy the NocoDB MCP token into docs, commits, logs, or chat responses.
- Use NocoDB MCP when the task needs live NocoDB context such as checking records, validating existing data, inspecting table content, or verifying a database-side issue.
- For app code changes, keep using `src/services/nocodb/` helpers as the runtime data layer. MCP is for agent operations, not browser runtime code.
- Before any write/update/delete through MCP, confirm the intended environment and table. Be extra careful with production data.
- If MCP connection fails with 404 or auth errors, ask the user to regenerate the MCP URL/token from the NocoDB Base Settings and update both local configs. Do not guess or replace tokens from public docs.
- Prefer staging/development verification first when changing behavior related to records, image fields, relationships, status, journals, album, gallery, quests, or achievements.

### NocoDB Link Operations (One-to-One Relationships)

**Important**: When linking records in NocoDB one-to-one relationships, use the **Foreign Key field** directly, NOT the LinkToAnotherRecord field.

#### How to Find the Correct Field Name:
1. Use MCP tool `getTableSchema` to inspect the table
2. Look for the **ForeignKey** field (e.g., `quests_confirm_id`)
3. Do NOT use the **LinkToAnotherRecord** field (e.g., `quest_confirm`)

#### Example: Linking attachments_gallery to quests_confirm

**Schema Structure:**
```javascript
// attachments_gallery table has:
// - quest_confirm (LinkToAnotherRecord) - DO NOT USE for updates
// - quests_confirm_id (ForeignKey) - USE THIS for updates
```

**Correct Way to Link:**
```javascript
// ✅ CORRECT: Use Foreign Key field
const linkPayload = [{
  Id: attachmentId,
  quests_confirm_id: questConfirmId  // Use FK field, single value (not array)
}];

await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records`, {
  method: 'PATCH',
  body: JSON.stringify(linkPayload)
});
```

**Wrong Ways (Don't Do This):**
```javascript
// ❌ WRONG: Using LinkToAnotherRecord field with array
quest_confirm: [questConfirmId]

// ❌ WRONG: Using LinkToAnotherRecord field with single value
quest_confirm: questConfirmId
```

#### Key Points:
- **One-to-one belongs-to side**: Only update the belongs-to side (the side with `bt: true` in schema)
- **Foreign Key field**: Use the field ending with `_id` (e.g., `quests_confirm_id`)
- **Single value**: Don't use array format for one-to-one FK updates
- **Auto-linking**: The other side of the relationship will be automatically linked by NocoDB

#### Workflow for Image Upload with Link:
1. Create record in attachments_gallery (with title only)
2. Upload image to NocoDB storage (`/api/v2/storage/upload`)
3. Update record with image data (PATCH with `img_bw` field)
4. Link to related record using FK field (PATCH with `quests_confirm_id` field)
5. The related record's link field will be automatically populated

### NocoDB Image Loading Best Practices

**Problem**: Loading images from NocoDB with one-to-one relationships can be tricky due to nested query limitations and S3 access issues.

#### What Doesn't Work:
1. ❌ **Nested Query with LinkToAnotherRecord**: 
   ```javascript
   // This returns data but img_bw is a JSON STRING, not array
   &nested[quest_img][fields]=img_bw,title
   ```
   - NocoDB returns `img_bw` as JSON string: `"[{\"url\":\"...\"}]"`
   - Parsing works but may not include `signedUrl` for S3 access
   - Results in "Access Denied" errors when loading images

2. ❌ **Using Direct URL from Nested Query**:
   - S3 URLs without signatures expire or require authentication
   - Direct `url` field often returns 403 Access Denied

#### What Works: Two-Step Fetch Approach

**✅ Correct Approach**: Fetch tables separately and join in code

```javascript
// Step 1: Fetch main records (e.g., quest confirmations)
const confirmations = await nocoRequest(`${TABLE_IDS.QUESTS_CONFIRM}/records?sort=-created_time`);

// Step 2: Fetch attachments with full field data
const attachments = await nocoRequest(`${TABLE_IDS.ATTACHMENTS_GALLERY}/records?fields=Id,title,img_bw,quests_confirm_id`);

// Step 3: Create lookup map
const attachmentMap = new Map();
attachments.list.forEach(attachment => {
  if (attachment.quests_confirm_id) {
    attachmentMap.set(attachment.quests_confirm_id, attachment);
  }
});

// Step 4: Join data and extract image URLs
const results = confirmations.list.map(record => {
  const attachment = attachmentMap.get(record.Id);
  let imgUrl = null;
  
  if (attachment && attachment.img_bw) {
    // Parse JSON string if needed
    let imgBwArray = typeof attachment.img_bw === 'string' 
      ? JSON.parse(attachment.img_bw) 
      : attachment.img_bw;
    
    if (Array.isArray(imgBwArray) && imgBwArray.length > 0) {
      // Prefer signedUrl for S3 access
      imgUrl = imgBwArray[0].signedUrl || imgBwArray[0].url;
    }
  }
  
  return { ...record, imgUrl };
});
```

#### Key Lessons:
- **Separate fetches** give you full field data including `signedUrl`
- **Parse JSON strings**: NocoDB often returns attachment arrays as JSON strings
- **Prefer signedUrl**: Always use `signedUrl` over `url` for S3 access
- **Map-based joins**: Use `Map` for O(1) lookup performance when joining data
- **Foreign key for lookup**: Use FK field (e.g., `quests_confirm_id`) to match records

#### Performance Considerations:
- Two separate API calls are acceptable for small datasets (<100 records)
- Use caching to prevent duplicate requests
- Consider pagination for large attachment collections

## Code Quality Standards
- Add console.log for UI interactions (debugging aid only)
- Follow React best practices and hooks patterns
- Ensure accessibility compliance (focus states, contrast)
- Test on mobile devices and various screen sizes
- Maintain sketch aesthetic in all interactive states (hover, active, focus)

## Development vs Production Mode Guidelines

### Database Differences
**IMPORTANT**: Development and Production use separate NocoDB databases with different table IDs.

#### Development Environment
- Uses `TABLE_IDS_DEVELOPE` with distinct table IDs
- Image URLs: Use `signedPath` + construct full URL with `${NOCODB_BASE_URL}/${signedPath}`
- Schema differences: Some fields may not exist (e.g., `profile_id` in attachments)
- **Foreign Key Fields**: Development mode only has `Id` fields, lacks `<prefix>_id` fields (e.g., no `profile_id`, only `Id`)
- **ID Mapping**: When using foreign keys for lookups, use the main `Id` field directly, not `<prefix>_id`
- Debug logs: Enabled with `import.meta.env.MODE !== 'production'` condition

#### Staging Environment
- Uses `TABLE_IDS_STAGING` with staging table IDs
- **Image URLs**: Use `signedUrl` directly from NocoDB (same as production)
- **Important**: Staging follows production behavior for image loading, NOT development
- Complete schema with all relationship fields including `<prefix>_id` fields
- **Foreign Key Fields**: Staging has both `Id` and `<prefix>_id` fields (same as production)
- **ID Mapping**: Can use either `Id` or `<prefix>_id` for lookups
- Debug logs: Enabled with `!isProductionMode()` condition (staging shows logs)

#### Production Environment  
- Uses `TABLE_IDS_PRODUCTION` with production table IDs
- Image URLs: Use `signedUrl` directly from NocoDB
- Complete schema with all relationship fields including `<prefix>_id` fields
- **Foreign Key Fields**: Production has both `Id` and `<prefix>_id` fields (e.g., `profile_id`, `quests_confirm_id`)
- **ID Mapping**: Can use either `Id` or `<prefix>_id` for lookups
- Debug logs: Disabled for clean console output

### Common Patterns (No Changes Needed)
- API request structure and error handling
- React component logic and state management
- UI/UX components and styling
- Business logic and data processing
- Cache management and deduplication

### Feature Development Checklist
When adding new features:

1. **Database Operations**:
   - ✅ Add table IDs to all three: `TABLE_IDS_PRODUCTION`, `TABLE_IDS_STAGING`, and `TABLE_IDS_DEVELOPE`
   - ✅ Handle schema differences between environments
   - ✅ Use environment-specific queries when needed
   - ✅ **Critical**: Use `Id` field for foreign key lookups in development (no `<prefix>_id` fields)
   - ✅ Use `<prefix>_id` fields in production AND staging when available

2. **Image/File Handling**:
   - ✅ Use `signedPath` for development, `signedUrl` for production AND staging
   - ✅ Construct URLs correctly: `${NOCODB_BASE_URL}/${signedPath}` (development) vs `signedUrl` (staging/production)
   - ✅ Test image loading in all three environments (development, staging, production)
   - ✅ **Critical**: Staging uses production logic for images, not development logic

3. **Debug Logging**:
   - ✅ Wrap debug logs with `if (import.meta.env.MODE !== 'production')`
   - ✅ Keep error/warning logs in both environments
   - ✅ Use descriptive debug messages for troubleshooting

4. **Testing Requirements**:
   - ✅ Test in development mode first
   - ✅ Verify data loading and display
   - ✅ Check image/file URLs work correctly
   - ✅ Ensure no production debug logs appear

### Example Pattern for Image Processing
```javascript
// Development mode: construct URL from path
// Production/Staging mode: use signedUrl directly
if (import.meta.env.MODE === 'development') {
  imageUrl = imageObj.signedPath || imageObj.path || null;
  if (imageUrl) {
    imageUrl = `${NOCODB_BASE_URL}/${imageUrl}`;
  }
} else {
  // Production AND Staging: use signedUrl directly
  imageUrl = imageObj.signedUrl || imageObj.url || null;
}
```

**Key Points**:
- **Development**: Constructs full URL from local path (`signedPath` or `path`)
- **Staging & Production**: Uses `signedUrl` directly from NocoDB (no URL construction)
- **Why**: NocoDB staging/production provides signed URLs for S3 access, development uses local file paths

### Example Pattern for Foreign Key Lookups
```javascript
// Development mode: only use Id field
// Production mode: can use either Id or <prefix>_id field
const lookupKey = import.meta.env.MODE === 'production' 
  ? record.profile_id || record.Id  // Production: prefer <prefix>_id
  : record.Id;                     // Development: only Id available

const relatedRecord = records.find(r => r.Id === lookupKey);
```

## Notes
- Current System Info Window 11 
- Do not run dev because server is already running 
- Do not use pnpm deploy because we working on local no need to do this
- Do not create .md file
- You need to read README.md at root to know the context

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **meosjourney** (4945 symbols, 9517 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/meosjourney/context` | Codebase overview, check index freshness |
| `gitnexus://repo/meosjourney/clusters` | All functional areas |
| `gitnexus://repo/meosjourney/processes` | All execution flows |
| `gitnexus://repo/meosjourney/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
