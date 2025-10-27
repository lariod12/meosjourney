---
inclusion: always
---

## Project Context
Meo's Journey is a React-based RPG character sheet with a black & white sketch aesthetic. Always read README.md first to understand project conventions before making code changes.

## Git & Development Workflow
- Commit messages: `update: <clean and concise message>`
- Use English for all code and commits
- Remove debug console.log statements after commits (keep error handling logs)
- Use pnpm for all package management operations
- Do not auto-commit without user request

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
- **Global classes**: Only define in `src/assets/styles/global.css`
- **Never reuse generic names** like `.empty-message`, `.container` in component CSS files
- Use BEM-like naming: `.component-element-modifier`

## File Organization
- Documentation: `local/` folder (except root README.md)
- Component CSS: Co-located with components, use prefixed class names
- Global styles: Single file `src/assets/styles/global.css` (imported in App.jsx)
- Firebase data: Reference `local/firestore_data_*.json` for current structure

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

