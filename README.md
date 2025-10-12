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
