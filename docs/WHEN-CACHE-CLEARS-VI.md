# Khi Nào Cache Được Xóa?

## 📋 Tóm Tắt

Hiện tại, `clearCache()` **KHÔNG được gọi tự động** trong code. Cache chỉ bị xóa trong các trường hợp sau:

## 🔄 Các Trường Hợp Cache Bị Xóa

### 1. ⏰ Tự Động Hết Hạn (Không Xóa, Chỉ Bỏ Qua)
**Khi:** Sau 5 phút kể từ lần lưu cache

**Cách hoạt động:**
```javascript
// Cache KHÔNG bị xóa, chỉ bị coi là "hết hạn"
if (now - timestamp < CACHE_DURATION) {
  // Dùng cache
} else {
  // Bỏ qua cache, fetch mới
}
```

**Lưu ý:** Cache vẫn còn trong localStorage, chỉ không được sử dụng nữa.

### 2. 🖱️ User Xóa Thủ Công
**Khi:** User tự xóa trong browser console

**Cách thực hiện:**
```javascript
// Trong browser console
localStorage.removeItem('meo_journey_home_cache');
```

### 3. 🧹 Browser Clear Data
**Khi:** User xóa browser data/cookies

**Các trường hợp:**
- Clear browsing data (Ctrl+Shift+Del)
- Clear site data trong DevTools
- Private/Incognito mode (không lưu cache)

### 4. 🔧 Developer Clear (Chưa Implement)
**Hiện tại:** KHÔNG có trong code

**Có thể thêm trong tương lai:**
```javascript
// Ví dụ: Xóa cache khi logout
const handleLogout = () => {
  clearCache();
  // ... logout logic
};

// Ví dụ: Xóa cache khi update data
const handleUpdateQuest = async (questData) => {
  await updateQuest(questData);
  clearCache(); // Force refresh
};
```

## 📊 Trạng Thái Hiện Tại

### Code Hiện Tại (App.jsx)
```jsx
const { data, loading } = useCharacterData(characterData);
//                        ↑
//                        Không destructure clearCache
```

**Nghĩa là:**
- ✅ Cache được tạo tự động
- ✅ Cache được sử dụng tự động
- ❌ KHÔNG có cách xóa cache từ UI
- ❌ KHÔNG có nút refresh thủ công

### Hook Có Sẵn (useCharacterData)
```javascript
return {
  data,
  loading,
  error,
  refetch,        // ← Force refresh (có sẵn nhưng chưa dùng)
  clearCache      // ← Xóa cache (có sẵn nhưng chưa dùng)
};
```

## 🎯 Khi Nào NÊN Xóa Cache?

### Scenario 1: User Update Data
**Vấn đề:**
```
1. User vào home page → Cache data (level: 5)
2. User vào /user/meos05 → Update level thành 6
3. User quay lại home page → Vẫn thấy level: 5 (từ cache)
```

**Giải pháp:** Xóa cache sau khi update
```javascript
// Trong DailyUpdatePage.jsx
const handleSaveStatus = async () => {
  await saveStatus(statusData);
  clearCache(); // Xóa cache để home page load data mới
  navigate('/');
};
```

### Scenario 2: Admin Update Data
**Vấn đề:**
```
1. User vào home page → Cache data
2. Admin update achievements/quests
3. User refresh → Vẫn thấy data cũ (từ cache)
```

**Giải pháp:** Xóa cache sau khi admin update
```javascript
// Trong AdminAchievementsPage.jsx
const handleSaveAchievement = async () => {
  await saveAchievement(data);
  clearCache(); // Xóa cache
  // User sẽ thấy data mới khi vào home page
};
```

### Scenario 3: Manual Refresh Button
**Vấn đề:** User muốn xem data mới ngay lập tức

**Giải pháp:** Thêm nút refresh
```jsx
// Trong HomePage
const { data, loading, refetch } = useCharacterData(characterData);

<button onClick={refetch}>
  🔄 Refresh Data
</button>
```

## 💡 Khuyến Nghị

### Option 1: Không Làm Gì (Hiện Tại)
**Ưu điểm:**
- Đơn giản
- Cache tự động hết hạn sau 5 phút
- Không cần code thêm

**Nhược điểm:**
- User có thể thấy data cũ trong 5 phút
- Không có cách force refresh

**Phù hợp khi:**
- Data ít thay đổi
- 5 phút delay chấp nhận được

### Option 2: Thêm Manual Refresh (Khuyến Nghị)
**Thêm vào App.jsx:**
```jsx
const HomePage = () => {
  const { data, loading, refetch } = useCharacterData(characterData);
  
  return (
    <CharacterProvider data={data}>
      <div className="bg-pattern"></div>
      <div className="container">
        <CharacterSheet onNavigateToNotes={() => navigate('/user/meos05')} />
        
        {/* Thêm nút refresh */}
        <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
          <button 
            onClick={refetch}
            style={{
              background: '#000',
              color: '#fff',
              border: '2px solid #000',
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </CharacterProvider>
  );
};
```

**Hoặc dùng CacheStatus component:**
```jsx
import CacheStatus from '../components/CacheStatus';

const { data, loading, refetch } = useCharacterData(characterData);

<CacheStatus onRefresh={refetch} />
```

### Option 3: Auto Clear Sau Update (Nâng Cao)
**Xóa cache tự động khi update data:**

```javascript
// Trong DailyUpdatePage.jsx
import { clearCache } from '../utils/cacheManager';

const handleSave = async () => {
  await saveStatus(statusData);
  clearCache(); // Xóa cache
  navigate('/'); // Về home sẽ fetch data mới
};
```

```javascript
// Trong AdminAchievementsPage.jsx
import { clearCache } from '../utils/cacheManager';

const handleSaveAchievement = async () => {
  await saveAchievement(data);
  clearCache(); // Xóa cache
};
```

## 🔍 Kiểm Tra Cache Hiện Tại

### Trong Browser Console:
```javascript
// Xem cache
const cache = localStorage.getItem('meo_journey_home_cache');
console.log(JSON.parse(cache));

// Xem tuổi cache
const { timestamp } = JSON.parse(cache);
const ageInSeconds = (Date.now() - timestamp) / 1000;
console.log(`Cache age: ${ageInSeconds} seconds`);

// Xóa cache thủ công
localStorage.removeItem('meo_journey_home_cache');
```

## 📝 Tóm Tắt

| Trường Hợp | Tự Động? | Hiện Tại |
|------------|----------|----------|
| Hết hạn sau 5 phút | ✅ Có | ✅ Hoạt động |
| User xóa thủ công | ❌ Không | ⚠️ Phải dùng console |
| Clear browser data | ✅ Có | ✅ Hoạt động |
| Sau khi update data | ❌ Không | ❌ Chưa implement |
| Nút refresh trong UI | ❌ Không | ❌ Chưa implement |

## 🎯 Kết Luận

**Hiện tại:** `clearCache()` chỉ được gọi thủ công qua console, KHÔNG có trong UI.

**Khuyến nghị:** Thêm nút refresh hoặc auto-clear sau update để UX tốt hơn.

**Nếu không thêm gì:** Cache vẫn hoạt động tốt, tự động hết hạn sau 5 phút.
