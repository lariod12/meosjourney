# Agent Instructions for blog-art-minimal

## Project Overview
RPG character sheet website built with React + Vite. Black & white sketch/game art theme with mobile-first responsive design.

## Build/Lint/Test Commands
- **Development**: `pnpm run dev` (starts dev server on port 3000)
- **Build**: `pnpm run build` (production build with code obfuscation)
- **Preview**: `pnpm run preview` (preview production build)
- **No test framework**: Project uses React without test suite
- **Validation**: Manual browser testing only

## Architecture & Structure
- **Frontend-only**: React SPA with Vite bundler, no backend
- **Package Manager**: pnpm (faster than npm)
- **State Management**: React Context API (`CharacterContext`)
- **Components**: Modular component architecture in `src/components/`
- **Character Data**: Centralized in `src/data/characterData.js`
- **Avatar**: Loaded from `/public/avatars/avatar.{png,jpg,jpeg,gif,webp}` or DiceBear API fallback via custom hook
- **Tabs**: Status/Introduce/Skills/Hobbies in left sidebar; Quests/Journal/History/Achievements in right content area
- **Build Output**: Production builds to `dist/` with code obfuscation and minification

## Code Style Guidelines
- **Pure Black & White Theme**: ONLY use #000000, #ffffff, and grayscale. NO colors (red, blue, yellow, etc.)
- **Fonts**: 'Architects Daughter' (titles), 'Kalam' (body), 'Patrick Hand' (secondary text)
- **Icons**: Use symbols/ASCII art only (▸ ◆ ⚛ ✎ ♪). NO colored emojis
- **Layout**: Two-column grid (380px left sidebar, 1fr right content). Sticky left sidebar
- **Responsive**: Mobile-first with breakpoints at 1024px, 768px, 480px
- **Naming**: 
  - camelCase for JS/JSX variables/functions
  - PascalCase for React components
  - kebab-case for CSS classes
- **Components**: Functional components with hooks (no class components)
- **Comments**: Minimal code comments; Vietnamese comments in `characterData` acceptable

## File Structure
```
src/
├── assets/styles/     # Global CSS
├── components/        # React components
├── contexts/          # React Context providers
├── data/             # Static data (characterData.js)
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── App.jsx           # Main app component
└── main.jsx          # Vite entry point
```
