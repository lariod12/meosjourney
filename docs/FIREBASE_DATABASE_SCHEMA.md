# Firebase Database Schema - RPG Character Sheet

Tài liệu này mô tả cấu trúc Collections và Documents cần tạo trong Firestore Database của Firebase cho project RPG Character Sheet.

**Lưu ý**: Website này chỉ có **1 owner duy nhất**, mọi người khác truy cập dưới dạng **guest** (public read-only).

---

## 📦 Collections Overview

```
firestore/
├── profile/ (collection)
│   └── owner (document - thông tin cá nhân)
├── quests/ (collection - nhiệm vụ hàng ngày)
├── journal/ (collection - nhật ký hàng ngày)
├── achievements/ (collection - thành tựu)
├── history/ (collection - lịch sử theo ngày)
└── config/ (collection)
    └── settings (document - cấu hình hệ thống)
```

---

## 1️⃣ Collection: `profile`

Lưu trữ thông tin cá nhân của owner (chỉ có 1 document duy nhất).

### Document ID: `owner` (fixed ID)

### Document Structure:

```javascript
{
  // Thông tin cơ bản
  name: "MÉO",                    // string
  caption: "Forever Curious",     // string
  level: 25,                      // number
  currentXP: 6500,               // number
  maxXP: 10000,                  // number
  
  // Skills (array of objects)
  skills: [
    { name: "Photoshop" },
    { name: "Illustrator" },
    { name: "Drawing" },
    { name: "Video Editing" },
    { name: "Animation" },
    { name: "Clip Studio Paint" },
    { name: "CapCut" },
    { name: "Motion Graphics" }
  ],
  
  // Interests/Hobbies (array of objects)
  interests: [
    { name: "Gaming" },
    { name: "Music" },
    { name: "Reading" },
    { name: "Art" },
    { name: "Food" },
    { name: "Design" },
    { name: "Travel" }
  ],
  
  // Current Status
  status: {
    doing: "Studying character design", // string
    location: "Home",                   // string
    mood: "Focused",                    // string
    timestamp: Timestamp               // Firestore Timestamp
  },
  
  // Character Introduction
  introduce: "A creative artist who brings imagination to life...", // string (long text)
  
  // Avatar
  avatarURL: "https://...",           // string (URL to uploaded image)
  
  // Social Links
  socialLinks: {
    facebook: "https://facebook.com/yourprofile",
    instagram: "https://instagram.com/yourprofile",
    tiktok: "https://tiktok.com/@yourprofile",
    youtube: "https://youtube.com/@yourprofile",
    email: "your.email@gmail.com"
  },
  
  // Metadata
  createdAt: Timestamp,               // Firestore Timestamp
  updatedAt: Timestamp                // Firestore Timestamp
}
```

---

## 2️⃣ Collection: `quests`

Lưu trữ danh sách nhiệm vụ hàng ngày (public read, owner write).

### Document ID: `{questId}` (auto-generated hoặc custom ID: quest_001, quest_002, ...)

### Document Structure:

```javascript
{
  id: 1,                                          // number
  title: "Complete 3 coding challenges",         // string
  completed: false,                              // boolean
  xp: 150,                                       // number
  createdAt: Timestamp,                          // Firestore Timestamp
  completedAt: Timestamp | null,                 // Firestore Timestamp (null nếu chưa hoàn thành)
  date: "2025-10-11"                             // string (YYYY-MM-DD)
}
```

### Ví dụ dữ liệu:

```javascript
// Document ID: quest_001
{
  id: 1,
  title: "Complete 3 coding challenges",
  completed: false,
  xp: 150,
  createdAt: Timestamp.now(),
  completedAt: null,
  date: "2025-10-11"
}

// Document ID: quest_002
{
  id: 2,
  title: "Review 5 pull requests",
  completed: true,
  xp: 100,
  createdAt: Timestamp.now(),
  completedAt: Timestamp.now(),
  date: "2025-10-11"
}
```

---

## 3️⃣ Collection: `journal`

Lưu trữ nhật ký hàng ngày (public read, owner write).

### Document ID: `{entryId}` (auto-generated)

### Document Structure:

```javascript
{
  time: "07:00 AM",                              // string
  entry: "Woke up early feeling energized...",   // string (long text)
  date: "2025-10-11",                            // string (YYYY-MM-DD)
  timestamp: Timestamp,                          // Firestore Timestamp
  createdAt: Timestamp                           // Firestore Timestamp
}
```

