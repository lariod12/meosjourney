---
phase: 03
title: "App Icons & Splash Screens"
status: pending
effort: 1h
---

# Phase 03: App Icons & Splash Screens

## Context Links
- [Capacitor Assets Guide](https://capacitorjs.com/docs/guides/splash-screens-and-icons)
- [Android Icon Guidelines](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Main Plan](./plan.md)
- [Phase 02](./phase-02-ui-optimization.md)

## Overview

**Priority:** P1 (Critical - App branding)  
**Current Status:** Pending  
**Description:** Create and configure Android app icon and splash screen assets following Material Design guidelines

## Key Insights

- **Android Adaptive Icons:** Require foreground + background layers (API 26+)
- **Icon Sizes:** Multiple densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **Splash Screen:** White background with black elements (matches design system)
- **Capacitor Asset Generator:** Can auto-generate all sizes from source image
- **Design System:** Black/white/grayscale aesthetic must carry to app icon

## Requirements

### Functional Requirements
- Create 1024x1024px source icon (foreground layer)
- Create 1024x1024px background layer (solid white or pattern)
- Generate all Android icon densities
- Create splash screen with app branding
- Configure splash screen duration and behavior

### Non-Functional Requirements
- Icon recognizable at 48x48dp size
- Follows Material Design adaptive icon guidelines
- Splash screen loads in under 2 seconds
- No pixelation or artifacts in generated assets
- Consistent with web app branding

## Architecture

### Icon Structure (Adaptive Icons)
```
android/app/src/main/res/
├── mipmap-mdpi/          # 48x48px
│   ├── ic_launcher.png
│   └── ic_launcher_round.png
├── mipmap-hdpi/          # 72x72px
├── mipmap-xhdpi/         # 96x96px
├── mipmap-xxhdpi/        # 144x144px
├── mipmap-xxxhdpi/       # 192x192px
└── mipmap-anydpi-v26/    # Adaptive icon (XML)
    ├── ic_launcher.xml
    └── ic_launcher_round.xml
```

### Splash Screen Structure
```
android/app/src/main/res/
├── drawable/
│   └── splash.png        # 2732x2732px (max size)
├── drawable-land/
│   └── splash.png        # Landscape variant
└── values/
    └── styles.xml        # Splash screen config
```

### Asset Generation Workflow
```
1. Design source icon (1024x1024px)
   ↓
2. Use @capacitor/assets or manual tool
   ↓
3. Generate all densities
   ↓
4. Copy to android/app/src/main/res/
   ↓
5. Update AndroidManifest.xml
   ↓
6. Test on device/emulator
```

## Related Code Files

### Files to Create
- `android-app/resources/icon.png` - Source icon (1024x1024px)
- `android-app/resources/icon-foreground.png` - Foreground layer
- `android-app/resources/icon-background.png` - Background layer
- `android-app/resources/splash.png` - Splash screen (2732x2732px)
- `android-app/resources/splash-dark.png` - Dark mode splash (optional)

### Files to Modify
- `android-app/android/app/src/main/res/values/styles.xml` - Splash config
- `android-app/android/app/src/main/AndroidManifest.xml` - Icon reference
- `android-app/capacitor.config.ts` - Splash screen settings

### Files Generated (by tool)
- All `mipmap-*/ic_launcher*.png` files
- `drawable*/splash.png` files

## Implementation Steps

### Step 1: Install Capacitor Assets Plugin
```bash
cd d:/Working/meosjourney/android-app
npm install --save-dev @capacitor/assets
```

### Step 2: Design App Icon (Foreground Layer)
Create `android-app/resources/icon-foreground.png` (1024x1024px):

**Design Concept:**
- **Style:** Black line art on transparent background
- **Subject:** Stylized cat silhouette (represents "Meo" = cat in Vietnamese)
- **Elements:** Simple, bold lines, recognizable at small sizes
- **Safe Zone:** Keep important elements within 432x432px center (66% of canvas)

**Manual Creation (if no design tool):**
```
Option 1: Use online tool (e.g., Figma, Canva)
Option 2: Commission designer
Option 3: Use placeholder text "MJ" in Playfair Display italic
```

**Placeholder Icon (Text-based):**
```
- Background: Transparent
- Text: "MJ" (Meo's Journey)
- Font: Playfair Display, italic, 700 weight
- Color: Black (#000000)
- Size: 400px font size, centered
- Export: PNG, 1024x1024px
```

### Step 3: Create Background Layer
Create `android-app/resources/icon-background.png` (1024x1024px):

**Design:**
- **Color:** Solid white (#FFFFFF)
- **Alternative:** Subtle grayscale pattern (optional)

**Simple Solid Color:**
```
- Fill: #FFFFFF
- Export: PNG, 1024x1024px
```

### Step 4: Create Splash Screen
Create `android-app/resources/splash.png` (2732x2732px):

**Design:**
- **Background:** White (#FFFFFF)
- **Center Element:** App icon or "Meo's Journey" text
- **Style:** Minimal, matches black/white design system
- **Safe Zone:** Keep content within 1200x1200px center

**Placeholder Splash:**
```
- Background: White
- Center: "Meo's Journey" text
- Font: Playfair Display, italic, 700
- Color: Black
- Size: 120px font size
- Export: PNG, 2732x2732px
```

### Step 5: Generate Icon Assets
```bash
cd d:/Working/meosjourney/android-app
npx capacitor-assets generate --android
```

This generates all icon densities in `android/app/src/main/res/mipmap-*/`.

**Manual Alternative (if tool fails):**
Use online tool like [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html):
1. Upload `icon-foreground.png`
2. Set background color to white
3. Download generated assets
4. Extract to `android/app/src/main/res/`

### Step 6: Configure Splash Screen in capacitor.config.ts
```typescript
// android-app/capacitor.config.ts
const config: CapacitorConfig = {
  // ... existing config
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#000000",
      splashFullScreen: false,
      splashImmersive: false
    }
  }
};
```

### Step 7: Update Android Splash Screen Styles
Modify `android-app/android/app/src/main/res/values/styles.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <!-- Splash Screen theme -->
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:background">@drawable/splash</item>
        <item name="android:windowBackground">@color/white</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>
```

### Step 8: Add Color Resources
Create/modify `android-app/android/app/src/main/res/values/colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#000000</color>
    <color name="colorPrimaryDark">#000000</color>
    <color name="colorAccent">#666666</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
</resources>
```

### Step 9: Verify AndroidManifest.xml Icon Reference
Check `android-app/android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
    
    <activity
        android:name=".MainActivity"
        android:theme="@style/AppTheme.NoActionBarLaunch"
        android:launchMode="singleTask"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

### Step 10: Copy Splash Screen to Drawable
```bash
# Copy splash.png to all drawable folders
cp android-app/resources/splash.png android-app/android/app/src/main/res/drawable/splash.png
cp android-app/resources/splash.png android-app/android/app/src/main/res/drawable-land/splash.png
```

### Step 11: Sync and Build
```bash
cd d:/Working/meosjourney
npm run android:sync
npm run android:open
```

### Step 12: Test Icon and Splash Screen
In Android Studio:
1. Build and run app on emulator
2. **Test App Icon:**
   - Check home screen launcher icon
   - Verify icon appears correctly at different sizes
   - Test on different Android versions (API 26+ for adaptive)
3. **Test Splash Screen:**
   - Close app completely
   - Reopen and observe splash screen
   - Verify 2-second duration
   - Check smooth transition to main app

### Step 13: Test on Physical Device (if available)
```bash
# Enable USB debugging on Android device
# Connect device via USB
# Run from Android Studio or CLI
cd android-app/android
./gradlew installDebug
```

### Step 14: Document Asset Sources
Create `android-app/resources/README.md`:
```markdown
# App Icon & Splash Screen Assets

## Source Files
- `icon-foreground.png` - 1024x1024px, black on transparent
- `icon-background.png` - 1024x1024px, white solid
- `splash.png` - 2732x2732px, white background with branding

## Design Guidelines
- **Style:** Black/white/grayscale, matches web app
- **Font:** Playfair Display, italic, 700 weight
- **Icon Safe Zone:** 432x432px center (66% of canvas)
- **Splash Safe Zone:** 1200x1200px center

## Generation
Generated using `@capacitor/assets`:
```bash
npx capacitor-assets generate --android
```

## Manual Updates
If regenerating icons:
1. Update source files in `resources/`
2. Run generation command
3. Sync with `npm run android:sync`
4. Test on device/emulator
```

## Todo List

- [ ] Install `@capacitor/assets` plugin
- [ ] Design app icon foreground layer (1024x1024px)
- [ ] Create icon background layer (1024x1024px)
- [ ] Create splash screen (2732x2732px)
- [ ] Generate icon assets with Capacitor Assets
- [ ] Configure splash screen in `capacitor.config.ts`
- [ ] Update `styles.xml` for splash screen theme
- [ ] Add color resources in `colors.xml`
- [ ] Verify `AndroidManifest.xml` icon references
- [ ] Copy splash screen to drawable folders
- [ ] Sync and build project
- [ ] Test app icon on emulator
- [ ] Test splash screen on emulator
- [ ] Test on physical device (if available)
- [ ] Document asset sources in README

## Success Criteria

- [ ] App icon displays correctly in launcher
- [ ] Icon recognizable at 48x48dp size
- [ ] Adaptive icon works on API 26+ devices
- [ ] Splash screen shows for 2 seconds
- [ ] Splash screen matches design system (black/white)
- [ ] Smooth transition from splash to app
- [ ] No pixelation or artifacts in icons
- [ ] Assets documented in README

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Icon not recognizable at small size | Medium | Medium | Test at 48dp, simplify design if needed |
| Asset generation tool fails | Low | Medium | Use manual Android Asset Studio as backup |
| Splash screen too long/short | Low | Low | Adjust `launchShowDuration` in config |
| Icon doesn't match brand | Medium | Low | Iterate on design, get user feedback |

## Security Considerations

- No security implications for icon/splash assets
- Ensure no sensitive data in splash screen

## Next Steps

After completing this phase:
1. Proceed to [phase-04-background.md](./phase-04-background.md)
2. Consider user feedback on icon design
3. Iterate on splash screen if needed
