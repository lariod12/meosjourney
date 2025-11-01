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
- All file .md need to be place in docs/ and only use Vietnamese in all file .md except README.md use English and place at root

## Database Operations
- Reference `local/DatabaseArchitecture.md` for schema understanding
- Use Firebase MCP tools for database operations
- Check existing data structure in `local/firestore_data_*.json` files

## Code Quality Standards
- Add console.log for UI interactions (debugging aid only)
- Follow React best practices and hooks patterns
- Ensure accessibility compliance (focus states, contrast)
- Test on mobile devices and various screen sizes
- Maintain sketch aesthetic in all interactive states (hover, active, focus)

## Notes
- Current System Info Window 11 
- Do not run dev because server is already running 
- Do not use pnpm deploy because we working on local no need to do this