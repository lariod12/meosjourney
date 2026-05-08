---
phase: 01
title: "Capacitor Setup & Integration"
status: pending
effort: 2h
---

# Phase 01: Capacitor Setup & Integration

## Context Links
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Main Plan](./plan.md)

## Overview

**Priority:** P1 (Critical - Foundation for all other phases)  
**Current Status:** Pending  
**Description:** Install Capacitor, create Android project structure, configure build pipeline

## Key Insights

- Capacitor wraps web apps in native WebView
- Requires separate `android-app/` folder to avoid conflicts with web build
- Uses `capacitor.config.ts` for app metadata and plugin configuration
- Build process: `npm run build` → copy to `www/` → `npx cap sync`

## Requirements

### Functional Requirements
- Install Capacitor CLI and Android platform
- Create `android-app/` folder structure
- Configure Capacitor with app metadata
- Set up build scripts to copy web assets
- Generate Android project files

### Non-Functional Requirements
- Build process must be reproducible
- Configuration must support both dev and production modes
- Android Studio compatibility (API 22+, target API 34)
- Build time under 5 minutes

## Architecture

### Folder Structure
```
meosjourney/
├── src/                          # Web app source (unchanged)
├── dist/                         # Web build output
├── android-app/                  # New Capacitor project
│   ├── www/                      # Web assets (copied from dist/)
│   ├── android/                  # Native Android project
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── res/          # Icons, splash screens
│   │   │   │   └── java/         # Native code (if needed)
│   │   │   └── build.gradle
│   │   ├── gradle/
│   │   └── build.gradle
│   ├── capacitor.config.ts       # Capacitor configuration
│   ├── package.json              # Android-specific deps
│   └── tsconfig.json             # TypeScript config
└── package.json                  # Root package.json (add scripts)
```

### Build Pipeline
```
1. npm run build (in root)
   ↓ produces dist/
2. Copy dist/ → android-app/www/
   ↓
3. npx cap sync android (in android-app/)
   ↓ syncs www/ to android/app/src/main/assets/public/
4. Build APK in Android Studio or CLI
```

## Related Code Files

### Files to Create
- `android-app/capacitor.config.ts`
- `android-app/package.json`
- `android-app/tsconfig.json`
- `android-app/.gitignore`

### Files to Modify
- `package.json` (root) - add build scripts
- `.gitignore` (root) - ignore android-app/android/ build artifacts

### Files to Read
- `vite.config.js` - understand current build config
- `package.json` - check existing dependencies

## Implementation Steps

### Step 1: Install Capacitor Dependencies (Root Project)
```bash
cd d:/Working/meosjourney
npm install --save-dev @capacitor/cli @capacitor/core
npm install @capacitor/android
```

### Step 2: Create android-app Folder Structure
```bash
mkdir -p android-app/www
cd android-app
```

### Step 3: Create android-app/package.json
```json
{
  "name": "meosjourney-android",
  "version": "1.0.0",
  "description": "Meosjourney Android App",
  "scripts": {
    "sync": "cap sync android",
    "open": "cap open android",
    "build:apk": "cd android && ./gradlew assembleRelease",
    "build:bundle": "cd android && ./gradlew bundleRelease"
  },
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0"
  }
}
```

### Step 4: Create android-app/capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meosjourney.app',
  appName: "Meo's Journey",
  webDir: 'www',
  server: {
    androidScheme: 'https',
    // For development, point to local server
    // url: 'http://10.0.2.2:5555',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set in Phase 05
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
```

### Step 5: Create android-app/tsconfig.json
```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "experimentalDecorators": true,
    "lib": ["dom", "es2015"],
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2015",
    "skipLibCheck": true
  },
  "include": ["capacitor.config.ts"]
}
```

### Step 6: Create android-app/.gitignore
```
# Capacitor
www/
.capacitor/

