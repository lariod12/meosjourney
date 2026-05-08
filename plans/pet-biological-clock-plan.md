# Pet Biological Clock System - Implementation Plan

## 🎯 Objective

Implement a realistic biological clock system where pet automatically gets hungry at meal times and sleepy at bedtime, with warnings and status penalties if not cared for on time.

---

## 📋 Requirements

### Meal Times (3 meals/day)
- **Breakfast:** 8:00 AM
- **Lunch:** 11:00 AM  
- **Dinner:** 6:00 PM (18:00)

### Sleep Time
- **Bedtime:** 10:00 PM (22:00) onwards

### Behavior
1. **At meal time:** Pet becomes hungry
   - Show thought bubble: "Tui đói rồi! Đến giờ ăn rồi!"
   - Start decreasing hunger status (-1 every 5 minutes if not fed)
   - Continue until fed or next meal time

2. **At bedtime:** Pet becomes sleepy
   - Show thought bubble: "Tui buồn ngủ quá! Đến giờ ngủ rồi!"
   - Start decreasing sanity status (-1 every 5 minutes if not rested)
   - Continue until morning (5:00 AM)

3. **Status penalties:**
   - Hunger: -1 every 5 minutes after meal time (if not fed)
   - Sanity: -1 every 5 minutes after 10 PM (if not rested)
   - Stop penalties when fed/rested

---

## 🏗️ Implementation Steps

### Phase 1: Biological Clock State Management

**Add new states:**
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

### Phase 2: Time Detection Functions

```javascript
// Check if current time is meal time
const getMealTime = (hour, minute) => {
  if (hour === 8 && minute === 0) return 'breakfast';
  if (hour === 11 && minute === 0) return 'lunch';
  if (hour === 18 && minute === 0) return 'dinner';
  return null;
};

// Check if it's bedtime
const isBedtime = (hour) => {
  return hour >= 22 || hour < 5; // 10 PM to 5 AM
};

// Check if meal was eaten today
const wasMealEatenToday = (lastMealTimestamp) => {
  if (!lastMealTimestamp) return false;
  const now = new Date();
  const lastMeal = new Date(lastMealTimestamp);
  return now.toDateString() === lastMeal.toDateString();
};
```

### Phase 3: Biological Clock useEffect

```javascript
useEffect(() => {
  const checkBiologicalClock = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Check meal times
    const mealTime = getMealTime(hour, minute);
    if (mealTime) {
      const mealKey = `last${mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}`;
      const wasEaten = wasMealEatenToday(biologicalClock[mealKey]);
      
      if (!wasEaten) {
        setBiologicalClock(prev => ({
          ...prev,
          isHungry: true,
          currentMealTime: mealTime
        }));
      }
    }
    
    // Check bedtime
    if (isBedtime(hour)) {
      const sleptTonight = wasMealEatenToday(biologicalClock.lastSleep);
      if (!sleptTonight) {
        setBiologicalClock(prev => ({
          ...prev,
          isSleepy: true
        }));
      }
    } else {
      // Reset sleepy state in the morning
      if (hour >= 5 && biologicalClock.isSleepy) {
        setBiologicalClock(prev => ({
          ...prev,
          isSleepy: false
        }));
      }
    }
  };
  
  // Check every minute
  const intervalId = setInterval(checkBiologicalClock, 60000);
  checkBiologicalClock(); // Initial check
  
  return () => clearInterval(intervalId);
}, [biologicalClock]);
```

### Phase 4: Status Penalty System

```javascript
useEffect(() => {
  let penaltyIntervalId;
  
  if (biologicalClock.isHungry || biologicalClock.isSleepy) {
    penaltyIntervalId = setInterval(() => {
      setPetStatus(prev => {
        const updates = {};
        
        // Hunger penalty
        if (biologicalClock.isHungry) {
          updates.hunger = Math.max(0, prev.hunger - 1);
        }
        
        // Sanity penalty
        if (biologicalClock.isSleepy) {
          updates.sanity = Math.max(0, prev.sanity - 1);
        }
        
        return { ...prev, ...updates };
      });
      
      // Save to NocoDB
      enqueuePetSave(updates);
    }, 300000); // Every 5 minutes
  }
  
  return () => {
    if (penaltyIntervalId) {
      clearInterval(penaltyIntervalId);
    }
  };
}, [biologicalClock.isHungry, biologicalClock.isSleepy]);
```

### Phase 5: Thought Bubble Messages

