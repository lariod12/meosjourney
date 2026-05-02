---
title: Virtual Pet View Plan
status: waiting-for-implementation
created: 2026-05-03
owner: unassigned
scope: skeleton
stack:
  - React
  - PixiJS
  - NocoDB
  - Capacitor
future_stack:
  - Three.js
blockedBy: []
blocks: []
---

# Virtual Pet View Plan

## Overview

Create a lightweight virtual pet view for Meo's Journey. The first version should be a single interactive scene where the pet idles, walks around, reacts to touch, and interacts with home and food objects. The implementation should stay compatible with the current React/Vite app and remain ready for future Android packaging through Capacitor.

This is a planning skeleton only. No runtime code is implemented yet.

## Product Direction

The virtual pet should feel like a living companion inside the existing RPG character sheet world, not a separate arcade game. The first version should prioritize charm, touch interactions, persistent pet state, and mobile-friendly performance.

## Stack Decision

| Layer | Choice | Reason |
| --- | --- | --- |
| App shell | React + Vite | Existing project stack and routing model |
| 2D scene renderer | PixiJS | Best fit for one interactive pet scene with sprite animations |
| UI styling | React + CSS | Existing sketch UI, black/white/grayscale design system |
| Data persistence | NocoDB service helpers | Existing app data layer and environment handling |
| Android packaging | Capacitor | Reuse the web app and package it into Android later |
| Future 3D world | Three.js or React Three Fiber | Add only if the pet world evolves into 3D |

## Non-Goals

- Do not build a full Phaser-style game engine layer for the first version.
- Do not rewrite the app in React Native or Flutter.
- Do not introduce Firebase or old storage services.
- Do not create eager imports for protected user/admin routes.
- Do not use non-grayscale UI colors.

## Proposed Route And Feature Location

Preferred feature structure:

```text
src/features/pet/
├── components/
│   ├── PetPage.jsx
│   ├── PetScene.jsx
│   ├── PetStats.jsx
│   ├── PetControls.jsx
│   └── PetInventoryPanel.jsx
├── hooks/
│   ├── usePetState.js
│   └── usePetActions.js
├── renderers/
│   ├── PixiPetRenderer.jsx
│   └── README.md
├── services/
│   └── petService.js
├── styles/
│   └── pet.css
└── constants.js
```

Route options:

| Route | Use When |
| --- | --- |
| `/pet` | Pet view should become a standalone surface |
| `/user/meos05` section | Pet actions are private/user-managed |
| Home page section | Pet is part of the public character presentation |

Initial recommendation: start with `/pet` or a lazy-loaded pet page, then link to it from the current home/user surfaces.

## Rendering Boundaries

PixiJS should own:

- Pet sprite rendering
- Sprite sheet animations
- Idle walking loop
- Tap/pointer hit areas
- Scene object placement
- Pet movement and simple tweens
- Food/home interaction animations

React and CSS should own:

- Page layout
- Pet stats
- Action buttons
- Inventory panels
- Dialogs and modals
- Toasts and floating text overlays
- Save/loading/error states

Avoid pushing React state updates on every PixiJS animation frame. PixiJS should run its own ticker, while React should only receive meaningful state changes.

## Pet States

Initial state machine:

| State | Trigger | Result |
| --- | --- | --- |
| `idle` | Default/resting | Pet waits, blinks, small idle motion |
| `walking` | Idle timer or target movement | Pet walks around within scene bounds |
| `touched` | User taps pet | Pet reacts and affection increases |
| `eating` | User taps food or feed action | Hunger improves, pet moves to food |
| `sleeping` | User taps home or sleep action | Energy improves over time |
| `happy` | Positive interaction | Short celebration animation |
| `sad` | Low mood/hunger | Slower movement and sad idle animation |

Future optional states:

- `playing`
- `washing`
- `sick`
- `levelUp`
- `enteringHome`
- `leavingHome`

## Scene Objects

Minimum first scene:

| Object | Behavior |
| --- | --- |
| Pet | Main animated character with touch interactions |
| Home | Tap target for sleep/rest behavior |
| Food bowl | Tap target for eating behavior |
| Floor/ground | Movement area and visual anchor |
| Optional toy | Simple mood interaction |

All visual assets should follow the existing black/white/grayscale sketch style.

## Data Model Draft

Draft NocoDB-backed pet fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `Id` | Record ID | NocoDB primary record |
| `character_id` | Text/foreign reference | Links pet state to the current character |
| `name` | Text | Pet display name |
| `species` | Text | Pet type or visual preset |
| `level` | Number | Pet progression |
| `xp` | Number | Pet progression points |
| `hunger` | Number | 0-100 hunger meter |
| `mood` | Number | 0-100 mood meter |
| `energy` | Number | 0-100 energy meter |
| `affection` | Number | 0-100 bond meter |
| `current_state` | Text | Last persistent state |
| `skin_key` | Text | Asset variant key |
| `last_fed_at` | DateTime | Decay and cooldown calculation |
| `last_played_at` | DateTime | Decay and cooldown calculation |
| `last_slept_at` | DateTime | Decay and cooldown calculation |
| `updated_at` | DateTime | Sync marker |

Implementation note: inspect the target NocoDB environment before adding tables or fields. Use MCP for live schema inspection, but runtime code should use the app's NocoDB service helpers.

## Asset Plan

Initial asset categories:

```text
src/assets/pet/
├── sprites/
│   ├── pet-idle.png
│   ├── pet-walk.png
│   ├── pet-eat.png
│   ├── pet-sleep.png
│   └── pet-touch.png
├── objects/
│   ├── pet-home.png
│   ├── food-bowl.png
│   └── toy.png
└── atlases/
    └── pet-atlas.json
```

