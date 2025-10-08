# Achievement Tab Feature

## Tổng Quan
Tab "Achievement" (Bảng Thành Tựu) đã được thêm vào phần right-content, hiển thị các thành tựu của nhân vật dưới dạng grid layout với modal dialog khi click.

## Vị Trí
- Tab "Achievement" nằm sau tab "History" trong phần right-content
- Thứ tự tabs: DAILY QUESTS → DAILY JOURNAL → HISTORY → **ACHIEVEMENT**

## Tính Năng

### 1. Grid Layout
- Hiển thị các achievement items dưới dạng lưới (CSS Grid)
- Mỗi item bao gồm:
  - **Icon**: Ký tự ASCII/symbol lớn (★ ⚛ ◆ ✎ ⚔ ♪ ▲ ◐)
  - **Name**: Tên achievement bên dưới icon
- Grid responsive tự động điều chỉnh theo kích thước màn hình

### 2. Modal Dialog (Click Interaction)
Khi click vào một achievement item:
- Modal dialog xuất hiện ở giữa màn hình
- Background overlay màu đen mờ (rgba(0, 0, 0, 0.8))
- Hiển thị thông tin chi tiết:
  - **Icon**: Lớn hơn, có animation bounce
  - **Title**: Tên achievement (uppercase)
  - **Description**: Mô tả chi tiết cách đạt được
  - **Reward**: Phần thưởng EXP

### 3. Đóng Modal
Có 3 cách để đóng modal:
- Click vào nút **✕** ở góc trên bên phải
- Click vào background overlay (vùng tối bên ngoài modal)
- Nhấn phím **ESC** trên bàn phím

## Dữ Liệu Mẫu

Hiện tại có 8 achievements mẫu:

1. **First Steps** (★) - Complete your first daily quest (+50 EXP)
2. **Code Master** (⚛) - Complete 100 coding challenges (+200 EXP)
3. **Team Player** (◆) - Review 50 pull requests (+150 EXP)
4. **Knowledge Seeker** (✎) - Read 10 technical books (+300 EXP)
5. **Health Warrior** (⚔) - Exercise for 30 consecutive days (+250 EXP)
6. **Creative Mind** (♪) - Create 20 unique artworks (+180 EXP)
7. **Level Up** (▲) - Reach Level 25 (+500 EXP)
8. **Night Owl** (◐) - Complete 5 quests after midnight (+100 EXP)

## Cách Thêm Achievement Mới

Mở file `script.js` và thêm vào mảng `characterData.achievements`:

```javascript
{
    id: 9,
    name: "Achievement Name",
    icon: "★",  // Chỉ dùng ASCII symbols: ★ ◆ ⚛ ✎ ♪ ⚔ ▸ ▲ ◐
    description: "Mô tả chi tiết cách đạt được achievement này",
    reward: "+XXX EXP"
}
```

## Style Guidelines

### Colors (Chỉ Đen Trắng)
- Background: `#ffffff` (white)
- Border/Text: `#000000` (black)
- Grayscale: `#1a1a1a`, `#333333`, `#cccccc`
- **KHÔNG** sử dụng màu khác (red, blue, yellow, etc.)

### Icons
- **CHỈ** sử dụng ký tự ASCII/symbols
- Ví dụ: ★ ◆ ⚛ ✎ ♪ ⚔ ▸ ▲ ◐ ✓ ⚡
- **KHÔNG** dùng emoji màu (🏆 ❤️ 💙)

### Fonts
- **Title**: 'Architects Daughter' (uppercase, bold)
- **Description**: 'Kalam' (body text)
- **Reward**: 'Patrick Hand' (secondary text)

### Hover Effects
- Achievement item hover: background đen, text trắng
- Icon scale + rotate khi hover
- Border dashed xuất hiện
- Transform translateY(-5px) + box-shadow

### Modal Animations
- **Fade in**: Background overlay
- **Slide up**: Modal content từ dưới lên
- **Bounce**: Icon animation khi modal mở
- **Rotate**: Close button khi hover

## Responsive Design

### Desktop (> 1024px)
- Grid: `repeat(auto-fill, minmax(140px, 1fr))`
- Icon size: 3rem
- Modal: max-width 500px

### Tablet (768px - 1024px)
- Grid: `repeat(auto-fill, minmax(120px, 1fr))`
- Icon size: 2.5rem
- Modal: padding 25px

### Mobile (< 480px)
- Grid: `repeat(2, 1fr)` (2 cột cố định)
- Icon size: 2rem
- Modal: max-width 90%, padding 20px

## Files Modified

1. **index.html**
   - Thêm tab button "ACHIEVEMENT"
   - Thêm tab content `#achievementsTab`
   - Thêm modal structure

2. **script.js**
   - Thêm `achievements` array vào `characterData`
   - Thêm `populateAchievements()` function
   - Thêm `showAchievementModal()` function
   - Thêm `closeAchievementModal()` function
   - Setup modal event listeners

3. **style.css**
   - Thêm `.achievements-grid` styles
   - Thêm `.achievement-item` styles
   - Thêm `.achievement-modal` styles
   - Thêm responsive breakpoints

## Testing

Để test tính năng:

1. Mở `index.html` trong trình duyệt
2. Click vào tab "ACHIEVEMENT"
3. Click vào bất kỳ achievement item nào
4. Modal sẽ hiển thị với thông tin chi tiết
5. Test các cách đóng modal (X button, background click, ESC key)
6. Test responsive bằng cách resize browser window

## Notes

- Modal sử dụng `position: fixed` để luôn ở giữa viewport
- Z-index của modal là 9999 để đảm bảo hiển thị trên tất cả elements
- Click event được add vào từng achievement item riêng biệt
- Modal content được populate động từ achievement data
- Animations sử dụng CSS transitions và keyframes

