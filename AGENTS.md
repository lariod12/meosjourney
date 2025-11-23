# Agent Instructions for blog-art-minimal

## Project Overview
RPG character sheet website built with React + Vite. Black & white sketch/game art theme with mobile-first responsive design.

## File Structure
```
src/
├── styles/            # Global CSS
├── components/        # React components
├── contexts/          # React Context providers
├── data/             # Static data (characterData.js)
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── App.jsx           # Main app component
└── main.jsx          # Vite entry point
```


## Code Style Guidelines
- **Pure Black & White Theme**: ONLY use #000000, #ffffff, and grayscale. NO colors (red, blue, yellow, etc.)
- **Responsive**: Mobile-first with breakpoints at 1024px, 768px, 480px
- **Naming**: 
  - camelCase for JS/JSX variables/functions
  - PascalCase for React components
- **Comments**: Minimal code comments


## Git & Development Workflow
- Commit messages sort and clean: `update: <clean and concise message>`
- Use English for all code and commits
- Remove debug console.log statements after commits (keep error handling logs)
- Use pnpm for all package management operations


## Architecture Standards
- **Mobile-first design**: All components must be optimized for mobile devices first
- Component-based React structure with separation of concerns
- Follow established folder structure: `src/components/`, `src/features/`, `src/services/`
- Use React hooks and context for state management
- Maintain component scalability and reusability

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
- Documentation: `local/` folder (except root README.md)
- Component CSS: Co-located with components, use prefixed class names
- Global styles: Single file `src/styles/global.css` (imported in App.jsx)
- Static assets: `src/assets/` for images, fonts, icons only
- Firebase data: Reference `local/firestore_data_*.json` for current structure

## Database Operations
- Reference `local/DatabaseArchitecture.md` for schema understanding
- Use Firebase MCP tools for database operations
- Check existing data structure in `local/firestore_data_*.json` files

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
   - ✅ Add table IDs to both `TABLE_IDS_PRODUCTION` and `TABLE_IDS_DEVELOPE`
   - ✅ Handle schema differences between environments
   - ✅ Use environment-specific queries when needed
   - ✅ **Critical**: Use `Id` field for foreign key lookups in development (no `<prefix>_id` fields)
   - ✅ Use `<prefix>_id` fields in production when available

2. **Image/File Handling**:
   - ✅ Use `signedPath` for development, `signedUrl` for production
   - ✅ Construct URLs correctly: `${NOCODB_BASE_URL}/${signedPath}` vs `signedUrl`
   - ✅ Test image loading in both environments

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
// Development mode: use signedPath, Production mode: use signedUrl
if (import.meta.env.MODE !== 'production') {
  imageUrl = imageObj.signedPath || imageObj.path || null;
  if (imageUrl) {
    imageUrl = `${NOCODB_BASE_URL}/${imageUrl}`;
  }
} else {
  imageUrl = imageObj.signedUrl || imageObj.url || null;
}
```

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