Prefer sprite sheets or texture atlases over many separate image requests once the animation set grows.

## Mobile And Android Requirements

- Design mobile-first.
- Keep touch targets at least 44px.
- Use responsive canvas sizing with stable aspect ratio.
- Limit canvas resolution on high-DPI screens when needed.
- Pause or reduce ticker work when the page/app is hidden.
- Cache PixiJS textures.
- Keep UI outside the canvas where possible.
- Avoid heavy React rerenders during animation.
- Validate the same build in web first before adding Capacitor.

## Future Three.js Path

Do not start with Three.js for version 1. Keep the rendering API boundary clean so a later 3D world can be added without rewriting pet data or UI.

Future structure:

```text
src/features/pet/renderers/
├── PixiPetRenderer.jsx
└── ThreePetRenderer.jsx
```

Expected shared contract:

```text
PetScene receives pet state and action callbacks.
Renderer owns visual scene details.
React owns app UI, persistence, and navigation.
```

## Implementation Phases

| Phase | Status | Goal |
| --- | --- | --- |
| 1. Discovery | Waiting | Confirm route, UX placement, NocoDB table strategy, and asset format |
| 2. Foundation | Waiting | Add lazy pet route, feature folder, base service, and placeholder state |
| 3. PixiJS Scene | Waiting | Render pet, home, food, hit areas, and responsive canvas |
| 4. Pet State Machine | Waiting | Add idle/walk/touch/eat/sleep states and transitions |
| 5. Persistence | Waiting | Save/load pet state through NocoDB helpers with environment-aware IDs |
| 6. UI Layer | Waiting | Add stats, controls, inventory panel, loading/error states |
| 7. Polish | Waiting | Add sprite sheets, floating feedback, sounds if approved, and mobile tuning |
| 8. Android Readiness | Waiting | Add Capacitor only after web behavior is stable |

## Phase Details

### Phase 1: Discovery

- Decide route: `/pet`, home section, or user section.
- Confirm whether pet data is public, private, or both.
- Inspect NocoDB schema and decide whether to add a new pet table.
- Confirm initial pet visual style and asset source.
- Confirm whether Android packaging is part of the first release or later.

### Phase 2: Foundation

- Add pet feature folder under `src/features/pet/`.
- Add route wiring without making existing user/admin imports eager.
- Add placeholder pet state and fallback data.
- Add feature-scoped CSS with `pet-` class prefix.

### Phase 3: PixiJS Scene

- Install PixiJS with pnpm.
- Create `PetScene.jsx` and `PixiPetRenderer.jsx`.
- Mount/destroy PixiJS application safely in React lifecycle.
- Render placeholder pet, home, and food objects.
- Add responsive scene bounds.

### Phase 4: Pet State Machine

- Add `PET_STATES` constants.
- Implement idle and random walking.
- Add tap reaction on pet.
- Add tap interaction for home and food.
- Keep visual transitions inside PixiJS.
- Emit only meaningful events back to React.

### Phase 5: Persistence

- Add `petService.js`.
- Load pet state with fallback data.
- Save state after meaningful actions, not every frame.
- Add request deduplication and cache behavior consistent with current NocoDB helpers.
- Handle development, staging, and production table differences explicitly.

### Phase 6: UI Layer

- Add `PetStats`.
- Add `PetControls`.
- Add `PetInventoryPanel`.
- Add loading, empty, and error states.
- Keep UI black/white/grayscale only.
- Preserve sketch typography, borders, and solid black shadows.

### Phase 7: Polish

- Replace placeholders with sprite sheets.
- Add animation variants for each pet state.
- Add floating feedback labels outside the canvas.
- Tune mobile layout at 1024px, 768px, and 480px breakpoints.
- Add accessibility labels for controls.

### Phase 8: Android Readiness

- Add Capacitor only after web implementation is stable.
- Configure Android package metadata.
- Verify local web build.
- Verify Android WebView touch behavior.
- Package assets inside the app where useful.

## Testing Checklist

- Web route loads without blocking existing home/user/admin pages.
- Pet scene mounts and unmounts without memory leaks.
- Pet keeps walking when idle.
- Tap on pet triggers the correct state.
- Tap on food triggers eating.
- Tap on home triggers sleeping/resting.
- React UI does not rerender every animation frame.
- NocoDB load/save works in development.
- Staging/production image URL behavior remains unchanged.
- Mobile layout fits at 480px width.
- Build succeeds with `pnpm run build`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Canvas animation causes React rerenders | Keep PixiJS ticker isolated from React state |
| Asset files become too heavy | Use optimized sprite sheets and texture atlases |
| NocoDB schema diverges by environment | Inspect schema before implementation and handle table IDs per mode |
| Android feels no smoother than web | Optimize PixiJS first; Capacitor improves app packaging, not core rendering |
| Future 3D rewrite pressure | Keep renderer boundary clean from day one |

## Success Criteria

- A user can open the pet view on web.
- The pet appears immediately with fallback state.
- The pet idles and walks around without user input.
- The user can tap the pet, home, and food.
- Pet stats update from interactions.
- Pet state persists through NocoDB.
- The implementation follows existing project architecture and design rules.
- The code remains ready for a future Capacitor Android package.

## Handoff Notes

Before implementation:

1. Run GitNexus impact analysis before editing any function, class, or method.
2. Read `README.md`, `AGENTS.md`, and relevant NocoDB docs.
3. Confirm whether the pet route should be public or protected.
4. Confirm the NocoDB environment before any schema or record changes.
5. Use pnpm for package operations.
6. Do not start a dev server if one is already running.

Suggested implementation command:

```bash
/ck:cook plans/260503-0355-virtual-pet-view/plan.md --fast
```
