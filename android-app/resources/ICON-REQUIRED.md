# IMPORTANT: Icon Assets Required

## Status: ⚠️ Placeholder Assets Needed

The Android app requires the following icon assets to be created manually:

### Required Files

1. **icon-foreground.png** (1024x1024px)
   - Black cat silhouette on transparent background
   - Simple line art style
   - Keep within 432x432px center (safe zone)

2. **icon-background.png** (1024x1024px)
   - Solid white (#FFFFFF)
   - No transparency

3. **splash.png** (2732x2732px)
   - White background
   - "Meo's Journey" text centered
   - Black text, Playfair Display italic font

## Quick Solution Options

### Option 1: Use Online Tools (Fastest)
1. Go to https://www.canva.com/create/logos/
2. Create 1024x1024px design with black cat icon
3. Export as PNG
4. Save to `android-app/resources/icon-foreground.png`

### Option 2: Use Text-Based Icon (Temporary)
1. Create simple "MJ" text logo in any image editor
2. Font: Playfair Display, italic, bold
3. Color: Black on transparent
4. Size: 1024x1024px

### Option 3: Hire Designer (Professional)
- Fiverr: $5-20 for simple icon
- Upwork: $10-50 for professional design
- 99designs: Contest starting at $299

## After Creating Assets

Run these commands to generate all Android icon sizes:

```bash
cd android-app
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --android
```

Then rebuild the app:

```bash
cd ..
pnpm build:android
```

## Current Workaround

For now, the app will use default Capacitor icons. The APK will build successfully but won't have custom branding until you add these assets.
