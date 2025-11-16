# Meo's Journey - RPG Character Sheet

A beautiful, minimalist RPG character sheet website built with **React** and **Vite**. Features a striking black & white sketch/game art aesthetic with smooth animations and a mobile-first responsive design.

## ✨ Features

- 🎨 **Pure Black & White Design** - Minimalist sketch art theme
- ⚡ **React + Vite** - Lightning-fast development and production builds
- 📱 **Mobile-First Responsive** - Optimized for all screen sizes
- 🔒 **Code Obfuscation** - Production builds are fully obfuscated for security
- 🎮 **Interactive UI** - Smooth animations and transitions
- 🧩 **Component-Based** - Modular, maintainable architecture
- 🌐 **Static Deployment** - Deploy anywhere (Vercel, Netlify, GitHub Pages)

## 📝 Notes

- Body text font is standardized to **Playfair (Playfair Display)**.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended for faster installs)

```bash
npm install -g pnpm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/blog-art-minimal.git
cd blog-art-minimal

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The app will open at `http://localhost:3000`

## 📦 Build & Deploy

```bash
# Production build with code obfuscation
pnpm run build

# Preview production build locally
pnpm run preview
```

Build output will be in the `dist/` directory, ready for deployment.

### Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

**Option 1: Automatic Deploy (Recommended)**

GitHub Actions workflow đã được cấu hình. Chỉ cần:

1. Push code to GitHub:
```bash
git add .
git commit -m "React migration complete"
git push origin main
```

2. Bật GitHub Pages trong repo settings:
   - Vào **Settings** > **Pages**
   - Source: chọn **GitHub Actions**
   - Workflow sẽ tự động build và deploy

## 🏗️ Project Structure

```
blog-art-minimal/
├── public/
│   └── avatars/           # Custom avatar images
├── src/
│   ├── assets/
│   │   └── images/        # Static images, icons, fonts
│   ├── styles/
│   │   └── global.css     # Global styles
│   ├── components/        # React components
│   │   ├── Avatar.jsx
│   │   ├── StatusBox.jsx
│   │   ├── DailyActivities.jsx
│   │   ├── QuestsTab.jsx
│   │   ├── JournalTab.jsx
│   │   ├── HistoryTab.jsx
│   │   ├── AchievementsTab.jsx
│   │   ├── AchievementModal.jsx
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── TabNavigation.jsx
│   │   └── CharacterSheet.jsx
│   ├── contexts/
│   │   └── CharacterContext.jsx  # State management
│   ├── data/
│   │   └── characterData.js      # Character data
│   ├── hooks/
│   │   └── useAvatar.js          # Custom hooks
│   ├── utils/
│   │   └── dateUtils.js          # Utilities
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js        # Vite config with obfuscation
├── package.json
└── README.md
```

## 🎨 Customization

### Update Character Data

Edit `src/data/characterData.js` to customize:
- Character name, level, XP
- Skills and hobbies
- Daily quests
- Journal entries
- Achievements
- History

### Custom Avatar

Place your avatar image in `/public/avatars/` with one of these names:
- `avatar.png`
- `avatar.jpg`
- `avatar.jpeg`
- `avatar.gif`
- `avatar.webp`

If no custom avatar is found, it falls back to DiceBear API.

### Update Social Links

Edit `src/components/Footer.jsx` to change social media links.

### Styling

