---
phase: 06
title: "Testing & Validation"
status: pending
effort: 2h
---

# Phase 06: Testing & Validation

## Context Links
- [Android Testing Guide](https://developer.android.com/training/testing)
- [Capacitor Testing](https://capacitorjs.com/docs/guides/automated-configuration)
- [Main Plan](./plan.md)
- [Phase 05](./phase-05-build-apk.md)

## Overview

**Priority:** P1 (Critical - Quality assurance)  
**Current Status:** Pending  
**Description:** Comprehensive testing of Android APK across devices, screen sizes, and use cases to ensure production readiness

## Key Insights

- **Device Fragmentation:** Test on multiple Android versions and screen sizes
- **Touch Interaction:** Mouse testing ≠ touch testing
- **Network Conditions:** Test offline, slow network, API failures
- **Battery Impact:** Monitor battery drain during extended use
- **Memory Usage:** Check for memory leaks and excessive RAM usage
- **Edge Cases:** Background/foreground transitions, low storage, permissions

## Requirements

### Functional Requirements
- All web features work identically on Android
- Touch targets meet 48dp minimum guideline
- Background state updates work correctly
- NocoDB API integration functions properly
- Offline mode handles gracefully
- App icon and splash screen display correctly

### Non-Functional Requirements
- No crashes or ANR (Application Not Responding) errors
- Smooth 60fps UI performance
- Battery drain under 5% per day (background)
- Memory usage under 200MB
- APK size under 50MB
- Load time under 3 seconds

## Architecture

### Testing Matrix

| Test Category | Test Cases | Priority |
|---------------|------------|----------|
| **Functional** | All features work | P1 |
| **UI/UX** | Touch targets, responsiveness | P1 |
| **Performance** | Load time, FPS, memory | P1 |
| **Background** | State updates, penalties | P1 |
| **Network** | API calls, offline mode | P1 |
| **Compatibility** | Multiple devices/versions | P2 |
| **Battery** | Background drain | P2 |
| **Edge Cases** | Low storage, permissions | P2 |

### Test Devices

**Minimum Coverage:**
- **Emulator:** Pixel 5, API 34 (Android 14)
- **Physical Device:** Any Android 5.1+ device (API 22+)

**Ideal Coverage:**
- Small screen: 480x800 (API 22)
- Medium screen: 720x1280 (API 26)
- Large screen: 1080x1920 (API 34)
- Tablet: 1200x1920 (API 34)

### Test Environments

1. **Development:** Debug APK on emulator
2. **Staging:** Release APK on emulator
3. **Production:** Release APK on physical device

## Related Code Files

### Files to Create
- `plans/260508-1915-android-apk-build/reports/test-results.md` - Test results
- `plans/260508-1915-android-apk-build/reports/device-compatibility.md` - Device matrix
- `plans/260508-1915-android-apk-build/reports/performance-metrics.md` - Performance data
- `plans/260508-1915-android-apk-build/reports/bug-tracker.md` - Issues found

### Files to Reference
- All phase files (01-05) for feature verification
- `phase-02-ui-optimization.md` - Touch target checklist
- `phase-04-background.md` - Background behavior tests

## Implementation Steps

### Step 1: Create Test Results Template
Create `plans/260508-1915-android-apk-build/reports/test-results.md`:
```markdown
# Android APK Test Results

## Test Session Info
- **Date:** [Date]
- **Tester:** [Name]
- **APK Version:** [versionName]
- **Device:** [Device model]
- **Android Version:** [API level]
- **Screen Size:** [Resolution]

## Functional Tests

### Pet Page
- [ ] Pet displays correctly
- [ ] Activity cards load
- [ ] Add activity modal opens
- [ ] Icon picker works
- [ ] Set current activity works
- [ ] Activity updates on home page
- [ ] Food tab works
- [ ] Care tab works
- [ ] Activity tab works
- [ ] Moods tab works
- [ ] Status tab works

### User Page
- [ ] Profile loads
- [ ] Edit profile works
- [ ] Status updates work
- [ ] Journal entries work
- [ ] Photo album works
- [ ] Gallery uploads work
- [ ] Quest submission works
- [ ] Achievement submission works
- [ ] Review tab works

### Home Page
- [ ] Character sheet displays
- [ ] Current activity shows
- [ ] XP/level displays
- [ ] Recent journals show
- [ ] Quest progress shows
- [ ] Achievement progress shows

### Navigation
- [ ] Header navigation works
- [ ] Tab navigation works
- [ ] Back button works
- [ ] Deep links work (if applicable)

## UI/UX Tests

### Touch Targets
- [ ] All buttons ≥ 48px height
- [ ] Icon buttons ≥ 48x48px
- [ ] Modal close buttons easy to tap
- [ ] Form inputs ≥ 44px height
- [ ] Spacing between elements ≥ 8px

### Responsiveness
- [ ] Layout adapts to screen size
- [ ] No horizontal scrolling
- [ ] Text readable without zoom
- [ ] Images scale correctly
- [ ] Modals fit on screen

### Visual Design
- [ ] Black/white design system preserved
- [ ] Playfair Display font loads
- [ ] Borders and shadows render correctly
- [ ] Icons render correctly
- [ ] No visual glitches

## Performance Tests

### Load Time
- [ ] App launches in < 3 seconds
- [ ] Splash screen shows for 2 seconds
- [ ] Initial data loads in < 5 seconds

### UI Performance
- [ ] Scrolling is smooth (60fps)
- [ ] Animations are smooth
- [ ] No lag when typing
- [ ] No lag when opening modals

### Memory Usage
- [ ] Initial memory: [X] MB
- [ ] After 10 minutes: [X] MB
- [ ] After 1 hour: [X] MB
- [ ] Memory leaks: [Yes/No]

## Background Tests

### Short Background (< 5 min)
- [ ] App resumes correctly
- [ ] No penalties applied
- [ ] Data refreshes

### Missed Meal Time
- [ ] Breakfast missed detected
- [ ] Lunch missed detected
- [ ] Dinner missed detected
- [ ] Hunger penalty applied

### Missed Bedtime
- [ ] Bedtime missed detected
- [ ] Sleep penalty applied

### Multi-Day Background
- [ ] All meals missed detected
- [ ] Penalties applied correctly
- [ ] State restored correctly

## Network Tests

### Online Mode
- [ ] API calls succeed
- [ ] Data saves to NocoDB
- [ ] Data loads from NocoDB
- [ ] Images upload correctly

### Offline Mode
- [ ] App loads without network
- [ ] Cached data displays
- [ ] Graceful error messages
- [ ] Sync when network restored

### Slow Network
- [ ] Loading indicators show
- [ ] Requests timeout gracefully
- [ ] No infinite loading states

### API Failures
- [ ] 404 errors handled
- [ ] 500 errors handled
- [ ] Network errors handled
- [ ] User-friendly error messages

## Battery Tests

### Background Drain
- [ ] Battery at start: [X]%
- [ ] Battery after 24h: [X]%
- [ ] Drain rate: [X]% per day
- [ ] Target: < 5% per day

### Active Usage
- [ ] Battery at start: [X]%
- [ ] Battery after 1h: [X]%
- [ ] Drain rate: [X]% per hour

## Edge Case Tests

### Low Storage
- [ ] App installs with low storage
- [ ] App runs with low storage
- [ ] Graceful error if storage full

### Permissions
- [ ] Internet permission works
- [ ] Network state permission works
- [ ] No unnecessary permissions requested

### App Lifecycle
- [ ] App survives orientation change
- [ ] App survives low memory kill
- [ ] App survives force stop

### System Integration
- [ ] App appears in recent apps
- [ ] App icon in launcher
- [ ] App name correct
- [ ] Uninstall works

## Issues Found

| ID | Severity | Description | Steps to Reproduce | Status |
|----|----------|-------------|-------------------|--------|
| 1  | High     | [Description] | [Steps] | Open |
| 2  | Medium   | [Description] | [Steps] | Fixed |

## Summary

**Pass Rate:** [X]% ([Y] passed / [Z] total)

**Critical Issues:** [Count]  
**High Issues:** [Count]  
**Medium Issues:** [Count]  
**Low Issues:** [Count]

**Recommendation:** [Pass / Fail / Pass with issues]

**Notes:**
[Additional observations]
```

### Step 2: Set Up Test Environment
```bash
# Start Android emulator
cd d:/Working/meosjourney
npm run android:open

# In Android Studio:
# Tools > AVD Manager > Create Virtual Device
# Select: Pixel 5, API 34 (Android 14)
# Start emulator
```

### Step 3: Install Debug APK on Emulator
```bash
# Build debug APK
npm run build:android
npm run android:build:debug

# Install on emulator
adb install android-app/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Run Functional Tests
**Test each feature systematically:**

1. **Pet Page:**
   - Open app, navigate to Pet page
   - Test all tabs (Food, Care, Activity, Moods, Status)
   - Add new activity with icon picker
   - Set activity as current
   - Verify current activity shows on home page

2. **User Page:**
   - Navigate to User page
   - Edit profile fields
   - Add journal entry
   - Upload photo to gallery
   - Submit quest
   - Submit achievement
   - Check review tab

3. **Home Page:**
   - Verify character sheet displays
   - Check current activity indicator
   - Verify XP/level
   - Check recent journals
   - Check quest/achievement progress

### Step 5: Run UI/UX Tests
**Touch Target Audit:**
```bash
# Enable "Show taps" in Developer Options
# Settings > Developer Options > Show taps

# Test each interactive element:
# - Tap with finger (not mouse)
# - Verify visual feedback
# - Verify action completes
```

**Responsiveness Test:**
```bash
# Test on different screen sizes
# Emulator: Tools > AVD Manager > Edit > Change resolution
# Test: 480x800, 720x1280, 1080x1920
```

### Step 6: Run Performance Tests
**Load Time:**
```bash
# Close app completely
# Open app
# Measure time from tap to interactive
# Target: < 3 seconds
```

**Memory Usage:**
```bash
# In Android Studio:
# View > Tool Windows > Profiler
# Select app process
# Monitor memory over time
# Target: < 200MB, no leaks
```

**UI Performance:**
```bash
# Enable GPU rendering profile
# Settings > Developer Options > Profile GPU Rendering > On screen as bars
# Green bars = good (< 16ms per frame)
# Red bars = bad (> 16ms per frame)
```

### Step 7: Run Background Tests
**Test Script:**
```javascript
// Test 1: Short background (< 5 min)
1. Open app, note time
2. Press home button
3. Wait 3 minutes
4. Reopen app
5. Verify: No penalties, data refreshed

// Test 2: Missed meal time
1. Open app at 7:55 AM
2. Press home button
3. Wait until 8:05 AM
4. Reopen app
5. Verify: Breakfast missed, hunger penalty applied

// Test 3: Missed bedtime
1. Open app at 21:55 (9:55 PM)
2. Press home button
3. Wait until 22:05 (10:05 PM)
4. Reopen app
5. Verify: Bedtime missed, sleep penalty applied

// Test 4: Multi-day background
1. Open app, note date
2. Press home button
3. Change device date to next day
4. Reopen app
5. Verify: All meals missed, penalties applied
```

### Step 8: Run Network Tests
**Online Mode:**
```bash
# Verify API calls work
# Check Chrome DevTools (chrome://inspect)
# Monitor network requests
```

**Offline Mode:**
```bash
# Enable airplane mode
# Open app
# Verify: Cached data displays, error messages shown
# Disable airplane mode
# Verify: Data syncs
```

**Slow Network:**
```bash
# In Android Studio:
# Tools > AVD Manager > Edit > Show Advanced Settings
# Network: Speed = EDGE (slow)
# Test app behavior
```

### Step 9: Run Battery Tests
**Background Drain:**
```bash
# Charge device to 100%
# Open app, then background it
# Wait 24 hours
# Check battery level
# Calculate drain rate
# Target: < 5% per day
```

**Active Usage:**
```bash
# Charge device to 100%
# Use app actively for 1 hour
# Check battery level
# Calculate drain rate
```

### Step 10: Run Edge Case Tests
**Low Storage:**
```bash
# Fill device storage to < 100MB free
# Install app
# Run app
# Verify: No crashes, graceful errors
```

**App Lifecycle:**
```bash
# Test 1: Orientation change
# Rotate device while app open
# Verify: No crashes, state preserved

# Test 2: Low memory kill
# Open many apps to trigger low memory
# Return to app
# Verify: State restored

# Test 3: Force stop
# Settings > Apps > Meosjourney > Force Stop
# Reopen app
# Verify: Launches correctly
```

### Step 11: Test on Physical Device
```bash
# Enable USB debugging on device
# Connect device via USB
# Install release APK
adb install releases/meosjourney-[timestamp].apk

# Run full test suite on physical device
# Focus on touch interaction and performance
```

### Step 12: Document Test Results
Fill in `test-results.md` with actual results from testing.

### Step 13: Create Device Compatibility Matrix
Create `plans/260508-1915-android-apk-build/reports/device-compatibility.md`:
```markdown
# Device Compatibility Matrix

| Device | Android Version | Screen Size | Status | Issues |
|--------|----------------|-------------|--------|--------|
| Pixel 5 Emulator | 14 (API 34) | 1080x2340 | ✅ Pass | None |
| [Physical Device] | [Version] | [Size] | [Status] | [Issues] |

## Minimum Requirements
- **Android Version:** 5.1+ (API 22+)
- **Screen Size:** 480x800 minimum
- **RAM:** 2GB minimum
- **Storage:** 100MB free space

## Known Issues
- [List any device-specific issues]

## Recommendations
- Tested and verified on Android 14 (API 34)
- Recommended for Android 8.0+ (API 26+) for best experience
```

### Step 14: Create Performance Metrics Report
Create `plans/260508-1915-android-apk-build/reports/performance-metrics.md`:
```markdown
# Performance Metrics

## Load Time
- **App Launch:** [X] seconds
- **Splash Screen:** 2 seconds
- **Initial Data Load:** [X] seconds
- **Target:** < 3 seconds ✅/❌

## Memory Usage
- **Initial:** [X] MB
- **After 10 min:** [X] MB
- **After 1 hour:** [X] MB
- **Peak:** [X] MB
- **Target:** < 200MB ✅/❌

## Battery Drain
- **Background (24h):** [X]% per day
- **Active (1h):** [X]% per hour
- **Target:** < 5% per day ✅/❌

## APK Size
- **APK Size:** [X] MB
- **Target:** < 50MB ✅/❌

## UI Performance
- **Average FPS:** [X] fps
- **Frame drops:** [X]%
- **Target:** 60fps, < 5% drops ✅/❌

## Network Performance
- **API Response Time:** [X] ms
- **Image Load Time:** [X] ms
- **Offline Mode:** ✅/❌

## Recommendations
[Performance optimization suggestions]
```

### Step 15: Create Bug Tracker
Create `plans/260508-1915-android-apk-build/reports/bug-tracker.md`:
```markdown
# Bug Tracker

## Critical Issues (P1)
[Issues that prevent core functionality]

## High Issues (P2)
[Issues that significantly impact UX]

## Medium Issues (P3)
[Issues that moderately impact UX]

## Low Issues (P4)
[Minor issues, cosmetic bugs]

## Bug Template
**ID:** [Unique ID]  
**Severity:** [P1/P2/P3/P4]  
**Title:** [Short description]  
**Description:** [Detailed description]  
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [Expected behavior]  
**Actual:** [Actual behavior]  
**Device:** [Device model, Android version]  
**APK Version:** [versionName]  
**Status:** [Open/In Progress/Fixed/Closed]  
**Assignee:** [Name]  
**Notes:** [Additional context]
```

## Todo List

- [ ] Create test results template
- [ ] Set up test environment (emulator)
- [ ] Install debug APK on emulator
- [ ] Run functional tests (Pet, User, Home pages)
- [ ] Run UI/UX tests (touch targets, responsiveness)
- [ ] Run performance tests (load time, memory, FPS)
- [ ] Run background tests (meal time, bedtime, multi-day)
- [ ] Run network tests (online, offline, slow network)
- [ ] Run battery tests (background drain, active usage)
- [ ] Run edge case tests (low storage, lifecycle, permissions)
- [ ] Test on physical device
- [ ] Document test results
- [ ] Create device compatibility matrix
- [ ] Create performance metrics report
- [ ] Create bug tracker
- [ ] Fix critical issues found
- [ ] Re-test after fixes
- [ ] Sign off on production readiness

## Success Criteria

- [ ] All functional tests pass (100%)
- [ ] All touch targets meet 48dp guideline
- [ ] No critical or high severity bugs
- [ ] Performance meets targets (load time, memory, battery)
- [ ] APK size under 50MB
- [ ] Tested on at least 2 devices (emulator + physical)
- [ ] Background behavior works correctly
- [ ] Network handling is robust
- [ ] Test results documented
- [ ] Production readiness approved

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Critical bugs found late | Medium | High | Test early and often, prioritize bug fixes |
| Device-specific issues | High | Medium | Test on multiple devices, document compatibility |
| Performance issues | Medium | High | Profile early, optimize before release |
| Network failures not handled | Low | High | Test offline mode, slow network, API failures |

## Security Considerations

- Test with real NocoDB credentials (not test data)
- Verify no sensitive data logged to console
- Check for exposed API keys in APK
- Test permission requests are appropriate

## Next Steps

After completing this phase:
1. **If tests pass:** Approve for production release
2. **If critical issues found:** Fix and re-test (return to Phase 05 if needed)
3. **If minor issues found:** Document for future releases
4. Distribute APK to beta testers
5. Collect user feedback
6. Plan next iteration based on feedback
7. Update documentation with lessons learned
