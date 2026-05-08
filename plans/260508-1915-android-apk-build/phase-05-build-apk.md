---
phase: 05
title: "APK Build & Signing"
status: pending
effort: 2h
---

# Phase 05: APK Build & Signing

## Context Links
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Gradle Build Configuration](https://developer.android.com/studio/build)
- [Capacitor Android Build](https://capacitorjs.com/docs/android#building-your-app)
- [Main Plan](./plan.md)
- [Phase 04](./phase-04-background.md)

## Overview

**Priority:** P1 (Critical - Deployment)  
**Current Status:** Pending  
**Description:** Generate production-ready signed APK for distribution, configure build variants, and set up release pipeline

## Key Insights

- **Debug vs Release:** Debug APK for testing, Release APK for distribution
- **App Signing:** Release APK must be signed with keystore
- **Keystore Security:** NEVER commit keystore to git
- **Build Variants:** Debug (unsigned), Release (signed), Bundle (for Play Store)
- **ProGuard/R8:** Code obfuscation and minification for release
- **APK Size:** Target under 50MB for easy distribution

## Requirements

### Functional Requirements
- Generate debug APK for testing
- Create keystore for release signing
- Generate signed release APK
- Configure ProGuard/R8 for code optimization
- Set up build scripts for automation

### Non-Functional Requirements
- APK size under 50MB
- Build time under 5 minutes
- Reproducible builds
- Secure keystore management
- Version management (versionCode, versionName)

## Architecture

### Build Variants
```
Debug Build
├── No signing required
├── Debuggable
├── No obfuscation
└── Output: app-debug.apk

Release Build
├── Signed with keystore
├── Not debuggable
├── ProGuard/R8 enabled
└── Output: app-release.apk

Bundle Build (for Play Store)
├── Signed with keystore
├── App Bundle format (.aab)
├── Optimized for Play Store
└── Output: app-release.aab
```

### Keystore Structure
```
keystore.jks (or .keystore)
├── Alias: meosjourney-key
├── Password: [secure password]
├── Validity: 25+ years
└── Algorithm: RSA 2048-bit
```

### Build Pipeline
```
1. npm run build (web assets)
   ↓
2. npm run android:copy (copy to www/)
   ↓
3. npm run android:sync (sync to Android)
   ↓
4. cd android-app/android
   ↓
5. ./gradlew assembleRelease (build APK)
   ↓
6. Sign APK with keystore
   ↓
7. Output: app-release.apk
```

## Related Code Files

### Files to Create
- `android-app/keystore.jks` - Signing keystore (DO NOT COMMIT)
- `android-app/keystore.properties` - Keystore config (DO NOT COMMIT)
- `android-app/android/app/proguard-rules.pro` - ProGuard rules
- `scripts/build-apk.js` - Automated build script

### Files to Modify
- `android-app/android/app/build.gradle` - Build configuration
- `android-app/.gitignore` - Ignore keystore files
- `package.json` (root) - Add build scripts

### Files to Read
- `android-app/android/build.gradle` - Project-level Gradle config
- `android-app/android/gradle.properties` - Gradle properties

## Implementation Steps

### Step 1: Generate Keystore
```bash
cd d:/Working/meosjourney/android-app

# Generate keystore (interactive prompts)
keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meosjourney-key
```

**Prompts:**
- **Keystore password:** [Choose strong password, save securely]
- **Key password:** [Same as keystore password or different]
- **First and last name:** Meo's Journey
- **Organizational unit:** Development
- **Organization:** Meosjourney
- **City/Locality:** [Your city]
- **State/Province:** [Your state]
- **Country code:** [Your country code, e.g., VN]

**CRITICAL:** Save keystore password in secure location (password manager, not in code)

### Step 2: Create Keystore Properties File
Create `android-app/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=meosjourney-key
storeFile=../keystore.jks
```

**CRITICAL:** Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with actual passwords

### Step 3: Update .gitignore
Add to `android-app/.gitignore`:
```
# Keystore files (NEVER COMMIT)
keystore.jks
keystore.properties
*.keystore
*.jks
key.properties

# Build outputs
android/app/build/
android/app/release/
*.apk
*.aab
```

### Step 4: Configure Build Signing in build.gradle
Modify `android-app/android/app/build.gradle`:
```gradle
apply plugin: 'com.android.application'

// Load keystore properties
def keystorePropertiesFile = rootProject.file("../keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace "com.meosjourney.app"
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    defaultConfig {
        applicationId "com.meosjourney.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
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
        debug {
            debuggable true
            minifyEnabled false
        }
        release {
            debuggable false
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            if (keystorePropertiesFile.exists()) {
                signingConfig signingConfigs.release
            }
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-android')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

### Step 5: Create ProGuard Rules
Create `android-app/android/app/proguard-rules.pro`:
```proguard
# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, jav.lang.String);
}

# JavaScript Interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

### Step 6: Update Version Numbers
Modify `android-app/android/app/build.gradle`:
```gradle
defaultConfig {
    applicationId "com.meosjourney.app"
    minSdkVersion 22
    targetSdkVersion 34
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // Semantic version
}
```

**Version Management:**
- `versionCode`: Integer, increment for each release (1, 2, 3, ...)
- `versionName`: String, semantic version (1.0.0, 1.0.1, 1.1.0, ...)

### Step 7: Add Build Scripts to package.json
Modify root `package.json`:
```json
{
  "scripts": {
    "build": "vite build --mode production",
    "build:android": "npm run build && npm run android:copy && npm run android:sync",
    "android:copy": "node scripts/copy-to-android.js",
    "android:sync": "cd android-app && npx cap sync android",
    "android:open": "cd android-app && npx cap open android",
    "android:build:debug": "cd android-app/android && ./gradlew assembleDebug",
    "android:build:release": "cd android-app/android && ./gradlew assembleRelease",
    "android:build:bundle": "cd android-app/android && ./gradlew bundleRelease",
    "android:clean": "cd android-app/android && ./gradlew clean",
    "android:full-build": "npm run build:android && npm run android:build:release"
  }
}
```

### Step 8: Create Automated Build Script
Create `scripts/build-apk.js`:
```javascript
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ANDROID_APP_DIR = path.join(ROOT_DIR, 'android-app');
const OUTPUT_DIR = path.join(ROOT_DIR, 'releases');

async function buildAPK() {
  console.log('🚀 Starting APK build process...\n');
  
  try {
    // Step 1: Build web app
    console.log('📦 Building web app...');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✓ Web app built\n');
    
    // Step 2: Copy to android-app/www
    console.log('📋 Copying to android-app/www...');
    execSync('npm run android:copy', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✓ Files copied\n');
    
    // Step 3: Sync with Capacitor
    console.log('🔄 Syncing with Capacitor...');
    execSync('npm run android:sync', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✓ Capacitor synced\n');
    
    // Step 4: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    execSync('npm run android:clean', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✓ Cleaned\n');
    
    // Step 5: Build release APK
    console.log('🔨 Building release APK...');
    execSync('npm run android:build:release', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✓ APK built\n');
    
    // Step 6: Copy APK to releases folder
    console.log('📤 Copying APK to releases folder...');
    await fs.ensureDir(OUTPUT_DIR);
    
    const apkSource = path.join(
      ANDROID_APP_DIR,
      'android/app/build/outputs/apk/release/app-release.apk'
    );
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const apkDest = path.join(OUTPUT_DIR, `meosjourney-${timestamp}.apk`);
    
    await fs.copy(apkSource, apkDest);
    console.log(`✓ APK copied to: ${apkDest}\n`);
    
    // Step 7: Get APK info
    const stats = await fs.stat(apkDest);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('✅ Build completed successfully!\n');
    console.log('📊 Build Info:');
    console.log(`   - APK Size: ${sizeMB} MB`);
    console.log(`   - Location: ${apkDest}`);
    console.log(`   - Timestamp: ${timestamp}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAPK();
```

### Step 9: Add Build Script to package.json
```json
{
  "scripts": {
    "android:full-build": "node scripts/build-apk.js"
  }
}
```

### Step 10: Build Debug APK (Test)
```bash
cd d:/Working/meosjourney
npm run build:android
npm run android:build:debug
```

**Verify:**
- APK created at `android-app/android/app/build/outputs/apk/debug/app-debug.apk`
- APK size reasonable (< 50MB)
- No build errors

### Step 11: Build Release APK
```bash
cd d:/Working/meosjourney
npm run android:full-build
```

**Expected Output:**
```
🚀 Starting APK build process...
📦 Building web app...
✓ Web app built
📋 Copying to android-app/www...
✓ Files copied
🔄 Syncing with Capacitor...
✓ Capacitor synced
🧹 Cleaning previous builds...
✓ Cleaned
🔨 Building release APK...
✓ APK built
📤 Copying APK to releases folder...
✓ APK copied to: d:/Working/meosjourney/releases/meosjourney-2026-05-08T19-15-00.apk
✅ Build completed successfully!
📊 Build Info:
   - APK Size: 12.34 MB
   - Location: d:/Working/meosjourney/releases/meosjourney-2026-05-08T19-15-00.apk
   - Timestamp: 2026-05-08T19-15-00
```

### Step 12: Verify APK Signature
```bash
# Check APK signature
jarsigner -verify -verbose -certs android-app/android/app/build/outputs/apk/release/app-release.apk

# Expected output: "jar verified"
```

### Step 13: Install APK on Device
```bash
# Via ADB (Android Debug Bridge)
adb install releases/meosjourney-2026-05-08T19-15-00.apk

# Or manually:
# 1. Copy APK to device
# 2. Enable "Install from unknown sources" in device settings
# 3. Open APK file on device
# 4. Tap "Install"
```

### Step 14: Test Release APK
**Test Checklist:**
- [ ] App installs successfully
- [ ] App icon displays correctly
- [ ] Splash screen shows
- [ ] All features work (pet, user, home pages)
- [ ] NocoDB API calls work
- [ ] Background behavior works
- [ ] No crashes or errors
- [ ] Performance is smooth

### Step 15: Document Build Process
Create `docs/android-deployment.md`:
```markdown
# Android APK Build & Deployment

## Prerequisites
- Android Studio installed
- Java JDK 17+
- Node.js 24+
- Keystore file (`android-app/keystore.jks`)
- Keystore properties (`android-app/keystore.properties`)

## Build Commands

### Debug Build (for testing)
```bash
npm run build:android
npm run android:build:debug
```
Output: `android-app/android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for distribution)
```bash
npm run android:full-build
```
Output: `releases/meosjourney-[timestamp].apk`

### App Bundle (for Play Store)
```bash
npm run build:android
npm run android:build:bundle
```
Output: `android-app/android/app/build/outputs/bundle/release/app-release.aab`

## Version Management

Update version in `android-app/android/app/build.gradle`:
```gradle
versionCode 1        // Increment for each release
versionName "1.0.0"  // Semantic version
```

## Keystore Management

**CRITICAL:** Never commit keystore files to git!

### Backup Keystore
```bash
cp android-app/keystore.jks ~/secure-backup/meosjourney-keystore-backup.jks
```

### Keystore Info
```bash
keytool -list -v -keystore android-app/keystore.jks
```

## Distribution

### Manual Distribution
1. Build release APK
2. Upload to file hosting (Google Drive, Dropbox, etc.)
3. Share download link
4. Users enable "Install from unknown sources"
5. Users download and install APK

### Google Play Store
1. Build app bundle (`.aab`)
2. Create Play Console account
3. Upload bundle to Play Console
4. Fill in store listing details
5. Submit for review

## Troubleshooting

### Build Fails: "Keystore not found"
- Ensure `keystore.jks` exists in `android-app/`
- Check `keystore.properties` has correct path

### Build Fails: "Wrong password"
- Verify passwords in `keystore.properties`
- Try regenerating keystore

### APK Too Large
- Check web bundle size (`dist/` folder)
- Enable ProGuard/R8 (already configured)
- Remove unused assets

### APK Won't Install
- Check device Android version (min API 22)
- Enable "Install from unknown sources"
- Uninstall previous version first
```

## Todo List

- [ ] Generate keystore with `keytool`
- [ ] Create `keystore.properties` file
- [ ] Update `.gitignore` to exclude keystore
- [ ] Configure signing in `build.gradle`
- [ ] Create ProGuard rules
- [ ] Update version numbers
- [ ] Add build scripts to `package.json`
- [ ] Create automated build script (`build-apk.js`)
- [ ] Build debug APK (test)
- [ ] Build release APK
- [ ] Verify APK signature
- [ ] Install APK on device
- [ ] Test release APK (full checklist)
- [ ] Document build process
- [ ] Backup keystore securely

## Success Criteria

- [ ] Release APK builds without errors
- [ ] APK is signed with keystore
- [ ] APK size under 50MB
- [ ] APK installs on Android device
- [ ] All features work in release APK
- [ ] Build process documented
- [ ] Keystore backed up securely
- [ ] Version numbers configured correctly

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Keystore lost/corrupted | Medium | Critical | Backup keystore in multiple secure locations |
| Build fails on CI/CD | Medium | High | Test build locally first, document dependencies |
| APK too large | Low | Medium | Monitor bundle size, optimize assets |
| Signing fails | Low | High | Test signing early, verify keystore properties |

## Security Considerations

- **NEVER commit keystore files to git**
- Store keystore password in secure password manager
- Backup keystore in encrypted storage
- Use strong keystore password (16+ characters)
- Restrict keystore file permissions (read-only)
- Consider using Play App Signing for Play Store releases

## Next Steps

After completing this phase:
1. Proceed to [phase-06-testing.md](./phase-06-testing.md)
2. Distribute APK to beta testers
3. Collect feedback and iterate
