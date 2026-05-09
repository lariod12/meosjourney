# Test Wake-Up Flow

## Scenario 1: Normal Sleep → Morning Wake-Up
1. ✅ User uses Bed item → `isSleeping = true`
2. ✅ Pet shows sleep animation (closed eyes, ZZZ particles)
3. ✅ Activity auto-set to "Đi ngủ" if exists
4. ✅ Time reaches 5 AM → `isAwakening = true`
5. ✅ Awakening overlay appears with "Tap để đánh thức Méo dậy!" message
6. ✅ Pet still shows sleep animation (eyes closed) but NO ZZZ particles
7. ✅ User taps screen → `isSleeping = false`, `isAwakening = false`
8. ✅ Pet wakes up (normal animation resumes)
9. ✅ Activity changes to first non-sleep activity

## Scenario 2: Sleep Activity Conflict Fix
**Before Fix:**
- Time reaches 5 AM → pet auto-wakes
- But activity is still "Đi ngủ" → triggers sleep animation again
- Conflict: wake ↔ sleep loop

**After Fix:**
- Time reaches 5 AM → `isAwakening = true` (NOT auto-wake)
- Activity is still "Đi ngủ" but `isAwakening` prevents sleep animation
- User must tap to complete wake-up
- After tap, activity changes to non-sleep activity

## Scenario 3: User Changes Activity While Awakening
1. Pet is in awakening state (5 AM, waiting for tap)
2. User manually changes activity to non-sleep activity
3. `useEffect` detects activity change → auto-completes wake-up
4. No need to tap, pet wakes immediately

## Key Logic Changes

### State Management
```javascript
const [isSleeping, setIsSleeping] = useState(false);
const [isAwakening, setIsAwakening] = useState(false);
```

### Wake-Up Check (5 AM)
```javascript
// OLD: Auto-wake at 5 AM
if (hour >= 5 && hour < 22) {
  setIsSleeping(false);
}

// NEW: Show awakening effect, wait for tap
if (hour >= 5 && hour < 22) {
  setIsAwakening(true);
}
```

### Sleep Animation Condition
```javascript
// OLD: Show sleep animation when isSleeping
className={`pet-character ${isSleeping ? 'pet-character--sleeping' : ''}`}

// NEW: Show sleep animation only when sleeping AND NOT awakening
className={`pet-character ${isSleeping && !isAwakening ? 'pet-character--sleeping' : ''}`}
```

### ZZZ Particles Condition
```javascript
// OLD: Show ZZZ when sleeping
{isSleeping && <div className="pet-sleep-zzz">...</div>}

// NEW: Show ZZZ only when sleeping AND NOT awakening
{isSleeping && !isAwakening && <div className="pet-sleep-zzz">...</div>}
```

### Activity Change Detection
```javascript
useEffect(() => {
  if (currentActivityName && currentActivityName.toLowerCase().includes('ngủ')) {
    if (!isSleeping && !isAwakening) {
      setIsSleeping(true);
    }
  } else {
    // If activity changed to non-sleep and was awakening, complete wake up
    if (isAwakening) {
      setIsSleeping(false);
      setIsAwakening(false);
    }
  }
}, [currentActivityName, isSleeping, isAwakening]);
```

## Visual Elements

### Awakening Overlay
- Semi-transparent black background with blur
- White card with black border and shadow
- Sun icon (☀️) rotating continuously
- Text: "Tap để đánh thức Méo dậy!"
- Hand icon (👆) bouncing up and down
- Entire overlay is clickable

### Animations
- `pet-awakening-fade-in`: Overlay fades in smoothly
- `pet-awakening-bounce`: Card bounces gently
- `pet-awakening-rotate`: Sun icon rotates 360°
- `pet-awakening-tap`: Hand icon bounces to indicate tap action

## Testing Checklist
- [ ] Sleep at night (use Bed item)
- [ ] Wait until 5 AM (or change system time)
- [ ] Verify awakening overlay appears
- [ ] Verify pet eyes are closed but no ZZZ
- [ ] Tap screen to wake up
- [ ] Verify pet wakes up and activity changes
- [ ] Verify no more sleep animation conflict
