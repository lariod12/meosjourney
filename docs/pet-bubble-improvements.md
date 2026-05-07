# Pet Bubble System Improvements

## Ngày cập nhật: 2026-05-08

## Tổng quan
Cải thiện hệ thống bong bóng thoại của pet character để thông minh, tự nhiên và không spam liên tục.

---

## Vấn đề ban đầu

### Hành vi cũ:
- Bong bóng thoại xuất hiện **liên tục** mỗi 5 giây (quá nhiều)
- **Không quan tâm** user có đang xem trang hay không
- **Không phân biệt** trạng thái pet (critical hay stable đều hiện như nhau)
- Xuất hiện ngay cả khi user vừa tương tác với pet
- Cảm giác như spam, không tự nhiên

---

## Giải pháp đã implement

### 1. Smart Timing dựa theo trạng thái Pet

**Cấu hình:**
```javascript
timing: {
  critical: { minDelay: 15, maxDelay: 25, showChance: 0.9 },
  ''needs-care'': { minDelay: 30, maxDelay: 50, showChance: 0.75 },
  stable: { minDelay: 60, maxDelay: 100, showChance: 0.7 }
}
```

**Logic:**
- **Critical** (health/hunger/sanity < 30%): Hiện thường xuyên (15-25s, 90% chance)
- **Needs Care** (30-70%): Hiện vừa phải (30-50s, 75% chance)
- **Stable** (>70%): Hiện ít (60-100s, 70% chance)

**Lợi ích:**
- Pet yếu/đói/stress → nhắc nhở nhiều hơn
- Pet khỏe mạnh → ít làm phiền
- Phản ánh đúng tình trạng pet

---

### 2. Page Visibility API

**Code:**
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    setIsPageVisible(!document.hidden);
  };
  document.addEventListener(''visibilitychange'', handleVisibilityChange);
  return () => document.removeEventListener(''visibilitychange'', handleVisibilityChange);
}, []);
```

**Chức năng:**
- Phát hiện khi user **chuyển tab** hoặc **minimize browser**
- **Dừng timer** khi trang bị ẩn
- **Tiếp tục** khi user quay lại

**Lợi ích:**
- Tiết kiệm tài nguyên
- Chỉ hoạt động khi user thực sự xem
- Không lãng phí animation

---

### 3. Initial Delay

**Cấu hình:**
```javascript
initialDelaySeconds: 8
```

**Chức năng:**
- Đợi **8 giây** sau khi vào trang mới hiện bong bóng đầu tiên

**Lợi ích:**
- Cho user thời gian xem trang
- Không làm phiền ngay lập tức
- Trải nghiệm mượt mà hơn

---

### 4. Interaction Cooldown

**Cấu hình:**
```javascript
interactionCooldownSeconds: 12
```

**Code tracking:**
```javascript
// Trong handleConfirmUsePetItem, handleChooseActivityConfirm, handleChooseMoodConfirm:
lastInteractionRef.current = Date.now();
```

**Chức năng:**
- Ghi nhận thời điểm user tương tác (feed, care, change activity/mood)
- Đợi thêm **12 giây** sau tương tác mới hiện bong bóng

**Lợi ích:**
- Không làm phiền ngay sau khi user chăm pet
- Tôn trọng hành động của user
- Cảm giác tự nhiên hơn

---

### 5. Random Timing & Chance

**Code:**
```javascript
// Random delay trong khoảng min-max
const delaySeconds = timing.minDelay + Math.random() * (timing.maxDelay - timing.minDelay);

