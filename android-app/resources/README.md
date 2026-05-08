# App Icons & Splash Screens

## Current Status: Placeholder Assets

The following placeholder assets have been created. You should replace them with professional designs.

## Required Assets

### 1. App Icon (Foreground Layer)
**File:** `icon-foreground.png`
**Size:** 1024x1024px
**Current:** Placeholder text "MJ" (Meo's Journey)
**Recommended:** 
- Stylized cat silhouette (Meo = cat in Vietnamese)
- Black line art on transparent background
- Keep important elements within 432x432px center (safe zone)
- Simple, bold lines, recognizable at small sizes

### 2. App Icon (Background Layer)
**File:** `icon-background.png`
**Size:** 1024x1024px
**Current:** Solid white (#FFFFFF)
**Recommended:** Keep solid white or add subtle grayscale pattern

### 3. Splash Screen
**File:** `splash.png`
**Size:** 2732x2732px
**Current:** White background with "Meo's Journey" text
**Recommended:**
- White background (#FFFFFF)
- Center: App icon or branding
- Keep content within 1200x1200px center (safe zone)
- Minimal, matches black/white design system

## How to Replace Assets

1. **Design your assets** using Figma, Canva, or hire a designer
2. **Export as PNG** with exact dimensions above
3. **Replace files** in `android-app/resources/`
4. **Regenerate** Android assets:
   ```bash
   cd android-app
   npx capacitor-assets generate --android
   ```
5. **Rebuild** the app:
   ```bash
   cd ..
   pnpm build:android
   ```

## Design Guidelines

- **Style:** Black/white/grayscale only (matches web app)
- **Font:** Playfair Display, italic, 700 weight
- **Icon Safe Zone:** 66% of canvas (432x432px for 1024x1024px)
- **Splash Safe Zone:** Center 1200x1200px for 2732x2732px
- **Format:** PNG with transparency (foreground) or solid (background/splash)

## Tools for Creating Assets

- **Figma:** https://figma.com (free)
- **Canva:** https://canva.com (free tier available)
- **Android Asset Studio:** https://romannurik.github.io/AndroidAssetStudio/
- **Hire Designer:** Fiverr, Upwork, 99designs

## Next Steps

1. Create professional icon design
2. Replace placeholder files
3. Run asset generation command
4. Test on Android device/emulator