# Android
android/app/build/
android/app/release/
android/build/
android/.gradle/
android/local.properties
android/.idea/
android/*.iml
android/captures/
android/gradle/
android/gradlew
android/gradlew.bat

# Keystores
*.keystore
*.jks
```

### Step 7: Initialize Capacitor Android Platform
```bash
cd d:/Working/meosjourney/android-app
npx cap add android
```

This generates `android-app/android/` folder with native Android project.

### Step 8: Add Build Scripts to Root package.json
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build --mode production",
    "build:android": "npm run build && npm run android:copy && npm run android:sync",
    "android:copy": "node scripts/copy-to-android.js",
    "android:sync": "cd android-app && npx cap sync android",
    "android:open": "cd android-app && npx cap open android"
  }
}
```

### Step 9: Create scripts/copy-to-android.js
```javascript
const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const wwwDir = path.join(__dirname, '../android-app/www');

async function copyToAndroid() {
  try {
    console.log('Copying dist/ to android-app/www/...');
    
    // Remove old www content
    await fs.emptyDir(wwwDir);
    
    // Copy dist to www
    await fs.copy(distDir, wwwDir);
    
    console.log('✓ Copy completed successfully');
  } catch (error) {
    console.error('✗ Copy failed:', error);
    process.exit(1);
  }
}

copyToAndroid();
```

### Step 10: Install fs-extra for Copy Script
```bash
cd d:/Working/meosjourney
npm install --save-dev fs-extra
```

### Step 11: Update Root .gitignore
Add to existing `.gitignore`:
```
# Android build artifacts
android-app/www/
android-app/android/app/build/
android-app/android/build/
android-app/android/.gradle/
android-app/android/local.properties
android-app/android/.idea/
android-app/android/*.iml
```

### Step 12: Test Build Pipeline
```bash
cd d:/Working/meosjourney
npm run build:android
```

Expected output:
- `dist/` folder created with web build
- `android-app/www/` populated with web assets
- `android-app/android/app/src/main/assets/public/` synced
- No errors in console

### Step 13: Verify Android Project in Android Studio
```bash
npm run android:open
```

This opens Android Studio. Verify:
- Project loads without errors
- `app` module visible in project structure
- `build.gradle` files present
- No missing dependencies

## Todo List

- [ ] Install Capacitor CLI and Android platform
- [ ] Create `android-app/` folder structure
- [ ] Create `capacitor.config.ts` with app metadata
- [ ] Create `package.json` for android-app
- [ ] Create `tsconfig.json` for android-app
- [ ] Create `.gitignore` for android-app
- [ ] Initialize Android platform with `cap add android`
- [ ] Add build scripts to root `package.json`
- [ ] Create `scripts/copy-to-android.js`
- [ ] Install `fs-extra` dependency
- [ ] Update root `.gitignore`
- [ ] Test build pipeline (`npm run build:android`)
- [ ] Open project in Android Studio and verify

## Success Criteria

- [ ] `android-app/android/` folder exists with native project
- [ ] `npm run build:android` completes without errors
- [ ] `android-app/www/` contains all web assets (HTML, JS, CSS)
- [ ] Android Studio opens project without errors
- [ ] `AndroidManifest.xml` shows correct app name and package
- [ ] No missing Gradle dependencies

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Capacitor version conflicts | Low | Medium | Use latest stable v6.x, pin versions |
| Android SDK not installed | Medium | High | Document Android Studio setup requirements |
| Gradle build fails | Medium | High | Use Capacitor default Gradle config, test early |
| Copy script fails on Windows | Low | Medium | Use `fs-extra` for cross-platform compatibility |

## Security Considerations

- **App ID:** Use reverse domain notation (`com.meosjourney.app`)
- **HTTPS Scheme:** Use `androidScheme: 'https'` for secure WebView
- **Keystore:** Do NOT commit keystore files (handled in Phase 05)
- **API Keys:** Ensure NocoDB credentials not exposed in web bundle

## Next Steps

After completing this phase:
1. Proceed to [phase-02-ui-optimization.md](./phase-02-ui-optimization.md)
2. Test app in Android emulator or device
3. Document any Android-specific issues encountered
