# Build APK Without Android Studio

## Prerequisites

### 1. Install Java JDK 17

**Download:**
- Visit: https://adoptium.net/temurin/releases/?version=17
- Choose: Windows x64 JDK .msi installer
- Download and install

**Set JAVA_HOME:**
1. Open System Properties → Environment Variables
2. Add new System Variable:
   - Name: `JAVA_HOME`
   - Value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
3. Add to PATH:
   - Edit PATH variable
   - Add: `%JAVA_HOME%\bin`

**Verify:**
```bash
java -version
# Should show: openjdk version "17.x.x"
```

### 2. Install Android SDK Command Line Tools

**Download:**
- Visit: https://developer.android.com/studio#command-line-tools-only
- Download: "Command line tools only" for Windows
- Extract to: `C:\Android\cmdline-tools\latest\`

**Set ANDROID_HOME:**
1. Open System Properties → Environment Variables
2. Add new System Variable:
   - Name: `ANDROID_HOME`
   - Value: `C:\Android`
3. Add to PATH:
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `%ANDROID_HOME%\platform-tools`

**Install SDK Components:**
```bash
cd C:\Android\cmdline-tools\latest\bin

# Accept licenses
sdkmanager --licenses

# Install required components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### 3. Configure Android SDK Location

Create file: `android-app/android/local.properties`
```properties
sdk.dir=C:\\Android
```

---

## Build APK

### Debug APK (No Signing)
```bash
cd d:/Working/meosjourney
pnpm build:android
cd android-app/android
./gradlew assembleDebug
```

**Output:** `app/build/outputs/apk/debug/app-debug.apk`

### Release APK (With Signing)

**Step 1: Generate Keystore**
```bash
cd d:/Working/meosjourney/android-app
keytool -genkey -v -keystore keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meosjourney-key
```

**Step 2: Create keystore.properties**
```properties
# android-app/keystore.properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=meosjourney-key
storeFile=../keystore.jks
```

**Step 3: Update build.gradle**

Edit `android-app/android/app/build.gradle`, add before `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("../keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android {`, add:
```gradle
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

## Troubleshooting

### "JAVA_HOME is not set"
- Install Java JDK 17
- Set JAVA_HOME environment variable
- Restart terminal

### "SDK location not found"
- Create `android-app/android/local.properties`
- Set `sdk.dir=C:\\Android`

### "License not accepted"
- Run: `sdkmanager --licenses`
- Type 'y' for all prompts

### Gradle build fails
- Delete `android-app/android/.gradle/` folder
- Delete `android-app/android/app/build/` folder
- Run build again

---

## Summary

**Without Android Studio, you need:**
1. Java JDK 17 (~200 MB)
2. Android SDK Command Line Tools (~500 MB)
3. Configure environment variables
4. Run Gradle commands

**With Android Studio:**
1. Install Android Studio (~3 GB)
2. Click "Build APK"
3. Done

**Recommendation:** Install Android Studio - it's much easier and handles everything automatically.