### Ví dụ dữ liệu:

```javascript
// Document ID: auto-generated
{
  time: "07:00 AM",
  entry: "Woke up early feeling energized. Morning coffee and planning out today's tasks.",
  date: "2025-10-11",
  timestamp: Timestamp.now(),
  createdAt: Timestamp.now()
}

// Document ID: auto-generated
{
  time: "08:30 AM",
  entry: "Quest Completed: Exercise for 30 minutes (+80 XP)",
  date: "2025-10-11",
  timestamp: Timestamp.now(),
  createdAt: Timestamp.now()
}
```

---

## 4️⃣ Collection: `achievements`

Lưu trữ danh sách thành tựu (public read, owner write).

### Document ID: `{achievementId}` (custom ID: achievement_001, achievement_002, ...)

### Document Structure:

```javascript
{
  id: 1,                                         // number
  name: "First Steps",                           // string
  icon: "★",                                     // string (emoji/symbol)
  description: "Complete your first daily quest and begin your journey",  // string
  specialReward: "Unlock 'Beginner' title",      // string (optional)
  exp: 50,                                       // number
  completed: true,                               // boolean
  completedAt: Timestamp | null,                 // Firestore Timestamp (null nếu chưa hoàn thành)
  createdAt: Timestamp                           // Firestore Timestamp
}
```

### Ví dụ dữ liệu:

```javascript
// Document ID: achievement_001
{
  id: 1,
  name: "First Steps",
  icon: "★",
  description: "Complete your first daily quest and begin your journey",
  specialReward: "Unlock 'Beginner' title",
  exp: 50,
  completed: true,
  completedAt: Timestamp.now(),
  createdAt: Timestamp.now()
}

// Document ID: achievement_002
{
  id: 2,
  name: "Code Master",
  icon: "⚛",
  description: "Successfully complete 100 coding challenges",
  specialReward: "Unlock 'Code Wizard' badge",
  exp: 200,
  completed: false,
  completedAt: null,
  createdAt: Timestamp.now()
}
```

---

## 5️⃣ Collection: `history`

Lưu trữ lịch sử hoạt động theo ngày (public read, owner write).

### Document ID: `{dateString}` (format: YYYY-MM-DD, ví dụ: "2025-10-10")

### Document Structure:

```javascript
{
  date: Timestamp,                               // Firestore Timestamp (ngày)
  entries: [                                     // array of objects
    {
      time: "07:30 AM",                         // string
      entry: "Morning run to start the day..."  // string
    },
    {
      time: "09:00 AM",
      entry: "Quest Completed: Complete 3 coding challenges (+150 XP)"
    }
    // ... more entries
  ],
  createdAt: Timestamp                          // Firestore Timestamp
}
```

### Ví dụ dữ liệu:

```javascript
// Document ID: "2025-10-10"
{
  date: Timestamp.fromDate(new Date("2025-10-10")),
  entries: [
    {
      time: "07:30 AM",
      entry: "Morning run to start the day fresh. The weather was perfect!"
    },
    {
      time: "09:00 AM",
      entry: "Quest Completed: Complete 3 coding challenges (+150 XP)"
    },
    {
      time: "11:30 AM",
      entry: "Pair programming session with team member. Learned some cool new tricks!"
    }
  ],
  createdAt: Timestamp.now()
}
```

---

## 6️⃣ Collection: `config`

Lưu trữ thông tin cấu hình hệ thống (public read, owner write).

### Document ID: `settings`

### Document Structure:

```javascript
{
  version: "1.0",                               // string
  defaultAvatar: "https://api.dicebear.com/...", // string
  maxQuestsPerDay: 6,                           // number
  xpMultiplier: 1.5,                            // number
  createdAt: Timestamp,                         // Firestore Timestamp
  updatedAt: Timestamp                          // Firestore Timestamp
}
```

---

## 📊 Indexes cần tạo

Để tối ưu hóa query performance, tạo các indexes sau trong Firestore:

### 1. Quests Index
- **Collection:** `quests`
- **Fields:** 
  - `date` (Ascending)
  - `createdAt` (Descending)

### 2. Journal Index
- **Collection:** `journal`
- **Fields:**
  - `date` (Descending)
  - `timestamp` (Ascending)

