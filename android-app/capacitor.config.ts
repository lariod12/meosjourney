import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meosjourney.app',
  appName: "Meo's Journey",
  webDir: 'www',
  server: {
    androidScheme: 'https',
    // For development, uncomment to point to local server:
    // url: 'http://10.0.2.2:5555',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Will be set in Phase 05
      keystoreAlias: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
