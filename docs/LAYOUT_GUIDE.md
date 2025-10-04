# Layout Guide - Two Column Design

## 📐 Bố cục mới (Version 3.0)

### Layout Structure:

```
┌─────────────────────────────────────────────────────────────┐
│                    CHARACTER PROFILE                        │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   LEFT SIDEBAR       │      RIGHT CONTENT                   │
│   (STICKY)           │      (SCROLLABLE)                    │
│                      │                                      │
│  ┌────────────────┐  │  ┌────────────────────────────────┐ │
│  │    AVATAR      │  │  │    CURRENT STATUS              │ │
│  │  ┌──────────┐  │  │  │  • Coding a new adventure      │ │
│  │  │          │  │  │  │  • Updated: Just now           │ │
│  │  │  IMAGE   │  │  │  └────────────────────────────────┘ │
│  │  │          │  │  │                                      │
│  │  └──────────┘  │  │  ┌────────────────────────────────┐ │
│  │ SHADOW KNIGHT  │  │  │    DAILY QUESTS                │ │
│  │ The Code War.. │  │  │  □ Complete 3 coding challenges│ │
│  └────────────────┘  │  │  ☑ Review 5 pull requests      │ │
│                      │  │  □ Write documentation         │ │
│  ┌────────────────┐  │  │  □ Learn a new algorithm       │ │
│  │    STATS       │  │  │  ☑ Exercise for 30 minutes     │ │
│  │  Level: 25     │  │  │  □ Read 1 chapter of book      │ │
│  │  XP: ████░░░   │  │  └────────────────────────────────┘ │
│  └────────────────┘  │                                      │
│                      │  ┌────────────────────────────────┐ │
│  ┌────────────────┐  │  │    DAILY JOURNAL               │ │
│  │    SKILLS      │  │  │  Thursday, October 4, 2025     │ │
│  │  ┌──┐  ┌──┐   │  │  │                                │ │
│  │  │{}│  │⚛ │   │  │  │  09:30 AM                      │ │
│  │  │JS│  │Re│   │  │  │  Started working on...         │ │
│  │  └──┘  └──┘   │  │  │                                │ │
│  │  ┌──┐  ┌──┐   │  │  │  02:15 PM                      │ │
│  │  │◆ │  │⟨/⟩│  │  │  │  Had a productive meeting...   │ │
│  │  │No│  │Py│   │  │  │                                │ │
│  │  └──┘  └──┘   │  │  └────────────────────────────────┘ │
│  └────────────────┘  │                                      │
│                      │                                      │
│  ┌────────────────┐  │                                      │
│  │   HOBBIES      │  │                                      │
│  │  ┌──┐  ┌──┐   │  │                                      │
│  │  │▲ │  │♪ │   │  │                                      │
│  │  │Ga│  │Mu│   │  │                                      │
│  │  └──┘  └──┘   │  │                                      │
│  │  ┌──┐  ┌──┐   │  │                                      │
│  │  │■ │  │✎ │   │  │                                      │
│  │  │Re│  │Ar│   │  │                                      │
│  │  └──┘  └──┘   │  │                                      │
│  └────────────────┘  │                                      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

## 🎯 Đặc điểm chính:

### Left Sidebar (380px width):
- **STICKY** - Luôn hiển thị khi scroll
- Chứa thông tin tĩnh của nhân vật:
  1. Avatar + Name + Title
  2. Stats (Level + XP)
  3. Skills (Grid 2x4)
  4. Hobbies (Grid 2x4)

### Right Content (Flexible width):
- **SCROLLABLE** - Nội dung có thể cuộn
- Chứa thông tin động/real-time:
  1. Current Status
  2. Daily Quests
  3. Daily Journal

## 📱 Responsive Behavior:

### Desktop (>1024px):
```
[LEFT SIDEBAR - 380px] [RIGHT CONTENT - Flexible]
```
- 2 cột song song
- Left sidebar sticky

### Tablet/Mobile (<1024px):
```
[LEFT SIDEBAR - Full width]
[RIGHT CONTENT - Full width]
```
- Chuyển thành 1 cột dọc
- Left sidebar không còn sticky
- Thứ tự: Avatar → Stats → Skills → Hobbies → Status → Quests → Journal

## 🎨 Skills & Hobbies Display:

### Skills Grid (2 columns):
```
┌─────────┬─────────┐
│   { }   │    ⚛    │
│   JS    │  React  │
├─────────┼─────────┤
│    ◆    │   ⟨/⟩   │
│  Node   │ Python  │
├─────────┼─────────┤
│    ▣    │    ⎇    │
│   DB    │   Git   │
├─────────┼─────────┤
│    ◈    │    △    │
│ Docker  │   AWS   │
└─────────┴─────────┘
```

### Hobbies Grid (2 columns):
```
┌─────────┬─────────┐
│    ▲    │    ♪    │
│ Gaming  │  Music  │
├─────────┼─────────┤
│    ■    │    ✎    │
│Reading  │   Art   │
├─────────┼─────────┤
│    ◉    │   </>   │
│ Coffee  │  Code   │
├─────────┼─────────┤
│    ◐    │    ✈    │
│ Design  │ Travel  │
└─────────┴─────────┘
```

## 🔧 Customization:

### Thay đổi độ rộng sidebar:
```css
.main-layout {
    grid-template-columns: 380px 1fr; /* Thay 380px */
}
```

### Thay đổi số cột Skills/Hobbies:
```css
.skills-grid,
.hobbies-grid {
    grid-template-columns: repeat(2, 1fr); /* Thay 2 thành 3, 4... */
}
```

### Tắt sticky sidebar:
```css
.left-sidebar {
    position: static; /* Thay vì sticky */
}
```

## ✨ Ưu điểm của layout mới:

1. **Tập trung vào nhân vật**: Avatar và thông tin cá nhân luôn hiển thị
2. **Dễ theo dõi**: Thông tin real-time ở bên phải, dễ cập nhật
3. **Tiết kiệm không gian**: Skills/Hobbies grid 2 cột gọn gàng
4. **Responsive tốt**: Tự động chuyển 1 cột trên mobile
5. **UX tốt hơn**: Sticky sidebar giúp luôn nhìn thấy thông tin quan trọng

## 🎮 Game-like Features:

- Avatar như character portrait trong RPG
- Skills/Hobbies như ability icons
- Stats với XP bar như game thật
- Quests với checkbox như quest log
- Journal như game diary

---

**Perfect for:** RPG character sheets, personal portfolios, developer profiles, gaming profiles