**Add biological clock messages:**
```javascript
const BIOLOGICAL_CLOCK_MESSAGES = {
  breakfast: [
    "Tui đói rồi! Đến giờ ăn sáng rồi!",
    "8 giờ sáng rồi, tui cần ăn sáng!",
    "Bụng tui sôi ùng ục! Giờ ăn sáng đây!"
  ],
  lunch: [
    "Tui đói bụng! Đến giờ ăn trưa rồi!",
    "11 giờ rồi, tui cần ăn trưa!",
    "Trưa rồi mà chưa ăn, tui đói quá!"
  ],
  dinner: [
    "Tui đói lắm! Đến giờ ăn tối rồi!",
    "6 giờ chiều rồi, tui cần ăn tối!",
    "Tối rồi mà chưa ăn, tui sắp xỉu!"
  ],
  bedtime: [
    "Tui buồn ngủ quá! Đến giờ ngủ rồi!",
    "10 giờ tối rồi, tui cần nghỉ ngơi!",
    "Tui mệt lắm, để tui ngủ đi!"
  ]
};
```

**Update getPetReaction:**
```javascript
const getPetReaction = (petStatus, biologicalClock) => {
  // Priority 1: Biological clock warnings
  if (biologicalClock.isHungry && biologicalClock.currentMealTime) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES[biologicalClock.currentMealTime];
    return {
      level: 'critical',
      message: messages[Math.floor(Math.random() * messages.length)]
    };
  }
  
  if (biologicalClock.isSleepy) {
    const messages = BIOLOGICAL_CLOCK_MESSAGES.bedtime;
    return {
      level: 'critical',
      message: messages[Math.floor(Math.random() * messages.length)]
    };
  }
  
  // Priority 2: Regular status-based messages
  // ... existing logic
};
```

### Phase 6: Feed/Rest Actions

**Update handlePetItemUse:**
```javascript
const handlePetItemUse = async (item) => {
  // ... existing logic
  
  // Check if feeding during meal time
  if (item.category === 'food' && biologicalClock.isHungry) {
    const mealKey = `last${biologicalClock.currentMealTime.charAt(0).toUpperCase() + biologicalClock.currentMealTime.slice(1)}`;
    
    setBiologicalClock(prev => ({
      ...prev,
      [mealKey]: Date.now(),
      isHungry: false,
      currentMealTime: null
    }));
    
    // Save to NocoDB
    await saveStatus({
      biologicalClock: {
        ...biologicalClock,
        [mealKey]: Date.now()
      }
    });
  }
  
  // Check if resting during bedtime
  if (item.category === 'care' && item.shape === 'nap mat' && biologicalClock.isSleepy) {
    setBiologicalClock(prev => ({
      ...prev,
      lastSleep: Date.now(),
      isSleepy: false
    }));
    
    // Save to NocoDB
    await saveStatus({
      biologicalClock: {
        ...biologicalClock,
        lastSleep: Date.now()
      }
    });
  }
};
```

### Phase 7: Load/Save Biological Clock Data

**Update loadInitialData:**
```javascript
const loadInitialData = async () => {
  const statusData = await fetchStatus();
  
  if (statusData.biologicalClock) {
    setBiologicalClock(statusData.biologicalClock);
  }
};
```

---

## 🎨 Visual Indicators

### Thought Bubble Priority
1. **Biological clock warnings** (highest priority)
2. Critical status (health/hunger/sanity ≤ 20)
3. Regular status messages

### Status Bar Indicators
- Show clock icon next to hunger when it's meal time
- Show moon icon next to sanity when it's bedtime

---

## 📊 Data Structure (NocoDB)

**Add to `status` table:**
```json
{
  "biologicalClock": {
    "lastBreakfast": 1234567890,
    "lastLunch": 1234567890,
    "lastDinner": 1234567890,
    "lastSleep": 1234567890
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Pet gets hungry at 8 AM (breakfast)
- [ ] Pet gets hungry at 11 AM (lunch)
- [ ] Pet gets hungry at 6 PM (dinner)
- [ ] Pet gets sleepy at 10 PM
- [ ] Thought bubble shows meal time messages
- [ ] Thought bubble shows bedtime messages
- [ ] Hunger decreases -1 every 5 min if not fed
- [ ] Sanity decreases -1 every 5 min if not rested
- [ ] Feeding during meal time clears hungry state
- [ ] Resting during bedtime clears sleepy state
- [ ] Biological clock data saves to NocoDB
- [ ] Biological clock data loads on page refresh

---

## 🚀 Implementation Order

1. ✅ Create plan document
2. ⏳ Add biological clock state
3. ⏳ Implement time detection functions
4. ⏳ Add biological clock useEffect
5. ⏳ Add status penalty system
6. ⏳ Add biological clock messages
7. ⏳ Update getPetReaction priority
8. ⏳ Update feed/rest actions
9. ⏳ Add NocoDB save/load
10. ⏳ Test all scenarios
11. ⏳ Build and verify

---

## 💡 Future Enhancements

- Weekend vs weekday schedules
- Snack times between meals
- Nap time in afternoon
- Exercise time reminders
- Customizable meal times
- Timezone support
