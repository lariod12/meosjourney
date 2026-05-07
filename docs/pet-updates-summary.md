# Pet System Updates - 2026-05-08

## 1. Smart Bubble System +

### Features:
- **Status-based timing**: Critical (15-25s), Needs Care (30-50s), Stable (60-100s)
- **Page Visibility API**: Pauses when tab hidden
- **Initial delay**: 8s before first bubble
- **Interaction cooldown**: 12s after feed/care/activity change
- **Random timing**: Natural feel, not robotic
- **Show chance**: 70-90% (not always)

### Files:
- `src/features/pet/components/PetPage.jsx`

---

## 2. Pet Info Dropdown Animations 🎉

### Animation Sequence:
1. **Food/Care effect** (0-3s): Icon flies to pet
2. **Info dropdown animation** (3-3.6s): Badge pops + plus sign floats

### Effects:
1. **Pop animation**: Info item scales up + rotates slightly (bounce)
2. **Brightness pulse**: Label text glows when value increases
3. **Plus sign effect**: + icon floats up from center
4. **Duration**: 500-700ms

### Trigger:
- Only when status **increases** in the info dropdown (top-right corner)
- Independent for each stat (health, hunger, sanity)
- Works even when dropdown is collapsed

### Visual Location:
- **Info dropdown** at top-right corner (100%, 88%, 72% badges)
- NOT the large status list in the status tab

### Files:
- `src/features/pet/styles/pet.css` - Animations
- `src/features/pet/components/PetPage.jsx` - PetStatusPanel logic

---

## Testing:

### Bubble System:
- [ ] Pet critical → frequent bubbles (15-25s)
- [ ] Pet stable → rare bubbles (60-100s)
- [ ] Switch tab → bubbles pause
- [ ] Return to tab → bubbles resume
- [ ] Feed/care → 12s cooldown before next bubble

### Status Animations:
- [ ] Feed pet → Hunger bar animates with Plus sign
- [ ] Care pet → Health/Sanity bars animate with Plus sign
- [ ] Multiple stats increase → all animate together
- [ ] Status decrease → no animation
- [ ] Smooth, no jank

---

## Documentation:
- Full details: `docs/pet-bubble-improvements.md`