// Không phải lúc nào cũng hiện
if (Math.random() < timing.showChance) {
  setThoughtBubbleVisible(true);
} else {
  scheduleNextBubble(); // Skip cycle này
}
```

**Chức năng:**
- Thời gian xuất hiện **ngẫu nhiên** trong khoảng cho phép
- Đôi khi **bỏ qua** một chu kỳ (không hiện)

**Lợi ích:**
- Pet cảm giác sống động
- Không như robot với timing cố định
- Tự nhiên như pet thật

---

## So sánh trước và sau

| Tình huống | Trước | Sau |
|------------|-------|-----|
| Pet critical (health 20%) | Mỗi 5s | Mỗi 15-25s (90% chance) |
| Pet needs care (health 50%) | Mỗi 5s | Mỗi 30-50s (75% chance) |
| Pet stable (health 80%) | Mỗi 5s | Mỗi 60-100s (70% chance) |
| User chuyển tab | Vẫn chạy | Dừng hẳn |
| Vừa vào trang | Hiện ngay | Đợi 8s |
| Vừa cho ăn/care | Hiện ngay | Đợi thêm 12s |
| Timing | Cố định 5s | Random trong range |
| Tần suất | 100% mỗi cycle | 70-90% chance |

---

## Technical Implementation

### State & Refs mới:
```javascript
const [isPageVisible, setIsPageVisible] = useState(true);
const bubbleTimerRef = useRef(null);
const lastInteractionRef = useRef(Date.now());
```

### useEffect chính:
```javascript
useEffect(() => {
  if (!isPageVisible) {
    // Clear timers khi page hidden
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
    setThoughtBubbleVisible(false);
    return;
  }

  const scheduleNextBubble = () => {
    const timing = PET_THOUGHT_BUBBLE_OPTIONS.timing[petReaction.level];
    const delaySeconds = timing.minDelay + Math.random() * (timing.maxDelay - timing.minDelay);
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const cooldownMs = PET_THOUGHT_BUBBLE_OPTIONS.interactionCooldownSeconds * 1000;
    const additionalDelay = Math.max(0, cooldownMs - timeSinceInteraction);

    bubbleTimerRef.current = setTimeout(() => {
      if (Math.random() < timing.showChance) {
        setThoughtBubbleVisible(true);
        // ... hide after duration and schedule next
      } else {
        scheduleNextBubble();
      }
    }, delaySeconds * 1000 + additionalDelay);
  };

  // Initial delay
  const initialDelayMs = PET_THOUGHT_BUBBLE_OPTIONS.initialDelaySeconds * 1000;
  bubbleTimerRef.current = setTimeout(scheduleNextBubble, initialDelayMs);

  return () => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  };
}, [isPageVisible, petReaction.level]);
```

---

## Files Modified

- `src/features/pet/components/PetPage.jsx`
  - Added `PET_THOUGHT_BUBBLE_OPTIONS.timing` config
  - Added `isPageVisible`, `bubbleTimerRef`, `lastInteractionRef`
  - Added Page Visibility API useEffect
  - Replaced simple bubble timer with smart scheduling logic
  - Added interaction tracking in handlers

---

## Testing Checklist

- [ ] Pet critical → bong bóng xuất hiện thường xuyên (15-25s)
- [ ] Pet stable → bong bóng xuất hiện ít (60-100s)
- [ ] Chuyển tab → bong bóng dừng
- [ ] Quay lại tab → bong bóng tiếp tục
- [ ] Vừa vào trang → đợi 8s mới hiện
- [ ] Cho ăn/care → đợi 12s mới hiện bong bóng tiếp
- [ ] Timing ngẫu nhiên, không cố định
- [ ] Đôi khi skip cycle (không hiện)

---

## Future Improvements

- [ ] Thêm animation fade in/out mượt hơn cho bubble
- [ ] Thêm sound effect khi bubble xuất hiện (optional)
- [ ] Thêm hover pause: khi user hover pet area thì tạm dừng bubble
- [ ] Thêm message variation: nhiều message khác nhau cho cùng 1 trạng thái
- [ ] Thêm emoji/icon trong bubble tùy theo mood


---

## Pet Info Dropdown Animation (Added 2026-05-08)

### Tổng quan
Thêm hiệu ứng animation cho **pet info dropdown** (góc trên bên phải) khi pet được cho ăn hoặc chăm sóc.

### Vị trí
- **Pet info dropdown**: Phần hiển thị status nhỏ ở góc trên bên phải (100%, 88%, 72%)
- **KHÔNG PHẢI** phần status list lớn trong tab "Status"

### Hiệu ứng đã implement

#### 1. Info Item Pop Animation
```css
@keyframes infoItemPop {
  0% { transform: scale(1); }
  30% { transform: scale(1.15) rotate(-2deg); }
  60% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
}
```
**Hiệu ứng:** Item "bật" lên và xoay nhẹ khi giá trị tăng

#### 2. Label Brightness Pulse
```css
.pet-info-item--animating .pet-info-item__label {
  animation: barFillPulse 0.5s ease-in-out;
}
```
**Hiệu ứng:** Text % sáng lên rồi tối đi

#### 3. Plus sign Float Effect
```css
@keyframes infoPlus sign {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.3); }
  50% { opacity: 1; transform: translate(-50%, -8px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -16px) scale(0.5); }
}
```
**Hiệu ứng:** Icon + bay lên từ giữa item và biến mất

### Logic Implementation

**PetInfoDropdown Component:**
```javascript
const PetInfoDropdown = ({ expanded, onToggle, rows }) => {
  const [animatingKeys, setAnimatingKeys] = useState(new Set());
  const prevValuesRef = useRef({});

  useEffect(() => {
    const newAnimatingKeys = new Set();
    
    rows.forEach(({ key, value }) => {
      if (!PET_STATUS_KEYS.includes(key)) return;
      const prevValue = prevValuesRef.current[key];
      if (prevValue !== undefined && value > prevValue) {
        newAnimatingKeys.add(key);
      }
      prevValuesRef.current[key] = value;
    });

    if (newAnimatingKeys.size > 0) {
      setAnimatingKeys(newAnimatingKeys);
      setTimeout(() => {
        setAnimatingKeys(new Set());
      }, 600);
    }
  }, [rows]);

  // Render với animation class và Plus sign icon
};
```

### Timing
- **Pop animation:** 500ms
- **Plus sign animation:** 700ms
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce effect)

### Trigger Conditions
- Chỉ trigger khi giá trị status **tăng** (không trigger khi giảm)
- So sánh với giá trị trước đó qua `prevValuesRef`
- Mỗi status (health, hunger, sanity) độc lập
- Hoạt động cả khi dropdown đang đóng

### Visual Effects
1. **Info item:** Scale + rotate nhẹ (pop bounce)
2. **Label text:** Sáng lên (brightness pulse)
3. **Plus sign icon (+):** Bay lên từ giữa item

### Files Modified
- `src/features/pet/styles/pet.css` - Thêm animations cho pet-info-item
- `src/features/pet/components/PetPage.jsx` - Cập nhật PetInfoDropdown component

### User Experience
- **Cho ăn** → Hunger badge (icon 🍲) nhảy + Plus sign +
- **Chăm sóc** → Health/Sanity badges nhảy + Plus sign +
- **Nhiều status tăng cùng lúc** → Tất cả đều animate
- **Phản hồi trực quan** ngay tại góc màn hình
- **Không cần mở dropdown** để thấy animation

### Testing
- [ ] Cho ăn → Hunger badge (icon 🍲) animate
- [ ] Chăm sóc → Health/Sanity badges animate
- [ ] Plus sign icon xuất hiện và biến mất
- [ ] Animation không trigger khi status giảm
- [ ] Nhiều badges có thể animate cùng lúc
- [ ] Animation mượt mà, không giật
- [ ] Hoạt động cả khi dropdown đóng


### Animation Timing Sequence

**Thứ tự animation khi cho ăn/chăm sóc:**

1. **0ms - 3000ms**: Food/Care effect animation chạy
   - Icon bay vào pet
   - Pet "ăn" item
   
2. **3000ms**: Food/Care effect kết thúc

3. **3000ms - 3600ms**: Pet Info Dropdown animation bắt đầu
   - Badge pop + xoay
   - Text % sáng lên
   - Dấu "+" bay lên

**Tổng thời gian:** 3.6 giây (3s food/care + 0.6s info animation)

**Lý do:** Đợi food/care effect hoàn thành trước khi hiện thị kết quả tăng status, tránh animation chồng chéo.
