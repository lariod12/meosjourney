<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **meosjourney** (1813 symbols, 2327 relationships, 19 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

---

# Project: Meosjourney

A gamified personal tracking application with pet companion, activity management, quests, and achievements system.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS (custom design system with black/white theme)
- **Backend**: NocoDB (headless database)
- **State Management**: React hooks
- **Icons**: Lucide React Icons + Custom IconRenderer
- **Fonts**: Playfair Display (italic style)

## Key Features

### 1. Pet Page (`/pet`)
- Interactive pet companion with mood system
- Activity tracking with current activity indicator
- Food, Care, Activity, Moods, and Status tabs
- Add new activities with icon picker
- Set current activity displayed on home page

### 2. User Page (`/user/meos05`)
- Profile management (introduce, caption, skills, hobbies)
- Status updates (current activity, location, mood)
- Daily journal entries
- Photo album and gallery uploads
- Quest and achievement submissions
- Review submitted tasks (pending, failed, completed)

### 3. Home Page (`/`)
- Character profile display
- Current activity indicator
- XP and level progression
- Recent journals and photo albums
- Quest and achievement tracking

## Design System

### Color Palette
- **Primary**: Black (#000000) and White (#ffffff)
- **Borders**: 3-4px solid black
- **Shadows**: Offset shadows (3px 3px 0 #999999, 4px 4px 0 #666666)
- **Accents**: Dashed borders for add/placeholder elements

### Typography
- **Font Family**: 'Playfair Display', serif
- **Font Style**: Italic (throughout the app)
- **Weights**: 600 (normal), 700 (bold)

### Component Patterns
- **Cards**: White background, black border, shadow offset
- **Buttons**: Black border, shadow, hover with outline
- **Modals**: White background, black border, 4px rounded corners
- **Current/Active State**: Black background, white text, "Current" badge

## Activity Management System

### Data Structure
Activities are stored in NocoDB `status` table, `current_activity` field as JSON array:
```json
[
  { "name": "Gaming", "icon": "LuGamepad2" },
  { "name": "Reading", "icon": "LuBookOpen" }
]
```

### Current Activity Logic
- **First item** in array = current activity (displayed on home)
- **Add Activity Modal** has 3 buttons:
  - `Cancel`: Close without saving
  - `Save Only`: Add to list, don't set as current
  - `Save & Show`: Add to list AND set as current
- **Click activity card**: Opens confirm modal to set as current
- **Current activity card**: Black background, white text, "Current" badge

### Visual Indicators
- **Add card**: Dashed border, opacity 0.8
- **Normal card**: White background, black solid border
- **Current card**: Black background, white text, badge in top-right

## File Structure

```
src/
├── features/
│   ├── pet/
│   │   ├── components/
│   │   │   ├── PetPage.jsx              # Main pet page
│   │   │   ├── AddActivityModal.jsx     # Add activity modal (3 buttons)
│   │   │   └── ConfirmActivityModal.jsx # Confirm set current modal
│   │   └── styles/
│   │       ├── pet.css                  # Pet page styles
│   │       ├── add-activity-modal.css   # Add modal styles
│   │       └── confirm-activity-modal.css # Confirm modal styles
│   ├── user/
│   │   └── components/
│   │       └── UserPage.jsx             # User profile & updates
│   └── home/
│       └── components/
│           └── HomePage.jsx             # Main dashboard
├── services/
│   └── nocodb/
│       ├── core.js                      # NocoDB API client
│       └── profile.js                   # Status & profile services
└── components/
    ├── IconPicker/                      # Icon selection component
    └── IconRenderer/                    # Icon display component
```

## NocoDB Integration

### Key Services
- `fetchStatus()`: Get current activities, mood, location
- `saveStatus(data)`: Update status (prepends to arrays)
- `fetchProfile()`: Get user profile data
- `updateProfile(data)`: Update profile fields

### Status Update Pattern
```javascript
// Add new activity (prepends to array)
await saveStatus({
  doing: { name: "Gaming", icon: "LuGamepad2" }
});

// Result: ["Gaming", ...existing activities]
```

## Development Guidelines

### Adding New Features
1. Check existing patterns in similar features
2. Follow black/white design system
3. Use Playfair Display italic font
4. Add 3-4px black borders with shadow offsets
5. Update CLAUDE.md and agents.md

### Styling Conventions
- Use BEM-like naming: `component__element--modifier`
- Mobile-first responsive design
- Hover states: outline with offset
- Active states: translateY(1px) + reduced shadow
- Disabled states: gray colors, no hover effects

### Modal Patterns
- Overlay: rgba(0, 0, 0, 0.5)
- Container: white bg, 4px black border, 8px shadow
- Header: border-bottom separator
- Footer: border-top separator, flex buttons
- Close button: top-right, 36x36px, black border

## Testing Checklist

Before committing:
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Responsive on mobile (480px)
- [ ] Hover/active states work
- [ ] Modals open/close correctly
- [ ] Data saves to NocoDB
- [ ] Current activity indicator updates
- [ ] Icons render correctly