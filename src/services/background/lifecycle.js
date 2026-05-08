/**
 * App Lifecycle Management for Android
 * Handles app state changes (background/foreground)
 */

import { App } from '@capacitor/app';

let lastActiveTime = Date.now();
let isAppActive = true;
let resumeCallbacks = [];

/**
 * Initialize lifecycle listeners
 * @param {Function} onResume - Callback when app resumes from background
 */
export const initLifecycle = (onResume) => {
  if (onResume) {
    resumeCallbacks.push(onResume);
  }

  // Listen for app state changes
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // App went to background
      handleAppBackground();
    } else {
      // App came to foreground
      handleAppResume();
    }
  });

  // Listen for app URL open (deep links)
  App.addListener('appUrlOpen', (data) => {
    console.log('App opened with URL:', data.url);
  });

  // Save state when app is about to terminate
  window.addEventListener('beforeunload', () => {
    saveAppState();
  });
};

/**
 * Handle app going to background
 */
const handleAppBackground = () => {
  console.log('App going to background');
  lastActiveTime = Date.now();
  isAppActive = false;

  // Save current timestamp
  localStorage.setItem('lastActiveTime', lastActiveTime.toString());
  localStorage.setItem('appState', 'background');
};

/**
 * Handle app resuming from background
 */
const handleAppResume = () => {
  console.log('App resuming from background');
  const now = Date.now();
  const previousActiveTime = parseInt(localStorage.getItem('lastActiveTime') || now);
  const elapsedMs = now - previousActiveTime;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  isAppActive = true;
  lastActiveTime = now;

  localStorage.setItem('lastActiveTime', now.toString());
  localStorage.setItem('appState', 'active');

  console.log(`App was in background for ${elapsedMinutes} minutes`);

  // Notify all registered callbacks
  resumeCallbacks.forEach(callback => {
    try {
      callback(elapsedMinutes, previousActiveTime, now);
    } catch (error) {
      console.error('Error in resume callback:', error);
    }
  });
};

/**
 * Save app state to localStorage
 */
const saveAppState = () => {
  localStorage.setItem('lastActiveTime', Date.now().toString());
  localStorage.setItem('appState', 'terminated');
};

/**
 * Get elapsed time since last active
 * @returns {number} Minutes elapsed
 */
export const getElapsedMinutes = () => {
  const now = Date.now();
  const lastTime = parseInt(localStorage.getItem('lastActiveTime') || now);
  return Math.floor((now - lastTime) / 60000);
};

/**
 * Check if app is currently active
 * @returns {boolean}
 */
export const getIsAppActive = () => {
  return isAppActive;
};

/**
 * Register a callback for app resume
 * @param {Function} callback
 */
export const onAppResume = (callback) => {
  resumeCallbacks.push(callback);
};

/**
 * Remove a resume callback
 * @param {Function} callback
 */
export const offAppResume = (callback) => {
  resumeCallbacks = resumeCallbacks.filter(cb => cb !== callback);
};
