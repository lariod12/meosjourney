# Pet Biological Clock System - Implementation Summary

## ✅ Hoàn Thành

Đã implement thành công hệ thống "biological clock" - pet tự động đói vào giờ ăn và buồn ngủ vào giờ ngủ, với cảnh báo thought bubble và trừ status nếu không được chăm sóc đúng giờ.

---

## 🎯 Features

### Meal Times (3 bữa/ngày)
- **Breakfast:** 8:00 AM - "Tui đói rồi! Đến giờ ăn sáng rồi!"
- **Lunch:** 11:00 AM - "Tui đói bụng! Đến giờ ăn trưa rồi!"
- **Dinner:** 6:00 PM - "Tui đói lắm! Đến giờ ăn tối rồi!"

### Sleep Time
- **Bedtime:** 10:00 PM (22:00) - "Tui buồn ngủ quá! Đến giờ ngủ rồi!"
- Kéo dài đến 5:00 AM sáng hôm sau

### Behavior
1. **Vào giờ ăn:**
   - Pet tự động hungry (`isHungry: true`)
   - Thought bubble hiển thị message đói
   - Bắt đầu trừ hunger: -1 mỗi 5 phút
   - Tiếp tục cho đến khi được cho ăn

2. **Vào giờ ngủ:**
   - Pet tự động sleepy (`isSleepy: true`)
   - Thought bubble hiển thị message buồn ngủ
   - Bắt đầu trừ sanity: -1 mỗi 5 phút
   - Tiếp tục cho đến sáng (5:00 AM)

3. **Khi được chăm sóc:**
   - Feed food → Clear hungry state, save timestamp
   - Use bed/nap mat → Clear sleepy state, save timestamp
   - Stop penalty timers

---

## 🏗️ Implementation Details

### 1. State Management

**Biological Clock State:**
```javascript
const [biologicalClock, setBiologicalClock] = useState({
  lastBreakfast: null,    // timestamp
  lastLunch: null,        // timestamp
  lastDinner: null,       // timestamp
  lastSleep: null,        // timestamp
  isHungry: false,
  isSleepy: false,
  currentMealTime: null   // 'breakfast' | 'lunch' | 'dinner' | null
});
```

### 2. Time Detection Functions

**getMealTime(hour, minute):**
- Returns 'breakfast' at 8:00
- Returns 'lunch' at 11:00
- Returns 'dinner' at 18:00
- Returns null otherwise

**isBedtime(hour):**
- Returns true from 22:00 to 5:00
- Returns false otherwise

**wasMealEatenToday(timestamp):**
- Checks if timestamp is today
- Used to prevent duplicate triggers

### 3. Biological Clock Monitoring

**useEffect - Check every minute:**
```javascript
useEffect(() => {
  const checkBiologicalClock = () => {
    // Check meal times
    const mealTime = getMealTime(hour, minute);
    if (mealTime && !wasMealEatenToday(lastMeal)) {
      setBiologicalClock({ isHungry: true, currentMealTime: mealTime });
    }
    
    // Check bedtime
    if (isBedtime(hour) && !sleptTonight) {
      setBiologicalClock({ isSleepy: true });
    }
  };
  
  setInterval(checkBiologicalClock, 60000); // Every minute
}, [biologicalClock]);
```

### 4. Status Penalty System

**useEffect - Penalty every 5 minutes:**
```javascript
useEffect(() => {
  if (biologicalClock.isHungry || biologicalClock.isSleepy) {
    setInterval(() => {
      setPetStatus(prev => ({
        hunger: biologicalClock.isHungry ? Math.max(0, prev.hunger - 1) : prev.hunger,
        sanity: biologicalClock.isSleepy ? Math.max(0, prev.sanity - 1) : prev.sanity
      }));
    }, 300000); // Every 5 minutes
  }
}, [biologicalClock.isHungry, biologicalClock.isSleepy]);
```

### 5. Thought Bubble Priority

**getPetReaction() - Priority order:**
1. **Biological clock warnings** (highest priority)
   - Hungry messages (breakfast/lunch/dinner)
   - Sleepy messages (bedtime)