### 3. History Index
- **Collection:** `history`
- **Fields:**
  - `date` (Descending)

### 4. Achievements Index
- **Collection:** `achievements`
- **Fields:**
  - `completed` (Ascending)
  - `exp` (Descending)

---

## 🔐 Security Rules

**Quan trọng**: Tất cả dữ liệu đều **public read** (guest có thể xem), chỉ **owner** mới được **write**.

### Cách 1: Sử dụng Firebase Authentication (Khuyến nghị)

Owner đăng nhập bằng email/password, lưu UID trong environment variables.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Hàm kiểm tra owner (thay YOUR_OWNER_UID bằng UID thật của bạn)
    function isOwner() {
      return request.auth != null && request.auth.uid == 'YOUR_OWNER_UID';
    }
    
    // Profile collection - public read, owner write
    match /profile/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
    
    // Quests collection - public read, owner write
    match /quests/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
    
    // Journal collection - public read, owner write
    match /journal/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
    
    // Achievements collection - public read, owner write
    match /achievements/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
    
    // History collection - public read, owner write
    match /history/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
    
    // Config collection - public read, owner write
    match /config/{document} {
      allow read: if true;
      allow write: if isOwner();
    }
  }
}
```

### Cách 2: Admin panel riêng (Đơn giản hơn)

Nếu không muốn dùng Authentication, tạo một admin panel riêng với mật khẩu đơn giản (client-side check).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tất cả collections: public read, chỉ write qua Firebase Console
    match /{collection}/{document=**} {
      allow read: if true;
      allow write: if false; // Chỉ được sửa trực tiếp qua Firebase Console
    }
  }
}
```

**Lưu ý Cách 2**: Owner sẽ phải vào Firebase Console để cập nhật dữ liệu thủ công, hoặc tạo một admin panel riêng với Cloud Functions.

---

## 🚀 Cách tạo Database trong Firebase Console

### Bước 1: Tạo Firestore Database
1. Vào Firebase Console → chọn project
2. Chọn **Firestore Database** từ menu bên trái
3. Click **Create database**
4. Chọn **Start in production mode** (sẽ cấu hình Security Rules sau)
5. Chọn location (chọn gần người dùng nhất, ví dụ: `asia-southeast1`)

### Bước 2: Tạo Collection và Documents mẫu

#### Tạo Collection `profile`:
```
1. Click "Start collection"
2. Collection ID: profile
3. Document ID: owner
4. Add fields theo cấu trúc ở trên (name, caption, level, currentXP, ...)
```

#### Tạo Collection `quests`:
```
1. Click "Start collection"
2. Collection ID: quests
3. Document ID: quest_001
4. Add fields theo cấu trúc quest ở trên
```

#### Tạo Collection `journal`:
```
1. Click "Start collection"
2. Collection ID: journal
3. Document ID: (auto-generate)
4. Add fields theo cấu trúc journal ở trên
```

#### Tạo Collection `achievements`:
```
1. Click "Start collection"
2. Collection ID: achievements
3. Document ID: achievement_001
4. Add fields theo cấu trúc achievement ở trên
```

#### Tạo Collection `history`:
```
1. Click "Start collection"
2. Collection ID: history
3. Document ID: 2025-10-10
4. Add fields theo cấu trúc history ở trên
```

#### Tạo Collection `config`:
```
1. Click "Start collection"
2. Collection ID: config
3. Document ID: settings
4. Add fields theo cấu trúc config ở trên
```

### Bước 3: Cấu hình Security Rules
1. Vào tab **Rules**
2. Copy/paste Security Rules ở trên
3. Click **Publish**

### Bước 4: Tạo Indexes
1. Vào tab **Indexes**
2. Click **Create index**
3. Tạo từng index theo danh sách ở trên

---

## 📝 Ghi chú

- **Timestamp**: Sử dụng `firebase.firestore.Timestamp.now()` khi tạo/cập nhật
- **Date Format**: Sử dụng format `YYYY-MM-DD` cho trường `date` (string)
- **Document ID**: Có thể để Firebase auto-generate hoặc dùng custom ID
- **Subcollections**: Tự động tạo khi thêm document đầu tiên
- **Backup**: Nên setup scheduled backups cho production database

---

## 🔗 Tài liệu tham khảo

- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
