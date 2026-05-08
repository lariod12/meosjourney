---
phase: 04
title: "Background Service Configuration"
status: pending
effort: 2h
---

# Phase 04: Background Service Configuration

## Context Links
- [Android Background Execution Limits](https://developer.android.com/about/versions/oreo/background)
- [Capacitor Background Task Plugin](https://capacitorjs.com/docs/apis/background-task)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [Main Plan](./plan.md)
- [Phase 03](./phase-03-icons-splash.md)

## Overview

**Priority:** P2 (Important - Performance)  
**Current Status:** Pending  
**Description:** Configure app to run efficiently in background, handle biological clock updates, and respect Android battery optimization

## Key Insights

- **Android Background Limits:** Apps can't run indefinitely in background (API 26+)
- **Biological Clock System:** Pet needs meal/sleep state updates even when app closed
- **Battery Optimization:** Must respect Doze mode and App Standby
- **WorkManager:** Recommended for periodic background tasks
- **Capacitor Background Task:** Allows short-lived background work (3 minutes max)
- **Push Notifications:** Alternative for time-sensitive updates (meal time, bedtime)

## Requirements

### Functional Requirements
- Update pet biological clock when app returns to foreground
- Handle meal time notifications (8:00, 11:00, 18:00)
- Handle bedtime notifications (22:00-05:00)
- Sync status with NocoDB when network available
- Graceful degradation if background tasks restricted

### Non-Functional Requirements
- Battery drain under 5% per day when app in background
- Background tasks complete within 3 minutes
- Respect Android Doze mode and App Standby
- No persistent foreground service (avoid notification)
- Offline-first: cache data, sync when online

## Architecture

### Background Task Strategy

**Option 1: Foreground State Updates (Recommended)**
- Update biological clock when app resumes from background
- Calculate elapsed time since last update
- Apply state changes (hunger, sleep penalties)
- No persistent background service needed

**Option 2: WorkManager Periodic Tasks**
- Schedule periodic work (15-minute minimum interval)
- Update pet state in background
- Sync with NocoDB
- More battery intensive

**Option 3: Push Notifications**
- Server sends notifications at meal/bedtime
- App updates state when notification received
- Requires backend notification service

**Decision: Use Option 1 (Foreground Updates) + Option 3 (Notifications)**
- Simplest implementation
- Lowest battery impact
- Meets requirements without persistent background service

### App Lifecycle Hooks
```
App Launch → Initialize state
  ↓
App Active → Normal operation
  ↓
App Background → Save state, timestamp
  ↓
App Resume → Calculate elapsed time, update state
  ↓
App Terminated → State persisted in localStorage
```

### Biological Clock Update Logic
```javascript
// When app resumes
const lastUpdateTime = localStorage.getItem('lastUpdateTime');
const now = Date.now();
const elapsedMinutes = (now - lastUpdateTime) / 60000;

// Check if meal time passed
if (isMealTimePassed(lastUpdateTime, now)) {
  applyHungerPenalty();
}

// Check if bedtime passed
if (isBedtimePassed(lastUpdateTime, now)) {
  applySleepPenalty();
}

// Update timestamp
localStorage.setItem('lastUpdateTime', now);
```

## Related Code Files

### Files to Create
- `src/services/background/lifecycle.js` - App lifecycle management
- `src/services/background/biological-clock.js` - Background clock updates
- `src/services/background/notifications.js` - Notification scheduling
- `src/utils/time-calculations.js` - Time-based logic

### Files to Modify
- `src/main.jsx` - Initialize lifecycle listeners
- `src/features/pet/components/PetPage.jsx` - Update on resume
- `android-app/capacitor.config.ts` - Background task config
- `android-app/android/app/src/main/AndroidManifest.xml` - Permissions

### Capacitor Plugins to Install
- `@capacitor/app` - App lifecycle events
- `@capacitor/local-notifications` - Meal/bedtime reminders (optional)
- `@capacitor/background-task` - Short background work (optional)

## Implementation Steps

### Step 1: Install Capacitor App Plugin
```bash
cd d:/Working/meosjourney/android-app
npm install @capacitor/app
```

### Step 2: Create Lifecycle Service
Create `src/services/background/lifecycle.js`:
```javascript
import { App } from '@capacitor/app';

let lastActiveTime = Date.now();
let isAppActive = true;

// Initialize lifecycle listeners
export const initLifecycle = (onResume) => {
  // Save timestamp when app goes to background
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // App went to background
      lastActiveTime = Date.now();
      isAppActive = false;
      localStorage.setItem('lastActiveTime', lastActiveTime.toString());
      console.log('[Lifecycle] App backgrounded at', new Date(lastActiveTime));
    } else {
      // App resumed to foreground
      isAppActive = true;
      const now = Date.now();
      const elapsedMs = now - lastActiveTime;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      
      console.log('[Lifecycle] App resumed after', elapsedMinutes, 'minutes');
      
      // Trigger resume callback
      if (onResume) {
        onResume(lastActiveTime, now, elapsedMinutes);
      }
      
      lastActiveTime = now;
      localStorage.setItem('lastActiveTime', now.toString());
    }
  });
  
  // Handle app URL open (deep links)
  App.addListener('appUrlOpen', (data) => {
    console.log('[Lifecycle] App opened via URL:', data.url);
  });
  
  // Restore last active time from storage
  const stored = localStorage.getItem('lastActiveTime');
  if (stored) {
    lastActiveTime = parseInt(stored, 10);
  }
};

// Get elapsed time since last active
export const getElapsedTime = () => {
  const now = Date.now();
  return {
    lastActiveTime,
    now,
    elapsedMs: now - lastActiveTime,
    elapsedMinutes: Math.floor((now - lastActiveTime) / 60000)
  };
};

// Check if app is currently active
export const getIsAppActive = () => isAppActive;
```

### Step 3: Create Biological Clock Background Service
Create `src/services/background/biological-clock.js`:
```javascript
// Check if meal time was missed during background
export const checkMissedMealTimes = (lastActiveTime, currentTime) => {
  const missedMeals = [];
  const lastDate = new Date(lastActiveTime);
  const currentDate = new Date(currentTime);
  
  // If same day, check if meal times passed
  if (lastDate.toDateString() === currentDate.toDateString()) {
    const lastHour = lastDate.getHours();
    const currentHour = currentDate.getHours();
    
    // Breakfast (8:00)
    if (lastHour < 8 && currentHour >= 8) {
      missedMeals.push({ type: 'breakfast', time: 8 });
    }
    
    // Lunch (11:00)
    if (lastHour < 11 && currentHour >= 11) {
      missedMeals.push({ type: 'lunch', time: 11 });
    }
    
    // Dinner (18:00)
    if (lastHour < 18 && currentHour >= 18) {
      missedMeals.push({ type: 'dinner', time: 18 });
    }
  } else {
    // Different day - all meals missed
    missedMeals.push(
      { type: 'breakfast', time: 8 },
      { type: 'lunch', time: 11 },
      { type: 'dinner', time: 18 }
    );
  }
  
  return missedMeals;
};

// Check if bedtime was missed
export const checkMissedBedtime = (lastActiveTime, currentTime) => {
  const lastDate = new Date(lastActiveTime);
  const currentDate = new Date(currentTime);
  const lastHour = lastDate.getHours();
  const currentHour = currentDate.getHours();
  
  // Bedtime is 22:00-05:00
  const wasBedtime = lastHour >= 22 || lastHour < 5;
  const isBedtime = currentHour >= 22 || currentHour < 5;
  
  // If transitioned through bedtime period
  if (!wasBedtime && isBedtime) {
    return true;
  }
  
  // If different day and current time is after bedtime
  if (lastDate.toDateString() !== currentDate.toDateString()) {
    return true;
  }
  
  return false;
};

// Calculate hunger penalty based on missed meals
export const calculateHungerPenalty = (missedMeals) => {
  // Each missed meal reduces happiness/health
  const penaltyPerMeal = 10; // Adjust based on game balance
  return missedMeals.length * penaltyPerMeal;
};

// Calculate sleep penalty based on missed bedtime
export const calculateSleepPenalty = (missedBedtime) => {
  if (!missedBedtime) return 0;
  return 15; // Adjust based on game balance
};

// Apply penalties to pet status
export const applyBackgroundPenalties = async (lastActiveTime, currentTime, savePetFn) => {
  const missedMeals = checkMissedMealTimes(lastActiveTime, currentTime);
  const missedBedtime = checkMissedBedtime(lastActiveTime, currentTime);
  
  if (missedMeals.length === 0 && !missedBedtime) {
    console.log('[BioClock] No penalties to apply');
    return { applied: false };
  }
  
  const hungerPenalty = calculateHungerPenalty(missedMeals);
  const sleepPenalty = calculateSleepPenalty(missedBedtime);
  
  console.log('[BioClock] Applying penalties:', {
    missedMeals: missedMeals.length,
    hungerPenalty,
    sleepPenalty
  });
  
  // Update pet status (integrate with existing pet service)
  // This is a placeholder - actual implementation depends on pet data structure
  try {
    await savePetFn({
      hungerPenalty,
      sleepPenalty,
      lastUpdateTime: currentTime
    });
    
    return {
      applied: true,
      missedMeals,
      missedBedtime,
      hungerPenalty,
      sleepPenalty
    };
  } catch (error) {
    console.error('[BioClock] Failed to apply penalties:', error);
    return { applied: false, error };
  }
};
```

### Step 4: Create Time Calculation Utilities
Create `src/utils/time-calculations.js`:
```javascript
// Get current time period (dawn, morning, noon, etc.)
export const getTimePeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 21) return 'evening';
  if (hour >= 21 && hour < 23) return 'night';
  return 'midnight';
};

// Check if current time is meal time
export const isMealTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  if (hour === 8 && minute === 0) return 'breakfast';
  if (hour === 11 && minute === 0) return 'lunch';
  if (hour === 18 && minute === 0) return 'dinner';
  return null;
};

// Check if current time is bedtime
export const isBedtime = () => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
};

// Format elapsed time for display
export const formatElapsedTime = (elapsedMinutes) => {
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minutes`;
  }
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return `${hours}h ${minutes}m`;
};
```

### Step 5: Initialize Lifecycle in main.jsx
Modify `src/main.jsx`:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPlatformClass } from './utils/platform';
import { initLifecycle } from './services/background/lifecycle';
import { applyBackgroundPenalties } from './services/background/biological-clock';
import { savePet } from './services';

// Initialize platform detection
initPlatformClass();

// Initialize lifecycle listeners
initLifecycle(async (lastActiveTime, currentTime, elapsedMinutes) => {
  console.log('[Main] App resumed, checking for background updates');
  
  // Apply biological clock penalties
  const result = await applyBackgroundPenalties(
    lastActiveTime,
    currentTime,
    savePet
  );
  
  if (result.applied) {
    console.log('[Main] Background penalties applied:', result);
    // Optionally show notification to user
    // "Your pet missed meals while you were away!"
  }
});

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Step 6: Update PetPage to Refresh on Resume
Modify `src/features/pet/components/PetPage.jsx`:
```javascript
import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { getElapsedTime } from '../../../services/background/lifecycle';

