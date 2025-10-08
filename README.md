# 🎮 RPG Character Sheet - Black & White Edition

Một trang web Single-Page Application (SPA) với thiết kế phong cách game/art/sketch để giới thiệu nhân vật RPG của bạn.

## ✨ Tính năng

### 🎨 Thiết kế

#### Theme Style Chủ Đạo: **Pure Black & White**
- **Màu sắc**: Chỉ sử dụng đen (#000000) và trắng (#ffffff) với các tông xám
- **KHÔNG có màu sắc**: Tuyệt đối không sử dụng bất kỳ màu nào khác (đỏ, xanh, vàng, v.v.)
- **Icons**: Chỉ sử dụng ký tự đặc biệt, symbols, và ASCII art - KHÔNG dùng emoji có màu
- **Phong cách**: Minimalist, Game Art, Sketch/Hand-drawn aesthetic
- **Layout**: Two-column grid (380px left sidebar, 1fr right content) với sticky sidebar
- **Responsive**: Tương thích với mọi thiết bị (Desktop, Tablet, Mobile)
- **Animations**: Hiệu ứng chuyển động mượt mà, không quá phức tạp
- **Typography**: Handwritten sketch fonts (Architects Daughter, Kalam, Patrick Hand)

### 📊 Thông tin hiển thị

#### 1. **Character Info** (Thông tin nhân vật)
- Avatar nhân vật (sử dụng DiceBear API)
- Tên nhân vật
- Chức danh/Title
- Level hiện tại
- Experience Bar (XP) với progress bar động

#### 2. **Status, Introduce, Skills & Hobbies** (Left Sidebar)
Hệ thống 4 tabs trong left sidebar:
- **Tab Status** (mặc định):
  - Hiển thị hoạt động đang làm
  - Location (vị trí hiện tại)
  - Mood (trạng thái cảm xúc)
  - Timestamp tự động cập nhật
  - Animated status indicator
- **Tab Introduce**:
  - Giới thiệu bản thân nhân vật
  - Styled với dashed border
- **Tab Skills**:
  - Hiển thị dạng tags
  - Hover effect để tương tác
  - Dễ dàng customize trong `script.js`
- **Tab Hobbies**:
  - Hiển thị dạng tags
  - Hover animation

#### 3. **Daily Quests** (Nhiệm vụ hàng ngày)
- Danh sách nhiệm vụ (read-only)
- Progress counter (X/Y completed)
- Hiển thị XP cho mỗi quest
- Visual feedback cho completed quests

#### 4. **Daily Journal** (Nhật ký hàng ngày)
- Ghi chú các sự kiện trong ngày
- Timestamp cho mỗi entry
- Tự động hiển thị ngày hiện tại

#### 5. **History** (Lịch sử)
- Lưu trữ journal entries của các ngày trước
- Click để expand/collapse từng ngày
- Hiển thị theo định dạng tương tự Daily Journal

#### 6. **Achievement** (Bảng Thành Tựu) 🆕
- Hiển thị các thành tựu dưới dạng grid layout
- Click vào achievement để xem chi tiết trong modal dialog
- Mỗi achievement có: icon, tên, mô tả, và phần thưởng EXP
- Modal có thể đóng bằng: nút X, click background, hoặc phím ESC
- Xem chi tiết: `docs/ACHIEVEMENT_FEATURE.md`

## 🚀 Cách sử dụng

### Cài đặt
1. Clone hoặc download project
2. Mở file `index.html` bằng trình duyệt web
3. Không cần cài đặt thêm gì cả!

### Customize thông tin nhân vật

Mở file `script.js` và chỉnh sửa object `characterData`:

```javascript
const characterData = {
    name: "MÉO",                      // Tên nhân vật
    title: "Forever Curious",         // Chức danh
    level: 25,                        // Level
    currentXP: 6500,                  // XP hiện tại
    maxXP: 10000,                     // XP tối đa
    
    skills: [
        { name: "Photoshop" },
        { name: "Illustrator" },
        // Thêm skills của bạn...
    ],
    
    interests: [
        { name: "Gaming" },
        { name: "Music" },
        // Thêm interests của bạn...
    ],
    
    introduce: "A creative artist...", // Giới thiệu bản thân
    
    // ... các phần khác
};
```

### Thay đổi Avatar

**Cách 1: Sử dụng avatar riêng**
1. Đặt file ảnh vào folder `/public/avatars/`
2. Đặt tên file là `avatar.png`, `avatar.jpg`, `avatar.jpeg`, `avatar.gif`, hoặc `avatar.webp`
3. Script sẽ tự động tìm và load avatar của bạn

**Cách 2: Thay đổi DiceBear seed**
- Nếu không có avatar trong `/public/avatars/`, hệ thống sẽ dùng DiceBear API
- Thay đổi seed trong `script.js` dòng 219: `seed=RPGCharacter` thành tên khác

## 🎮 Tính năng tương tác

### Tab Switching
- **Left Sidebar**: Chuyển đổi giữa Status, Introduce, Skills, và Hobbies
- **Right Content**: Chuyển đổi giữa Daily Quests, Daily Journal, History, và Achievement

### History Expansion
- **Click vào history date header** để expand/collapse journal entries của ngày đó
- Chỉ một item được expand tại một thời điểm

### Achievement Modal
- **Click vào achievement item** để mở modal dialog với thông tin chi tiết
- **Đóng modal**: Click nút X, click background, hoặc nhấn phím ESC
- Modal hiển thị: icon lớn, tên, mô tả chi tiết, và phần thưởng EXP

### XP & Level System
- XP bar tự động tính toán phần trăm
- Khi đủ XP sẽ tự động **Level Up**
- Notification hiển thị khi level up

### Keyboard Shortcuts (Easter Eggs)
- **Press 'L'**: Thêm 500 XP (cheat code!)
- **Press 'ESC'**: Đóng achievement modal (nếu đang mở)

## 📁 Cấu trúc file

```
blog-art-minimal/
│
├── index.html          # HTML structure
├── style.css           # Styling (Black & White theme)
├── script.js           # JavaScript logic & data
├── public/
│   └── avatars/        # Đặt avatar riêng tại đây
├── docs/               # Documentation files
│   ├── ACHIEVEMENT_FEATURE.md      # Achievement tab documentation
│   ├── CHANGELOG.md                # Version history
│   └── CSS-HEIGHT-MANAGEMENT.md   # CSS height guide
├── .augment/
│   └── rules/
│       └── AGENTS.md   # AI coding assistant instructions
└── README.md           # Documentation (file này)
```

**📝 LƯU Ý QUAN TRỌNG**:
- **Tất cả các file `.md` documentation phải được đặt trong folder `docs/`**
- **KHÔNG** để các file `.md` (trừ README.md) ở ngoài root directory
- File `AGENTS.md` nằm trong `.augment/rules/` (quy tắc cho AI assistant)

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

### Chỉnh chiều cao các sections
Trong `style.css`, bạn có thể điều chỉnh chiều cao của các sections:
- `.status-box` (line 229): Chiều cao của Status/Introduce/Skills/Hobbies tabs
- `.daily-activities-section` (line 329): Chiều cao của Quests/Journal/History tabs

Xem file `docs/CSS-HEIGHT-MANAGEMENT.md` để biết thêm chi tiết.

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

## � Documentation

Tất cả documentation được lưu trong folder `docs/`:

- **`docs/ACHIEVEMENT_FEATURE.md`**: Hướng dẫn chi tiết về tab Achievement
  - Cách thêm achievement mới
  - Cấu trúc dữ liệu
  - Customization tips
  - Modal dialog system

- **`docs/CSS-HEIGHT-MANAGEMENT.md`**: Hướng dẫn quản lý chiều cao các sections
  - Điều chỉnh chiều cao status box
  - Điều chỉnh chiều cao daily activities
  - Responsive height management

- **`docs/CHANGELOG.md`**: Lịch sử thay đổi và cập nhật
  - Version history
  - Feature updates
  - Bug fixes

**📝 Quy tắc Documentation**:
- Tất cả file `.md` (trừ `README.md`) phải được đặt trong folder `docs/`
- Không để file documentation ở root directory
- Sử dụng naming convention: `UPPERCASE-WITH-HYPHENS.md`

## �🐛 Troubleshooting

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
5. ~~**Achievements**: Hệ thống thành tựu khi hoàn thành quests~~ ✅ **ĐÃ HOÀN THÀNH**
9. **Achievement Unlock**: Animation khi unlock achievement mới

**LƯU Ý**: Mọi tính năng mở rộng phải tuân thủ theme Black & White!

## 📄 License

Free to use and modify for personal projects!

## 👨‍💻 Author

Created with ❤️ for RPG lovers and developers

---

**Enjoy your RPG Character Sheet! ⚔️🎮**

*Tip: Press F12 to open Developer Console and press 'L' for XP boost!*