Global styles are in `src/styles/global.css`. The project uses:
- **Fonts**: Architects Daughter, Kalam, Patrick Hand (via Google Fonts)
- **Colors**: Pure black (#000000), white (#ffffff), and grayscale
- **Layout**: CSS Grid for responsive two-column layout
- **Breakpoints**: 1024px, 768px, 480px, 375px

## 🎨 Style Guidelines

### Design Philosophy
Meo's Journey follows a **hand-drawn sketch aesthetic** with a strict black and white color palette. The design mimics notebook sketches and doodles with intentional imperfections that create charm and personality.

> **📱 Mobile-First Design**: All styles MUST be optimized for mobile devices first. This is a mobile-first web application. Desktop styles are enhancements, not the primary focus. Always test on mobile devices and ensure touch-friendly interactions.

### Color Palette
```css
/* Primary Colors - ONLY use these */
--primary-black: #000000;    /* Main text, borders, backgrounds */
--primary-white: #ffffff;    /* Backgrounds, inverted text */
--gray-light: #f8f8f8;      /* Subtle backgrounds */
--gray-medium: #666666;     /* Secondary text, shadows */
--gray-dark: #333333;       /* Disabled states */
```

### Typography
```css
/* Font Hierarchy */
--font-heading: 'Patrick Hand', cursive;     /* Headers, titles */
--font-body: 'Kalam', cursive;              /* Body text, buttons */
--font-accent: 'Architects Daughter', cursive; /* Special elements */

/* Font Sizes */
--text-xs: 14px;    /* Small labels */
--text-sm: 16px;    /* Body text */
--text-md: 18px;    /* Buttons, inputs */
--text-lg: 22px;    /* Subheadings */
--text-xl: 28px;    /* Section headers */
--text-2xl: 42px;   /* Page titles */
```

### Sketch Effects & Animations

#### 1. Rotation Effects
Elements should have subtle random rotations to mimic hand-drawn imperfections:
```css
.sketch-element {
  transform: rotate(-1deg);  /* Slight tilt */
}

.sketch-element-alt {
  transform: rotate(0.5deg); /* Opposite tilt */
}
```

#### 2. Border Styles
All borders should be solid black, typically 2-4px thick:
```css
.sketch-border {
  border: 3px solid #000000;
}

.sketch-border-thick {
  border: 4px solid #000000;
}

.sketch-border-dashed {
  border: 2px dashed #000000; /* For special emphasis */
}
```

#### 3. Shadow Effects
Use solid black shadows to create depth:
```css
.sketch-shadow {
  box-shadow: 4px 4px 0 #000000;
}

.sketch-shadow-hover {
  box-shadow: 6px 6px 0 #000000;
}

.sketch-shadow-pressed {
  box-shadow: 2px 2px 0 #666666;
}
```

#### 4. Button States
All interactive elements should follow this pattern:
```css
.sketch-button {
  background-color: #ffffff;
  color: #000000;
  border: 3px solid #000000;
  transform: rotate(-0.5deg);
  transition: all 0.2s ease;
}

.sketch-button:hover {
  background-color: #000000;
  color: #ffffff;
  transform: rotate(-0.5deg) translateY(-2px);
  box-shadow: 2px 4px 0 #666666;
}

.sketch-button:active {
  transform: rotate(-0.5deg) translateY(0);
  box-shadow: 1px 2px 0 #666666;
}
```

### Component Patterns

#### 1. Modal/Dialog Components
```css
.sketch-modal {
  background-color: #ffffff;
  border: 4px solid #000000;
  transform: rotate(-1deg);
  box-shadow: 8px 8px 0 #000000;
}

.sketch-modal-header {
  background-color: #000000;
  color: #ffffff;
  transform: rotate(1deg);
  margin: -4px -4px 0 -4px;
}
```

#### 2. Form Elements
```css
.sketch-input {
  border: 3px solid #000000;
  background-color: #ffffff;
  font-family: 'Kalam', cursive;
  transition: all 0.3s ease;
}

.sketch-input:focus {
  transform: translateY(-2px);
  box-shadow: 0 0 0 4px #e0e0e0;
}
```

#### 3. Cards/Containers
```css
.sketch-card {
  border: 3px solid #000000;
  background-color: #ffffff;
  transform: rotate(0.5deg);
}

.sketch-card:hover {
  box-shadow: 4px 4px 0 #000000;
  transform: rotate(0.5deg) translateY(-1px);
}
```

### Animation Guidelines

#### 1. Hover Effects
- Always include subtle `translateY(-2px)` on hover
- Add box-shadow for depth
- Keep transitions smooth with `0.2s ease`

#### 2. Active States
- Reduce shadow and translation on `:active`
- Simulate "pressing down" effect

#### 3. Loading States
- Use opacity changes rather than color changes
- Maintain sketch aesthetic even in disabled states

### Mobile-First Guidelines

#### 1. Touch Targets
```css
/* Minimum touch target sizes */
.touch-target {
  min-height: 44px;  /* iOS guideline */
  min-width: 44px;   /* Ensure tappable area */
  padding: 12px 16px; /* Comfortable touch padding */
}
```

#### 2. Mobile Spacing
```css
/* Mobile-optimized spacing */
--mobile-space-xs: 8px;
--mobile-space-sm: 12px;
--mobile-space-md: 16px;
--mobile-space-lg: 24px;
--mobile-space-xl: 32px;
```

#### 3. Responsive Typography
```css
/* Start with mobile sizes, scale up */
.mobile-text {
  font-size: 16px;  /* Minimum for mobile readability */
  line-height: 1.5; /* Comfortable reading */
}

@media (min-width: 768px) {
  .mobile-text {
    font-size: 18px; /* Scale up for larger screens */
  }
}
```

#### 4. Mobile Interactions
- All buttons must be easily tappable (44px minimum)
- Hover effects should also work on touch
- Consider thumb reach zones
- Avoid tiny click targets
- Test on actual mobile devices

### Layout Principles

#### 1. Spacing System
```css
/* Consistent spacing scale */
--space-xs: 5px;
--space-sm: 10px;
--space-md: 15px;
--space-lg: 20px;
--space-xl: 30px;
--space-2xl: 40px;
```

#### 2. Container Patterns
- Always use thick black borders (3-4px)
- White backgrounds with black text
- Subtle rotations for organic feel
- Consistent padding (20-40px on desktop, 16-24px on mobile)

#### 3. Grid & Flexbox
- Use CSS Grid for main layouts
- Flexbox for component internals
- Maintain sketch aesthetic in all breakpoints
- **Mobile-first media queries**: Start with mobile styles, enhance for desktop

#### 4. Square Item Grids (Home Tabs)
- Use a responsive grid that keeps each square at a fixed footprint
- Desktop: `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))`
- Tablet & smaller (`max-width: 768px`): switch to `repeat(2, minmax(140px, 1fr))`
- Extra-small (`max-width: 430px`): tighten to `repeat(2, minmax(120px, 1fr))`
- Always cap item width (e.g., `max-width: 150px`) so fewer cards do not stretch or overflow the tab

### Accessibility Considerations

#### 1. Color Contrast
- Black on white: Perfect contrast ratio
- Gray text (#666666) only for secondary information
- Never use color alone to convey information

#### 2. Focus States
- Clear focus indicators with box-shadow
- Maintain sketch aesthetic in focus states
- Keyboard navigation support

#### 3. Motion Sensitivity
- Keep animations subtle and optional
- Respect `prefers-reduced-motion`

### CSS Class Naming & Specificity

#### ⚠️ Critical: Avoid Global Class Name Conflicts

**Problem**: Component-specific CSS files can override global styles due to CSS specificity rules. Once a class name is defined in a specific component's CSS file, it cannot be reused globally without conflicts.

**Example of the Issue**:
```css
/* ❌ BAD: In AdminPage.css */
.empty-message {
  padding: 40px;
  color: #666666;
}

/* This will override ALL .empty-message classes in other components! */
/* QuestsTab.jsx, JournalTab.jsx, etc. will be affected */
```

**Solution**: Use component-prefixed class names for specific components:
```css
/* ✅ GOOD: In AdminPage.css */
.admin-empty-message {
  padding: 40px;
  color: #666666;
}

/* Now it only affects AdminPage */
```

#### Naming Convention Rules

1. **Component-Specific Classes**: Always prefix with component name
   ```css
   /* In AdminPage.css */
   .admin-container { }
   .admin-header { }
   .admin-empty-message { }
   
   /* In QuestDetailModal.css */
   .quest-modal-container { }
   .quest-modal-header { }
   ```

2. **Global Classes**: Only define in `src/styles/global.css`
   ```css
   /* In src/styles/global.css - safe to use anywhere */
   .btn-primary { }
   .text-center { }
   .container { }
   ```

3. **Shared Component Classes**: Use descriptive, unique names
   ```css
   /* In DeleteConfirmModal.css */
   .delete-confirm-modal { }
   .delete-confirm-title { }
   ```

#### Best Practices

✅ **Do's**:
- Prefix all classes with component/page name
- Use BEM-like naming: `.component-element-modifier`
- Check if class name exists globally before creating
- Document component-specific classes in comments

❌ **Don'ts**:
- Never reuse generic class names like `.empty-message`, `.container`, `.header` in component CSS
- Don't assume your component CSS won't affect others
- Don't create global-sounding names in specific components
- Don't override global classes in component files

#### Migration Guide

If you find conflicting class names:
1. Identify the specific component causing the issue
2. Rename the class with component prefix
3. Update all references in the component's JSX
4. Test to ensure no other components are affected

**Example Migration**:
```jsx
// Before (causes conflicts)
<p className="empty-message">No data</p>

// After (component-specific)
<p className="admin-empty-message">No data</p>
```

### Do's and Don'ts

#### ✅ Do's
- **Design mobile-first, enhance for desktop**
- **Use component-prefixed class names in specific CSS files**
- Use only black, white, and grayscale colors
- Apply subtle rotations to elements
- Use thick black borders consistently
- Include hover/active states for all interactive elements
- Maintain hand-drawn, imperfect aesthetic
- Use sketch-style fonts throughout
- **Ensure touch targets are minimum 44px**
- **Test on actual mobile devices**
- **Use mobile-first media queries**

#### ❌ Don'ts
- **Never design desktop-first**
- **Never reuse generic class names in component-specific CSS files**
- Never use colors outside the black/white palette
- Avoid perfect alignment - embrace slight imperfections
- Don't use thin borders (less than 2px)
- Avoid rounded corners - keep sharp edges
- Don't use gradients or complex shadows
- Never use system fonts - stick to sketch fonts
- **Don't create tiny touch targets**
- **Don't ignore mobile performance**
- **Don't assume desktop behavior on mobile**

### Implementation Examples

See these components for reference:
- `DeleteConfirmModal` - Perfect modal implementation
- `AdminPage` - Button states and interactions
- `PasswordModal` - Form styling and layout

### Testing Your Styles

Before committing styles, ensure:
1. **Mobile-first approach**: Test on mobile devices first
2. **Touch targets**: All interactive elements are minimum 44px
3. Only black/white/gray colors used
4. All interactive elements have hover/active states
5. Borders are 2-4px thick and black
6. Fonts are from the approved sketch font family
7. Subtle rotations applied where appropriate
8. Responsive design maintained across breakpoints
9. **Performance**: Styles don't impact mobile performance
10. **Accessibility**: Works with mobile screen readers

## 🔧 Tech Stack

- **React 19** - UI library
- **Vite 7** - Build tool
- **pnpm** - Package manager
- **JavaScript Obfuscator** - Code protection
- **Terser** - Minification

## 🛡️ Security Features

Production builds include:
- Code obfuscation (hexadecimal identifiers)
- String array encoding (base64)
- Control flow flattening
- Dead code injection
- Console output disabled
- Self-defending code
- Minification with Terser

## 📱 Responsive Design

- **Desktop** (1024px+): Two-column layout with sticky sidebar
- **Tablet** (768px-1024px): Optimized spacing
- **Mobile** (480px-768px): Single column, adjusted font sizes
- **Small Mobile** (375px-480px): Compact layout
- **Extra Small** (<375px): Minimal spacing

## 🎮 Features

### Left Sidebar (Character Info)
- Avatar with XP bar and level
- Status/Introduce/Skills/Hobbies tabs

### Right Content Area
- Daily Quests (read-only display)
- Daily Journal (timestamped entries)
- History (collapsible by date)
- Achievements (grid with modal details)

### Interactive Elements
- Tab navigation
- Achievement modal
- Collapsible history
- Hover effects
- Smooth transitions

## 📝 Development

```bash
# Start dev server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📚 Documentation

- [AGENTS.md](docs/AGENTS.md) - Development guidelines and project structure
- [MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md) - Detailed guide on vanilla JS to React migration
- [DEPLOY.md](docs/DEPLOY.md) - Complete deployment guide for GitHub Pages
- [DISCORD-SETUP.md](docs/DISCORD-SETUP.md) - Discord webhook integration guide
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC License - feel free to use this project for personal or commercial purposes.

## 🙏 Credits

- **Design**: Black & white sketch/game art aesthetic
- **Fonts**: Google Fonts (Architects Daughter, Kalam, Patrick Hand)
- **Icons**: Font Awesome 6.4.0
- **Avatar Fallback**: DiceBear API

---

UI Versioning Guidelines (Front-end Only)

This document defines how we version UI (User Interface) changes in the front-end.
It does not cover business logic or backend changes — only visual and UX changes.

Version format:
<major>.<minor> — e.g. 1.0, 1.1, 2.0

1. Goals
Provide a consistent way to version UI changes.
Make it clear how much the UI has changed between versions.
Help the team:
Communicate UI changes to PM/QA/Design.
Track and compare UI versions.
Separate UI versioning from backend/logic versioning.
2. UI Version Definition
2.1. major – Significant UI changes

Increase the major version when UI changes are large enough that users:

Need to re-learn how to use a screen or flow, or
Experience a significantly changed main workflow, or
See a clearly different overall look & feel.

Cases where you should bump major (1.x → 2.0):

Major redesign

Global theme changes (colors, typography, style) → app looks “new”.
Main layout changes (e.g., navigation moves from top bar to sidebar, or page layout is restructured).

Core flow change

A single-step form becomes a 3-step wizard.
Important actions (search, filter, create, etc.) are moved to new locations or reorganized.

Structural changes in key screens

Form fields are regrouped and reordered based on a new logic.
List view changes from table → cards (or vice versa), requiring users to adapt.

Quick rule of thumb:

If you feel you need to re-demo or re-explain the feature to users because the UI changed a lot → bump major.

2.2. minor – Small / incremental UI changes

Increase the minor version when:

Users do not need to re-learn how to use the UI, and
The main flow remains the same.

Cases where you should bump minor (1.0 → 1.1 → 1.2…):

Small UI additions or tweaks

Add a button, icon, badge, tag, or tooltip.
Add loading/skeleton states.

Light layout adjustments

Adjust margins/paddings, font-size, line-height.
Minor changes to alignment or spacing that don’t affect flow.

Small usability improvements

Change button color for better clarity.
Add labels, helper texts, or clearer error messages.

UI bug fixes

Fix broken layout on mobile.
Fix text overflow, clipped elements, or misalignment.

Quick rule of thumb:

If users can still use the UI exactly as before, but it looks better, clearer, or less buggy → bump minor.

3. Version Bump Rules

Whenever there is a UI-related change (PR/MR touching front-end UI):

If there is a significant UI/UX change (see 2.1)
→ Increase major by 1, reset minor to 0.
Examples:

1.3 → 2.0
2.5 → 3.0

If there are only small UI changes (see 2.2)
→ Increase minor by 1.
Examples:

1.0 → 1.1
1.1 → 1.2

If there is no UI change
→ Do not change the UI version.

Pseudo rule:

if (breaking_ui_change) {
  major += 1
  minor = 0
} else if (any_ui_change) {
  minor += 1
}

4. Where to Store the UI Version

Depending on the project structure, choose one of the following:

A constant in code

// uiVersion.ts
export const UI_VERSION = '1.3';


A separate config file

// ui-version.json
{
  "version": "1.3"
}


A field in the front-end or UI package package.json

{
  "name": "my-frontend",
  "version": "1.3",
  "uiVersion": "1.3"
}


Recommendations:

Place the UI version in a single, well-known location (e.g., one file or constant).
Optionally display the UI version in:
App footer,
About page,
Dev console (e.g., console.log('UI Version: 1.3')).
5. Team Workflow

Suggested workflow:

When creating a UI-related PR/MR:

Add a label:
ui:minor-change for small changes.
ui:major-change for large changes.
Update UI_VERSION in the appropriate config file.

Reviewer responsibilities:

Confirm if the change is truly major or minor based on these rules.
Request a major bump if the change is more impactful than the author assumed.

Changelog (if used):

For each UI version, add a short summary:
UI 1.3: describe key visible changes.
This can live in CHANGELOG.md or an internal release notes page.
6. Examples
Example 1 – Minor bump

Changes:

Adjust spacing in the order creation form.
Add tooltips to info icons.
Fix text overflow on mobile.

→ UI version: 1.0 → 1.1
→ Label: ui:minor-change

Users will notice improvements but do not need to change their habits.

Example 2 – Major bump

Changes:

Switch the entire app to a new dark theme.
Move navigation from top bar to left sidebar.
Change item list from table view to card view.

→ UI version: 1.4 → 2.0
→ Label: ui:major-change

Users will feel that the app is “new” and must adapt to the new layout.

If you want, I can also turn this into a formal internal guideline (with sections like Scope, Responsibilities, Definitions) or adapt the wording for your company’s documentation style (e.g., Confluence template).

---

**Made with ❤️ by Méo**

Version 1.0 - React Edition