const PetPage = () => {
  const [petData, setPetData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Fetch pet data
  const loadPetData = async () => {
    const data = await fetchPet();
    setPetData(data);
    setLastUpdate(Date.now());
  };
  
  useEffect(() => {
    loadPetData();
    
    // Listen for app resume events
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App resumed - refresh pet data
        console.log('[PetPage] App resumed, refreshing data');
        loadPetData();
      }
    });
    
    return () => {
      listener.remove();
    };
  }, []);
  
  // ... rest of component
};
```

### Step 7: Configure Background Task in capacitor.config.ts
```typescript
// android-app/capacitor.config.ts
const config: CapacitorConfig = {
  // ... existing config
  plugins: {
    // ... existing plugins
    BackgroundTask: {
      // Allow short background tasks (3 minutes max)
      enabled: true
    }
  }
};
```

### Step 8: Add Permissions to AndroidManifest.xml
Modify `android-app/android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Existing permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Background task permissions -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <application>
        <!-- ... existing config -->
    </application>
</manifest>
```

### Step 9: Test Background Behavior
```bash
cd d:/Working/meosjourney
npm run build:android
npm run android:open
```

**Test Scenarios:**
1. **Short Background (< 5 minutes):**
   - Open app, note current time
   - Press home button (app to background)
   - Wait 5 minutes
   - Reopen app
   - Verify: No penalties applied (too short)

2. **Missed Meal Time:**
   - Open app at 7:50 AM
   - Background app
   - Wait until 8:10 AM
   - Reopen app
   - Verify: Breakfast missed, hunger penalty applied

3. **Missed Bedtime:**
   - Open app at 21:50 (9:50 PM)
   - Background app
   - Wait until 22:10 (10:10 PM)
   - Reopen app
   - Verify: Bedtime missed, sleep penalty applied

4. **Multi-Day Background:**
   - Open app, note date/time
   - Background app
   - Change device date to next day
   - Reopen app
   - Verify: All meals missed, penalties applied

### Step 10: Optimize Battery Usage
Add to `android-app/android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:requestLegacyExternalStorage="true"
    android:usesCleartextTraffic="false"
    android:hardwareAccelerated="true"
    android:largeHeap="false">
    <!-- Disable unnecessary features for battery optimization -->