2. **Critical status** (health/hunger/sanity ≤ 20)
3. **Regular status messages**

```javascript
const getPetReaction = (status, biologicalClock) => {
  // Priority 1: Biological clock
  if (biologicalClock.isHungry) {
    return { level: 'critical', message: BIOLOGICAL_CLOCK_MESSAGES[mealTime] };
  }
  
  if (biologicalClock.isSleepy) {
    return { level: 'critical', message: BIOLOGICAL_CLOCK_MESSAGES.bedtime };
  }
  
  // Priority 2: Regular status
  // ... existing logic
};
```

### 6. Feed/Rest Actions

**handleConfirmUsePetItem() - Clear biological clock:**
```javascript
// When feeding during meal time
if (category === 'food' && biologicalClock.isHungry) {
  setBiologicalClock({
    lastBreakfast/lastLunch/lastDinner: Date.now(),
    isHungry: false,
    currentMealTime: null
  });
  saveStatus({ biologicalClock });
}

// When resting during bedtime
if (category === 'care' && item.shape === 'bed' && biologicalClock.isSleepy) {
  setBiologicalClock({
    lastSleep: Date.now(),
    isSleepy: false
  });
  saveStatus({ biologicalClock });
}
```

### 7. NocoDB Integration

**Load on page load:**
```javascript
const statusData = await fetchStatus();
if (statusData.biologicalClock) {
  setBiologicalClock(prev => ({
    ...prev,
    ...statusData.biologicalClock
  }));
}
```

**Save on feed/rest:**
```javascript
await saveStatus({
  biologicalClock: updatedBiologicalClock
});
```

---

## 📊 Data Structure (NocoDB)

**`status` table - `biologicalClock` field:**
```json
{
  "biologicalClock": {
    "lastBreakfast": 1715155200000,
    "lastLunch": 1715166000000,
    "lastDinner": 1715191200000,
    "lastSleep": 1715205600000,
    "isHungry": false,
    "isSleepy": false,
    "currentMealTime": null
  }
}
```

---

## 🎨 Messages

### Breakfast (8:00 AM)
- "Tui đói rồi! Đến giờ ăn sáng rồi!"
- "8 giờ sáng rồi, tui cần ăn sáng!"
- "Bụng tui sôi ùng ục! Giờ ăn sáng đây!"

### Lunch (11:00 AM)
- "Tui đói bụng! Đến giờ ăn trưa rồi!"
- "11 giờ rồi, tui cần ăn trưa!"
- "Trưa rồi mà chưa ăn, tui đói quá!"

### Dinner (6:00 PM)
- "Tui đói lắm! Đến giờ ăn tối rồi!"
- "6 giờ chiều rồi, tui cần ăn tối!"
- "Tối rồi mà chưa ăn, tui sắp xỉu!"

### Bedtime (10:00 PM)
- "Tui buồn ngủ quá! Đến giờ ngủ rồi!"
- "10 giờ tối rồi, tui cần nghỉ ngơi!"
- "Tui mệt lắm, để tui ngủ đi!"

---

## 🔄 Flow Diagram

```
8:00 AM → Breakfast Time
  ├─ isHungry = true
  ├─ Show thought bubble
  ├─ Start penalty timer (-1 hunger/5min)
  └─ Wait for food
      ├─ Fed → Clear hungry, save timestamp
      └─ Not fed → Continue penalty

11:00 AM → Lunch Time
  ├─ isHungry = true
  ├─ Show thought bubble
  ├─ Start penalty timer (-1 hunger/5min)
  └─ Wait for food
      ├─ Fed → Clear hungry, save timestamp
      └─ Not fed → Continue penalty

18:00 (6:00 PM) → Dinner Time
  ├─ isHungry = true
  ├─ Show thought bubble
  ├─ Start penalty timer (-1 hunger/5min)
  └─ Wait for food
      ├─ Fed → Clear hungry, save timestamp
      └─ Not fed → Continue penalty

22:00 (10:00 PM) → Bedtime
  ├─ isSleepy = true
  ├─ Show thought bubble
  ├─ Start penalty timer (-1 sanity/5min)
  └─ Wait for rest
      ├─ Rested → Clear sleepy, save timestamp
      └─ Not rested → Continue until 5:00 AM

5:00 AM → Morning
  └─ Reset sleepy state
```

