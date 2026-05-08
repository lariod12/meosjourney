/**
 * Platform detection utilities for Capacitor Android app
 */

export const isAndroid = () => {
  return window.Capacitor?.getPlatform() === 'android';
};

export const isMobile = () => {
  return window.matchMedia('(max-width: 768px)').matches;
};

export const isCapacitor = () => {
  return window.Capacitor !== undefined;
};

/**
 * Add platform-specific classes to body for CSS targeting
 * Call this once on app initialization
 */
export const initPlatformClass = () => {
  if (isAndroid()) {
    document.body.classList.add('capacitor-android');
  }
  if (isMobile()) {
    document.body.classList.add('mobile');
  }
  if (isCapacitor()) {
    document.body.classList.add('capacitor');
  }
};
