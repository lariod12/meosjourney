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

1. Push code lên GitHub:
```bash
git add .
git commit -m "React migration complete"
git push origin main
```

2. Bật GitHub Pages trong repo settings:
   - Vào **Settings** > **Pages**
   - Source: chọn **GitHub Actions**
   - Workflow sẽ tự động build và deploy

**Option 2: Manual Deploy**

```bash
# Deploy thủ công
pnpm run deploy
```

## 🏗️ Project Structure

```
blog-art-minimal/
├── public/
│   └── avatars/           # Custom avatar images
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── global.css # Global styles
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

Global styles are in `src/assets/styles/global.css`. The project uses:
- **Fonts**: Architects Daughter, Kalam, Patrick Hand (via Google Fonts)
- **Colors**: Pure black (#000000), white (#ffffff), and grayscale
- **Layout**: CSS Grid for responsive two-column layout
- **Breakpoints**: 1024px, 768px, 480px, 375px

## 🎨 Style Guidelines

### Design Philosophy
Meo's Journey follows a **hand-drawn sketch aesthetic** with a strict black and white color palette. The design mimics notebook sketches and doodles with intentional imperfections that create charm and personality.

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
- Consistent padding (20-40px)

#### 3. Grid & Flexbox
- Use CSS Grid for main layouts
- Flexbox for component internals
- Maintain sketch aesthetic in all breakpoints

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

### Do's and Don'ts

#### ✅ Do's
- Use only black, white, and grayscale colors
- Apply subtle rotations to elements
- Use thick black borders consistently
- Include hover/active states for all interactive elements
- Maintain hand-drawn, imperfect aesthetic
- Use sketch-style fonts throughout

#### ❌ Don'ts
- Never use colors outside the black/white palette
- Avoid perfect alignment - embrace slight imperfections
- Don't use thin borders (less than 2px)
- Avoid rounded corners - keep sharp edges
- Don't use gradients or complex shadows
- Never use system fonts - stick to sketch fonts

### Implementation Examples

See these components for reference:
- `DeleteConfirmModal` - Perfect modal implementation
- `AdminAchievementsPage` - Button states and interactions
- `PasswordModal` - Form styling and layout

### Testing Your Styles

Before committing styles, ensure:
1. Only black/white/gray colors used
2. All interactive elements have hover/active states
3. Borders are 2-4px thick and black
4. Fonts are from the approved sketch font family
5. Subtle rotations applied where appropriate
6. Responsive design maintained across breakpoints

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

**Made with ❤️ by Méo**

Version 1.0 - React Edition
