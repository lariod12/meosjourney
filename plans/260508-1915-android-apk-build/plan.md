---
title: "Android APK Build Implementation"
description: "Package Meosjourney web app into production Android APK using Capacitor"
status: pending
priority: P1
effort: 12h
branch: main
tags: [android, capacitor, mobile, apk, deployment]
created: 2026-05-08
---

# Android APK Build Implementation Plan

## Overview

Transform Meosjourney React web app into production Android APK using Capacitor framework. Separate folder structure (`android-app/`) with full feature parity, mobile-optimized UI, and efficient background operation.

## Project Structure

```
meosjourney/
├── src/                          # Existing web app (unchanged)
├── android-app/                  # New Android project
│   ├── www/                      # Built web assets (from dist/)
│   ├── android/                  # Native Android project (auto-generated)
│   ├── capacitor.config.ts       # Capacitor configuration
│   ├── package.json              # Android-specific dependencies
│   └── resources/                # App icons and splash screens
├── plans/260508-1915-android-apk-build/
│   ├── plan.md                   # This file
│   ├── phase-01-setup.md         # Capacitor setup
│   ├── phase-02-ui-optimization.md  # Mobile UI refactoring
│   ├── phase-03-icons-splash.md  # App branding assets
│   ├── phase-04-background.md    # Background services
│   ├── phase-05-build-apk.md     # APK generation
│   └── phase-06-testing.md       # Testing & validation
└── docs/
    └── android-deployment.md     # Deployment documentation
```

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| 01 | Capacitor Setup & Integration | pending | 2h |
| 02 | Mobile UI Optimization | pending | 3h |
| 03 | App Icons & Splash Screens | pending | 1h |
| 04 | Background Service Configuration | pending | 2h |
| 05 | APK Build & Signing | pending | 2h |
| 06 | Testing & Validation | pending | 2h |

## Key Dependencies

- **Phase 02** depends on **Phase 01** (UI optimization requires Capacitor setup)
- **Phase 03** depends on **Phase 01** (icon generation uses Capacitor tools)
- **Phase 04** depends on **Phase 01** (background services use Capacitor plugins)
- **Phase 05** depends on **Phases 01-04** (build requires all configurations)
- **Phase 06** depends on **Phase 05** (testing requires built APK)

## Success Criteria

- [ ] APK builds successfully without errors
- [ ] All web features work identically on Android
- [ ] Touch targets meet Android guidelines (48dp minimum)
- [ ] App runs efficiently in background
- [ ] App icon displays correctly in launcher
- [ ] No console errors or crashes
- [ ] Responsive on various Android screen sizes
- [ ] NocoDB API calls work from Android app

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Capacitor plugin compatibility issues | Medium | High | Test plugins early, use stable versions |
| UI elements too small for touch | High | Medium | Audit all buttons/inputs, apply 48dp minimum |
| Background service battery drain | Medium | High | Use efficient polling, respect Android power management |
| APK signing key management | Low | Critical | Document key generation, secure storage |
| NocoDB CORS issues from Android | Medium | High | Configure CORS headers, test early |

## Technical Approach

### Capacitor vs React Native
**Decision: Use Capacitor**
- Preserves existing React codebase 100%
- Minimal code changes required
- Web-first approach aligns with current architecture
- Easier maintenance (single codebase)

### Folder Separation Strategy
- `android-app/` as standalone project prevents web/mobile conflicts
- Build process copies `dist/` → `android-app/www/`
- Shared source code remains in `src/`
- Android-specific configs isolated in `android-app/`

### UI Optimization Strategy
- Audit all interactive elements for touch target size
- Increase button padding/height to meet 48dp guideline
- Adjust modal sizes for mobile screens
- Test on small (480px) and large (1080px) Android screens

## Next Steps

1. Read [phase-01-setup.md](./phase-01-setup.md) for Capacitor installation
2. Execute phases sequentially (01 → 06)
3. Update this plan's phase statuses as work progresses
4. Document any deviations or blockers in phase files
