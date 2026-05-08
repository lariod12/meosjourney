# Android APK Build Guide

## Current Status: ✅ Ready to Build (Java Required)

All setup is complete! The Android project is configured and ready to build. You just need to install Java/Android Studio to generate the APK.

---

## Prerequisites

### Option 1: Android Studio (Recommended - Easiest)

1. **Download Android Studio**
   - Visit: https://developer.android.com/studio
   - Download for Windows
   - Install with default settings

2. **Open Project in Android Studio**
   ```bash
   cd d:/Working/meosjourney
   pnpm android:open
   ```
   Or manually open: `d:\Working\meosjourney\android-app\android`

3. **Build APK in Android Studio**
   - Menu: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Wait for build to complete
   - Click "locate" to find the APK file
   - APK location: `android-app/android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Command Line (Java JDK Required)

1. **Install Java JDK 17**
   - Download: https://adoptium.net/temurin/releases/?version=17
   - Choose: Windows x64 JDK .msi installer
   - Install and add to PATH

2. **Verify Java Installation**
   ```bash
   java -version
   # Should show: openjdk version "17.x.x"
   ```

3. **Build Debug APK**
   ```bash
   cd d:/Working/meosjourney/android-app/android
   ./gradlew assembleDebug
   ```

4. **Find APK**
   - Location: `android-app/android/app/build/outputs/apk/debug/app-debug.apk`
   - Size: ~10-20 MB

---

## Build Commands Reference

### Debug APK (No Signing Required)
```bash
cd d:/Working/meosjourney
pnpm build:android                    # Build web + sync
cd android-app/android
./gradlew assembleDebug               # Build debug APK
```

**Output:** `app/build/outputs/apk/debug/app-debug.apk`

### Release APK (Requires Keystore)

**Step 1: Generate Keystore** (One-time setup)
```bash
cd d:/Working/meosjourney/android-app
keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meosjourney-key
```

**Prompts:**
- Keystore password: [Choose strong password]
- Key password: [Same or different]
- First and last name: Meo's Journey
- Organization: Meosjourney
- City: [Your city]
- State: [Your state]
- Country: VN (or your country code)

**Step 2: Create keystore.properties**
```properties
# android-app/keystore.properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=meosjourney-key
storeFile=../keystore.jks
```

**Step 3: Update build.gradle**
Add signing config to `android-app/android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("../keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Step 4: Build Release APK**
```bash
cd d:/Working/meosjourney
pnpm build:android
cd android-app/android
./gradlew assembleRelease
```

**Output:** `app/build/outputs/apk/release/app-release.apk`

---

## Install APK on Android Device

### Method 1: USB Cable
1. Enable Developer Options on Android:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect phone to PC via USB
4. Install APK:
   ```bash
   cd d:/Working/meosjourney/android-app/android
   ./gradlew installDebug
   ```

### Method 2: File Transfer
1. Copy APK to phone (USB, Google Drive, etc.)
2. Open APK file on phone
3. Allow "Install from Unknown Sources" if prompted
4. Install

### Method 3: ADB (Android Debug Bridge)
```bash
adb install path/to/app-debug.apk
```

---

## Troubleshooting

### "JAVA_HOME is not set"
- Install Java JDK 17 from https://adoptium.net/
- Add to PATH or set JAVA_HOME environment variable

### "SDK location not found"
- Install Android Studio
- Or create `android-app/android/local.properties`:
  ```
  sdk.dir=C:\\Users\\ADMIN\\AppData\\Local\\Android\\Sdk
  ```

### "Build failed"
- Check Android Studio → Build → Clean Project
- Delete `android-app/android/app/build/` folder
- Rebuild

### APK won't install on phone
- Enable "Install from Unknown Sources"
- Check Android version (minimum API 22 / Android 5.1)

---

## Next Steps After Building APK

1. **Test on Android Device**
   - Install APK
   - Test all features (pet, user page, activities)
   - Check touch targets (buttons should be easy to tap)
   - Test background/foreground transitions

2. **Add Custom Icon** (Optional)
   - Create icon assets (see `android-app/resources/ICON-REQUIRED.md`)
   - Run: `npx capacitor-assets generate --android`
   - Rebuild APK

3. **Publish to Play Store** (Optional)
   - Build release APK with keystore
   - Create Play Console account ($25 one-time fee)
   - Upload APK or AAB bundle
   - Fill in store listing details

---

## Quick Start (Recommended Path)

1. **Install Android Studio** (easiest way)
2. **Open project:** `pnpm android:open`
3. **Build APK:** Build → Build APK(s)
4. **Install on phone:** Copy APK and install

That's it! Your Android app is ready to use.