---

## 📁 Files Modified

### `src/features/pet/components/PetPage.jsx`

**Added:**
- Time detection functions (getMealTime, isBedtime, wasMealEatenToday)
- BIOLOGICAL_CLOCK_MESSAGES constant
- biologicalClock state
- Biological clock monitoring useEffect
- Status penalty system useEffect
- Updated getPetReaction with biological clock priority
- Updated handleConfirmUsePetItem to clear biological clock
- Load biological clock from NocoDB
- Save biological clock to NocoDB

**Lines added:** ~23-58, ~282-305, ~1048-1056, ~1371-1453, ~1578-1620, ~1223-1230

---

## 🧪 Testing Scenarios

### Scenario 1: Breakfast Time
1. Wait until 8:00 AM
2. Pet shows thought bubble: "Tui đói rồi! Đến giờ ăn sáng rồi!"
3. Hunger decreases -1 every 5 minutes
4. Feed pet → Hungry state clears
5. Thought bubble returns to normal

### Scenario 2: Lunch Time
1. Wait until 11:00 AM
2. Pet shows thought bubble: "Tui đói bụng! Đến giờ ăn trưa rồi!"
3. Hunger decreases -1 every 5 minutes
4. Feed pet → Hungry state clears

### Scenario 3: Dinner Time
1. Wait until 6:00 PM
2. Pet shows thought bubble: "Tui đói lắm! Đến giờ ăn tối rồi!"
3. Hunger decreases -1 every 5 minutes
4. Feed pet → Hungry state clears

### Scenario 4: Bedtime
1. Wait until 10:00 PM
2. Pet shows thought bubble: "Tui buồn ngủ quá! Đến giờ ngủ rồi!"
3. Sanity decreases -1 every 5 minutes
4. Use bed/nap mat → Sleepy state clears

### Scenario 5: Ignore Meal Time
1. Don't feed at meal time
2. Hunger continues to decrease
3. Pet status gets worse
4. Feed later → Hungry state clears (but status already low)

### Scenario 6: Ignore Bedtime
1. Don't rest at bedtime
2. Sanity continues to decrease until morning
3. At 5:00 AM → Sleepy state auto-clears
4. But sanity is already low

### Scenario 7: Page Refresh
1. Feed pet at breakfast
2. Refresh page
3. Biological clock data loads from NocoDB
4. Pet doesn't get hungry again at breakfast (already eaten today)

---

## 💡 Benefits

✅ **Realistic:** Pet behaves like a real creature with biological needs
✅ **Engaging:** User must care for pet at specific times
✅ **Consequences:** Ignoring meal/sleep times has real penalties
✅ **Persistent:** Data saves to NocoDB, survives page refresh
✅ **Priority:** Biological clock warnings override regular messages
✅ **Automatic:** No user action needed to trigger
✅ **Real-time:** Based on actual system time

---

## 🚀 Future Enhancements

### Weekend vs Weekday
- Different meal times on weekends
- Later wake-up time on weekends

### Snack Times
- Optional snack times between meals
- Smaller hunger penalties

### Nap Time
- Afternoon nap time (2:00 PM)
- Shorter sleep duration

### Exercise Time
- Morning exercise reminder (7:00 AM)
- Evening walk reminder (5:00 PM)

### Customizable Schedule
- User can set custom meal times
- User can set custom bedtime

### Timezone Support
- Detect user timezone
- Adjust meal/sleep times accordingly

---

## ✨ Summary

Hệ thống biological clock hoàn chỉnh:
- ✅ 3 meal times (8h, 11h, 18h)
- ✅ 1 bedtime (22h-5h)
- ✅ Thought bubble warnings
- ✅ Status penalties (-1 every 5 min)
- ✅ Feed/rest clears states
- ✅ NocoDB persistence
- ✅ Real-time monitoring
- ✅ Priority messaging
- ✅ Build successful

Pet giờ đây có biological clock thực tế, cần được chăm sóc đúng giờ! 🍽️😴✨