</application>
```

### Step 11: Document Background Behavior
Create `plans/260508-1915-android-apk-build/reports/background-behavior.md`:
```markdown
# Background Behavior Documentation

## Strategy
Foreground state updates - no persistent background service

## How It Works
1. App saves timestamp when backgrounded
2. On resume, calculates elapsed time
3. Checks if meal times or bedtime passed
4. Applies penalties to pet status
5. Updates UI with new state

## Penalties
- **Missed Meal:** -10 happiness/health per meal
- **Missed Bedtime:** -15 energy

## Battery Impact
- No persistent background service
- No periodic wake-ups
- Updates only when app resumed
- Estimated battery drain: < 1% per day

## Limitations
- No real-time updates when app closed
- Penalties applied retroactively on resume
- Requires user to open app to see updates

## Future Enhancements
- Push notifications for meal/bedtime reminders
- WorkManager for periodic sync (optional)
- Server-side state management
```

## Todo List

- [ ] Install `@capacitor/app` plugin
- [ ] Create lifecycle service (`lifecycle.js`)
- [ ] Create biological clock service (`biological-clock.js`)
- [ ] Create time calculation utilities (`time-calculations.js`)
- [ ] Initialize lifecycle in `main.jsx`
- [ ] Update `PetPage.jsx` to refresh on resume
- [ ] Configure background task in `capacitor.config.ts`
- [ ] Add permissions to `AndroidManifest.xml`
- [ ] Test short background scenario (< 5 min)
- [ ] Test missed meal time scenario
- [ ] Test missed bedtime scenario
- [ ] Test multi-day background scenario
- [ ] Optimize battery usage settings
- [ ] Document background behavior

## Success Criteria

- [ ] App resumes correctly from background
- [ ] Elapsed time calculated accurately
- [ ] Missed meal times detected correctly
- [ ] Missed bedtime detected correctly
- [ ] Penalties applied to pet status
- [ ] UI refreshes with updated state
- [ ] Battery drain under 5% per day
- [ ] No crashes when resuming from background
- [ ] Background behavior documented

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Android kills app in background | High | Medium | Save state to localStorage, restore on launch |
| Battery drain too high | Low | High | Use foreground updates only, no persistent service |
| Penalties too harsh/lenient | Medium | Low | Adjust penalty values based on testing |
| Time calculations incorrect | Low | High | Thorough testing of edge cases (midnight, DST) |

## Security Considerations

- No sensitive data in background tasks
- Respect Android battery optimization settings
- No network requests in background (sync on foreground only)

## Next Steps

After completing this phase:
1. Proceed to [phase-05-build-apk.md](./phase-05-build-apk.md)
2. Monitor battery usage in real-world testing
3. Adjust penalty values based on user feedback
