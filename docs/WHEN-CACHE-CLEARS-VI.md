# Khi Nào Cache Được Xóa?

## Tóm Tắt

Hiện tại dự án không còn dùng cache dữ liệu home page kiểu cũ (`meo_journey_home_cache`). NocoDB service chỉ giữ cache tạm trong bộ nhớ cho các request đang chạy, cộng thêm hai timestamp trong localStorage để chống spam request và giảm lỗi rate limit.

Vì vậy "xóa cache" trong code hiện tại chủ yếu có nghĩa là gọi `clearNocoDBCache` để xóa danh sách request đang pending, rồi fetch lại dữ liệu.
Riêng NocoDB API request dùng `cache: 'no-store'` mặc định để browser không tái sử dụng response cũ.

## Các Loại Cache Hiện Có

| Loại | Nơi lưu | Tự hết hạn? | Dùng để |
| --- | --- | --- | --- |
| `pendingRequests` | Bộ nhớ runtime | Có, khi request xong | Tránh gọi trùng request cùng key |
| `meo_noco_last_request_time` | localStorage | Không tự xóa | Ghi nhớ lần request gần nhất để throttle |
| `meo_noco_penalty_until` | localStorage | Bị bỏ qua khi thời gian đã qua | Ghi nhớ thời điểm hết penalty sau rate limit |
| Pet Page Cache Storage | Browser Cache API | Xóa khi mở/refresh Pet Page | Giảm tình trạng mobile browser giữ dữ liệu/asset Pet Page cũ |

Không có cache dữ liệu 5 phút cho toàn bộ home page trong source hiện tại.

## Khi Nào Cache Được Xóa Trong Code?

### 1. Khi Gọi `clearNocoDBCache`

Hàm này nằm trong `src/services/nocodb.js` và xóa `pendingRequests`.

Các luồng đang dùng:

- User page reload sau submit quest/achievement.
- User page cập nhật profile/status/journal/media và phát event refresh khi cần.
- Admin page refresh dữ liệu.
- Admin page approve quest/achievement để ép home page lấy XP/trạng thái mới.

### 2. Khi Request Hoàn Thành

Mỗi request được đưa vào `pendingRequests` bằng `deduplicateRequest`. Khi promise resolve hoặc reject, key đó được xóa tự động.

Điều này giúp:

- Nhiều component gọi cùng một dữ liệu không tạo nhiều request song song.
- React StrictMode trong development không làm spam NocoDB quá mạnh.

### 3. Khi Developer Xóa Timing Keys Thủ Công

Nếu đang debug rate limit, có thể xóa hai key throttle:

```javascript
localStorage.removeItem('meo_noco_last_request_time');
localStorage.removeItem('meo_noco_penalty_until');
```

Không cần xóa `meo_journey_home_cache` vì key đó không còn được dùng.

### 4. Khi Mở Hoặc Refresh Pet Page

Pet Page gọi `clearNocoDBCache` trước khi load `pet` và `events`, đồng thời xóa các Cache Storage entry liên quan app/pet nếu browser hỗ trợ Cache API.
Sau đó Pet Page mới fetch lại dữ liệu để giảm tình trạng F5 hoặc refresh trên điện thoại vẫn dính cache cũ.

## Refresh Event Hiện Tại

### `meo:refresh`

`src/App.jsx` lắng nghe event này và gọi `refetch(true)` từ `useCharacterData`.

```javascript
window.dispatchEvent(new Event('meo:refresh'));
```

### `photoalbum:refresh`

`PhotoAlbumTab.jsx` lắng nghe event này để reload album.

```javascript
window.dispatchEvent(new Event('photoalbum:refresh'));
```

## Khi Nào Nên Gọi Refresh?

| Tình huống | Nên làm |
| --- | --- |
| Cập nhật status/profile | Gọi `clearNocoDBCache` và dispatch `meo:refresh` |
| Submit quest/achievement | Reload submissions, clear NocoDB cache, dispatch `meo:refresh` |
| Admin approve/reject | Clear NocoDB cache, reload admin list, refresh home if XP/status đổi |
| Upload photo album | Dispatch `photoalbum:refresh` sau khi save thành công |
| Chỉ đọc dữ liệu | Không cần clear cache |

## Điểm Cần Nhớ

- Cache hiện tại là in-memory request dedupe, không phải persisted data cache.
- `clearNocoDBCache` không xóa localStorage timing keys.
- Staging và production xử lý ảnh giống nhau: ưu tiên `signedUrl`.
- Development có thể dùng `signedPath`/`path` và dựng URL từ `VITE_NOCODB_BASE_URL`.
- Nếu thấy dữ liệu home chưa cập nhật, kiểm tra mutation flow có dispatch `meo:refresh` chưa.

## File Liên Quan

- `src/services/nocodb.js`
- `src/hooks/useCharacterData.js`
- `src/App.jsx`
- `src/pages/UserPage/UserPage.jsx`
- `src/pages/AdminPage/AdminPage.jsx`
- `docs/CACHE-SYSTEM.md`
