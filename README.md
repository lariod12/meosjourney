# 🎮 RPG Character Sheet - Black & White Edition

Một trang web Single-Page Application (SPA) với thiết kế phong cách game/art/sketch để giới thiệu nhân vật RPG của bạn.

## ✨ Tính năng

### 🎨 Thiết kế

#### Theme Style Chủ Đạo: **Pure Black & White**
- **Màu sắc**: Chỉ sử dụng đen (#000000) và trắng (#ffffff) với các tông xám
- **KHÔNG có màu sắc**: Tuyệt đối không sử dụng bất kỳ màu nào khác (đỏ, xanh, vàng, v.v.)
- **Icons**: Chỉ sử dụng ký tự đặc biệt, symbols, và ASCII art - KHÔNG dùng emoji có màu
- **Phong cách**: Minimalist, Game Art, Sketch/Hand-drawn aesthetic
- **Layout**: Center-aligned với avatar nhân vật làm trung tâm
- **Responsive**: Tương thích với mọi thiết bị (Desktop, Tablet, Mobile)
- **Animations**: Hiệu ứng chuyển động mượt mà, không quá phức tạp
- **Typography**: Retro game fonts (Press Start 2P, VT323) cho cảm giác cổ điển

### 📊 Thông tin hiển thị

#### 1. **Character Info** (Thông tin nhân vật)
- Avatar nhân vật (sử dụng DiceBear API)
- Tên nhân vật
- Chức danh/Title
- Level hiện tại
- Experience Bar (XP) với progress bar động

#### 2. **Skills** (Kỹ năng)
- Hiển thị dạng grid 2 cột
- Mỗi skill có icon, tên và level
- Hover effect để tương tác
- Dễ dàng customize trong `script.js`

#### 3. **Interests** (Sở thích)
- Hiển thị dạng tags
- Icons đại diện cho từng sở thích
- Hover animation

#### 4. **Current Status** (Trạng thái hiện tại)
- Hiển thị hoạt động đang làm
- Location (vị trí hiện tại)
- Timestamp tự động cập nhật
- Animated status indicator

#### 5. **Daily Schedule** (Lịch trình hàng ngày)
- Timeline theo giờ
- Các hoạt động trong ngày
- Dễ đọc và theo dõi

#### 6. **Daily Quests** (Nhiệm vụ hàng ngày)
- Danh sách nhiệm vụ với checkbox
- Click để đánh dấu hoàn thành
- Progress counter (X/Y completed)
- Tự động cộng XP khi hoàn thành quest
- Visual feedback khi complete

#### 7. **Daily Journal** (Nhật ký hàng ngày)
- Ghi chú các sự kiện trong ngày
- Timestamp cho mỗi entry
- Tự động hiển thị ngày hiện tại

## 🚀 Cách sử dụng

### Cài đặt
1. Clone hoặc download project
2. Mở file `index.html` bằng trình duyệt web
3. Không cần cài đặt thêm gì cả!

### Customize thông tin nhân vật

Mở file `script.js` và chỉnh sửa object `characterData`:

```javascript
const characterData = {
    name: "SHADOW KNIGHT",           // Tên nhân vật
    title: "The Code Warrior",       // Chức danh
    level: 25,                        // Level
    currentXP: 6500,                  // XP hiện tại
    maxXP: 10000,                     // XP tối đa
    
    skills: [
        { name: "JavaScript", icon: "fa-code", level: "Lv. 90" },
        // Thêm skills của bạn...
    ],
    
    interests: [
        { name: "Gaming", icon: "fa-gamepad" },
        // Thêm interests của bạn...
    ],
    
    // ... các phần khác
};
```

### Thay đổi Avatar

Trong file `index.html`, tìm dòng:
```html
<img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=RPGCharacter&backgroundColor=ffffff&size=300" 
```

Thay đổi parameter `seed=RPGCharacter` thành tên khác để tạo avatar mới, hoặc thay thế bằng URL ảnh của bạn.

## 🎮 Tính năng tương tác

### Quest System
- **Click vào quest** để đánh dấu hoàn thành/chưa hoàn thành
- Mỗi quest hoàn thành sẽ được **+100 XP**
- Progress bar tự động cập nhật

### XP & Level System
- XP bar tự động tính toán phần trăm
- Khi đủ XP sẽ tự động **Level Up**
- Notification hiển thị khi level up

### Keyboard Shortcuts (Easter Eggs)
- **Press 'L'**: Thêm 500 XP (cheat code!)
- **Press 'R'**: Reset tất cả daily quests

## 📁 Cấu trúc file

```
blog-art-minimal/
│
├── index.html          # HTML structure
├── style.css           # Styling (Black & White theme)
├── script.js           # JavaScript logic & data
└── README.md           # Documentation (file này)
```

## 🛠️ Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**: Styling với animations
- **Vanilla JavaScript**: Logic và tương tác
- **Font Awesome 6.4.0**: Icons (chỉ dùng icons đen/trắng)
- **Google Fonts** (Handwritten Sketch Style):
  - **Architects Daughter** - Titles và headings (chữ viết tay sketch đậm)
  - **Kalam** - Body text chính (chữ viết tay tự nhiên)
  - **Patrick Hand** - Text phụ và labels (chữ viết tay mềm mại)
  - **Caveat** - Dự phòng
  - **Indie Flower** - Dự phòng
- **DiceBear API**: Avatar generation (pixel art black & white)

## 🎨 Customization Tips

### Theme Style Guidelines
**LƯU Ý QUAN TRỌNG**: Project này tuân thủ nghiêm ngặt theme **Pure Black & White**

#### Quy tắc thiết kế:
1. **Chỉ sử dụng màu đen, trắng và xám**
   - Không thêm bất kỳ màu sắc nào khác (đỏ, xanh, vàng, v.v.)
   - Tất cả elements phải là đen/trắng/xám

2. **Icons và Symbols**
   - Chỉ dùng ký tự đặc biệt: ▸ ◆ ⚛ ✎ ♪ ■ △ ◈ ⎇ ◉ ◐ ✈ </> { } ⟨/⟩ ▣
   - KHÔNG sử dụng emoji có màu (🎮 📍 ❤️ v.v.)
   - Ưu tiên ASCII art và geometric shapes

3. **Thay đổi màu sắc trong `style.css`**
   ```css
   :root {
       --black: #000000;
       --white: #ffffff;
       --gray-dark: #1a1a1a;
       --gray-medium: #333333;
       --gray-light: #cccccc;
   }
   ```
   **Chỉ điều chỉnh các giá trị này, không thêm màu mới!**

### Thêm/Xóa sections
Trong `index.html`, bạn có thể comment out hoặc xóa các sections không cần:
- `.stats-box`
- `.skills-box`
- `.interests-box`
- `.schedule-box`
- `.quests-box`
- `.journal-box`

### Thay đổi fonts
**LƯU Ý**: Chỉ sử dụng fonts có style handwritten/sketch để giữ theme nhất quán!

Fonts hiện tại (tất cả đều là handwritten sketch style):
- `Architects Daughter` - Cho titles, headings
- `Kalam` - Cho body text
- `Patrick Hand` - Cho text phụ

Để thay đổi, cập nhật trong `index.html` (Google Fonts link) và `style.css` (font-family).

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px (2 columns layout)
- **Tablet**: 768px - 1024px (1 column layout)
- **Mobile**: < 768px (optimized for small screens)

## 🐛 Troubleshooting

### Icons không hiển thị
- Kiểm tra kết nối internet (Font Awesome load từ CDN)
- Kiểm tra console log có lỗi không

### Avatar không load
- Kiểm tra kết nối internet (DiceBear API)
- Thay thế bằng local image nếu cần

### JavaScript không chạy
- Mở Developer Console (F12) để xem lỗi
- Đảm bảo `script.js` được load đúng

## 💡 Ý tưởng mở rộng

1. **Local Storage**: Lưu progress quests vào localStorage
2. **Dark Mode**: Đảo ngược màu (nền đen, chữ trắng) - vẫn giữ theme B&W
3. **Export Data**: Export character sheet thành PDF/Image
4. **Multiplayer**: Kết nối với backend để share character
5. **Achievements**: Hệ thống thành tựu khi hoàn thành quests
6. **Stats Chart**: Thêm radar chart cho skills (chỉ dùng đường đen/trắng)
7. **Animation**: Thêm particle effects, parallax scrolling (monochrome)

**LƯU Ý**: Mọi tính năng mở rộng phải tuân thủ theme Black & White!

## 📄 License

Free to use and modify for personal projects!

## 👨‍💻 Author

Created with ❤️ for RPG lovers and developers

---

**Enjoy your RPG Character Sheet! ⚔️🎮**

*Tip: Press F12 to open Developer Console and see the easter egg hints!*

