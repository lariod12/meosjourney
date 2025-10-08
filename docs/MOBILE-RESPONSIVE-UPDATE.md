# Mobile Responsive Update

## Tổng Quan
Cập nhật responsive design để hỗ trợ tốt hơn cho các thiết bị mobile nhỏ, đặc biệt là iPhone 12 Pro (390x844px) và các thiết bị tương tự.

## Vấn Đề Đã Sửa

### 1. **UI Tràn Ra Ngoài Character Sheet**
- **Vấn đề**: Trên mobile, `.character-sheet` có border và box-shadow lớn làm content tràn ra ngoài viewport
- **Giải pháp**: 
  - Giảm padding của `.container` và `.character-sheet`
  - Giảm border width từ 5px → 3px (430px) → 2px (375px)
  - Giảm box-shadow từ 8px → 4px → 3px
  - Thêm `overflow: hidden` và `box-sizing: border-box`

### 2. **Breakpoints Không Phù Hợp**
- **Vấn đề**: Chỉ có breakpoint 480px, không đủ cho các thiết bị hiện đại
- **Giải pháp**: Thêm 2 breakpoints mới:
  - `@media (max-width: 430px)` - iPhone 12 Pro, iPhone 13/14/15
  - `@media (max-width: 375px)` - iPhone SE, iPhone 12 mini

## Breakpoints Mới

### 1. **Desktop** (> 1024px)
- Layout 2 cột
- Full features
- Padding: 20px

### 2. **Tablet** (768px - 1024px)
- Layout 1 cột
- Padding: 15px

### 3. **Mobile Large** (431px - 767px)
- Padding: 10px
- Font sizes giảm nhẹ

### 4. **Mobile Medium** (376px - 430px) 🆕
**Target: iPhone 12 Pro (390px), iPhone 13/14/15**
- Container padding: 8px
- Character sheet padding: 12px
- Border: 3px
- Box-shadow: 4px 4px
- Avatar: 140px
- Title: 1.1rem
- Status box height: 240px
- Daily activities height: 550px

### 5. **Mobile Small** (≤ 375px) 🆕
**Target: iPhone SE (375px), iPhone 12 mini**
- Container padding: 6px
- Character sheet padding: 10px
- Border: 2px
- Box-shadow: 3px 3px
- Avatar: 120px
- Title: 1rem
- Status box height: 220px
- Daily activities height: 500px

## Chi Tiết Thay Đổi

### Container & Character Sheet
```css
/* Base */
.container {
    width: 100%;
    box-sizing: border-box;
}

.character-sheet {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}

/* Mobile Medium (≤430px) */
.container { padding: 8px; }
.character-sheet {
    padding: 12px;
    border-width: 3px;
    box-shadow: 4px 4px 0 var(--black), ...;
}

/* Mobile Small (≤375px) */
.container { padding: 6px; }
.character-sheet {
    padding: 10px;
    border-width: 2px;
    box-shadow: 3px 3px 0 var(--black), ...;
}
```

### Header & Title
```css
/* Mobile Medium */
.title-sketch {
    font-size: 1.1rem;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0 var(--gray-light);
}

.decorative-line {
    max-width: 100%;
    height: 2px;
}

/* Mobile Small */
.title-sketch {
    font-size: 1rem;
    letter-spacing: 0.5px;
}
```

### Avatar
```css
/* Mobile Medium */
.avatar-container { padding: 12px; }
.avatar-frame {
    max-width: 140px;
    height: 140px;
    border-width: 2px;
    box-shadow: 3px 3px 0 var(--black);
}

/* Mobile Small */
.avatar-frame {
    max-width: 120px;
    height: 120px;
}
```

### XP Bar
```css
/* Mobile Medium */
.xp-bar {
    height: 24px;
}

.level-label {
    font-size: 0.75rem;
    padding: 0 10px;
}

.xp-text {
    font-size: 0.75rem;
}
```

