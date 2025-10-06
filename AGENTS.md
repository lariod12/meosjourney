# Agent Instructions for blog-art-minimal

## Project Overview
Static single-page RPG character sheet website using vanilla HTML/CSS/JS with black & white sketch/game art theme.

## Build/Lint/Test Commands
- **Development**: Open `index.html` directly in browser (no build step required)
- **No test framework**: Project uses vanilla JavaScript without tests
- **Validation**: Manual browser testing only

## Architecture & Structure
- **Frontend-only**: Static site with no backend
- **Files**: `index.html` (structure), `style.css` (B&W theme), `script.js` (character data & interactions)
- **Character Data**: All content stored in `characterData` object in `script.js`
- **Avatar**: Loaded from `/public/avatars/avatar.{png,jpg,jpeg,gif,webp}` or DiceBear API fallback
- **Tabs**: Status/Introduce/Skills/Hobbies in left sidebar; Quests/Journal/History in right content area

## Code Style Guidelines
- **Pure Black & White Theme**: ONLY use #000000, #ffffff, and grayscale. NO colors (red, blue, yellow, etc.)
- **Fonts**: 'Architects Daughter' (titles), 'Kalam' (body), 'Patrick Hand' (secondary text)
- **Icons**: Use symbols/ASCII art only (▸ ◆ ⚛ ✎ ♪). NO colored emojis
- **Layout**: Two-column grid (380px left sidebar, 1fr right content). Sticky left sidebar
- **Responsive**: Mobile-first with breakpoints at 1024px, 768px, 480px
- **Naming**: camelCase for JS variables/functions, kebab-case for CSS classes
- **Comments**: Minimal code comments; Vietnamese comments in `characterData` acceptable