### Status Box
```css
/* Mobile Medium */
.status-box {
    height: 240px;
    padding: 8px;
}

.status-tab-btn {
    padding: 6px 8px;
    font-size: 0.75rem;
}

.status-content {
    padding: 10px;
    gap: 5px;
}

/* Mobile Small */
.status-box {
    height: 220px;
}
```

### Daily Activities
```css
/* Mobile Medium */
.daily-activities-section {
    height: 550px;
    padding: 12px;
}

.tab-btn {
    padding: 8px 10px;
    font-size: 0.8rem;
    border-right-width: 2px;
}

/* Mobile Small */
.daily-activities-section {
    height: 500px;
}

.tab-btn {
    padding: 6px 8px;
    font-size: 0.75rem;
}
```

### Quests
```css
/* Mobile Medium */
.quest-progress {
    font-size: 1.1rem;
    padding: 8px;
}

.quest-item {
    padding: 10px;
    border-width: 2px;
}

.quest-text {
    font-size: 1rem;
}

.quest-xp {
    font-size: 0.85rem;
    padding: 3px 8px;
}

/* Mobile Small */
.quest-item {
    padding: 8px;
}

.quest-text {
    font-size: 0.95rem;
}
```

### Achievement Grid
```css
/* Mobile Medium */
.achievements-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 10px;
}

.achievement-item {
    min-height: 90px;
    padding: 10px 6px;
    border-width: 2px;
}

.achievement-icon {
    font-size: 1.8rem;
}

.achievement-name {
    font-size: 0.75rem;
}
```

### Achievement Modal
```css
/* Mobile Medium */
.achievement-modal {
    padding: 10px;
}

.achievement-modal-content {
    padding: 18px;
    max-width: 92%;
    border-width: 3px;
    box-shadow: 6px 6px 0 var(--black);
}

.achievement-modal-close {
    width: 28px;
    height: 28px;
    font-size: 1.1rem;
    border-width: 2px;
}

.achievement-modal-icon {
    font-size: 3rem;
}

.achievement-modal-title {
    font-size: 1.2rem;
}

.achievement-modal-description {
    font-size: 0.95rem;
}

.achievement-modal-reward {
    font-size: 1rem;
    padding: 8px 12px;
}
```

### Footer & Social Links
```css
/* Mobile Medium */
.footer-title {
    font-size: 0.9rem;
    letter-spacing: 1px;
}

.social-link {
    min-width: 65px;
    padding: 8px 10px;
    border-width: 2px;
}

.social-link i {
    font-size: 1.1rem;
}

.social-link span {
    font-size: 0.7rem;
}

/* Mobile Small */
.social-link {
    min-width: 60px;
    padding: 6px 8px;
}

.social-link i {
    font-size: 1rem;
}

.social-link span {
    font-size: 0.65rem;
}
```

## Testing Checklist

### iPhone 12 Pro (390x844px)
- ✅ Character sheet không tràn ra ngoài
- ✅ Avatar hiển thị đúng kích thước
- ✅ Tabs dễ click
- ✅ Text dễ đọc
- ✅ Achievement grid 2 cột
- ✅ Modal hiển thị đẹp
- ✅ Footer social links vừa vặn

### iPhone SE (375x667px)
- ✅ Layout compact hơn
- ✅ Tất cả elements vừa màn hình
- ✅ Không có horizontal scroll
- ✅ Text vẫn đọc được

### iPhone 12 mini (360x780px)
- ✅ Tương tự iPhone SE
- ✅ Chiều cao đủ cho content

## Lưu Ý

1. **Box-sizing**: Tất cả elements đều dùng `box-sizing: border-box`
2. **Overflow**: Body và character-sheet có `overflow-x: hidden`
3. **Width**: Container và character-sheet có `width: 100%`
4. **Padding**: Giảm dần theo kích thước màn hình
5. **Border & Shadow**: Giảm để tiết kiệm không gian
6. **Font sizes**: Giảm nhẹ nhưng vẫn đọc được

## Files Modified

- `style.css`: Thêm 2 breakpoints mới và cập nhật responsive styles

