# Hướng dẫn Setup Discord Notification

Tài liệu này hướng dẫn cách thiết lập Discord webhook để nhận thông báo khi user submit quest trong Meo's Journey.

## 🚀 Tính năng

Khi user submit quest thành công, hệ thống sẽ tự động gửi thông báo đến Discord channel với thông tin:
- Tên quest đã hoàn thành
- Mô tả cách hoàn thành
- XP nhận được
- Thông tin character (tên, level)
- Hình ảnh proof (nếu có)
- Thông báo level up (nếu có)

## 📋 Yêu cầu

- Discord server với quyền admin
- Channel để nhận thông báo
- Webhook URL

## 🔧 Cách thiết lập

### Bước 1: Tạo Discord Webhook

1. **Vào Discord server** của bạn
2. **Chọn channel** muốn nhận thông báo
3. **Click vào Settings** (⚙️) của channel
4. **Chọn "Integrations"** → **"Webhooks"**
5. **Click "Create Webhook"**
6. **Đặt tên** cho webhook (ví dụ: "Meo's Journey Bot")
7. **Copy Webhook URL** (dạng: `https://discord.com/api/webhooks/...`)

### Bước 2: Cấu hình trong Code

Mở file `src/services/discord.js` và thay thế các giá trị sau:

```javascript
const DISCORD_CONFIG = {
  // Thay thế bằng Webhook URL thực tế
  WEBHOOK_URL: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN'
};
```

**Lưu ý**: Bot name và avatar sẽ tự động sử dụng từ Discord bot settings, không cần cấu hình thêm.

### Bước 3: Test kết nối

Để test xem webhook có hoạt động không, bạn có thể:

1. **Mở Developer Console** trong browser (F12)
2. **Chạy lệnh test:**
```javascript
import { testDiscordWebhook } from './src/services/discord.js';
testDiscordWebhook();
```

Hoặc tạo một quest và submit để test thực tế.

## 🎨 Tùy chỉnh thông báo

### Thay đổi màu sắc embed

Trong file `discord.js`, bạn có thể thay đổi màu của embed:

```javascript
// Quest submission - màu đen
color: 0x000000

// Achievement - màu vàng
color: 0xFFD700  

// Level up - màu xanh lá
color: 0x00FF00
```

### Thay đổi nội dung thông báo

Bạn có thể tùy chỉnh:
- **Title**: Tiêu đề thông báo
- **Description**: Mô tả chính
- **Fields**: Các trường thông tin
- **Footer**: Chân trang

### Thêm mention user

Để mention user khi có thông báo:

```javascript
const payload = {
  content: '<@USER_ID>', // Mention user
  username: DISCORD_CONFIG.BOT_NAME,
  avatar_url: DISCORD_CONFIG.BOT_AVATAR,
  embeds: [embed]
};
```

## 🔒 Bảo mật

### Bảo vệ Webhook URL

- **Không commit** webhook URL vào Git
- **Sử dụng environment variables** cho production:

```javascript
const DISCORD_CONFIG = {
  WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || 'YOUR_DISCORD_WEBHOOK_URL_HERE',
  // ...
};
```

### Rate Limiting

Discord có giới hạn:
- **30 requests per minute** cho webhook
- **5 requests per second** burst

Hệ thống hiện tại chỉ gửi khi user submit quest nên không lo về rate limit.

## 🐛 Troubleshooting

### Webhook không hoạt động

1. **Kiểm tra URL**: Đảm bảo webhook URL đúng format
2. **Kiểm tra permissions**: Bot cần quyền gửi message trong channel
3. **Kiểm tra console**: Xem error logs trong browser console
4. **Test webhook**: Dùng tool như Postman để test trực tiếp

### Thông báo không hiển thị đúng

1. **Kiểm tra embed format**: Discord có giới hạn về độ dài text
2. **Kiểm tra image URL**: Hình ảnh phải public và accessible
3. **Kiểm tra character encoding**: Đảm bảo text không có ký tự đặc biệt

### Error 429 (Rate Limited)

- **Giảm tần suất** gửi thông báo
- **Thêm delay** giữa các request
- **Cache** thông báo và gửi batch

## 📊 Monitoring

### Logs

Hệ thống sẽ log các hoạt động:
- ✅ Thành công: `Discord notification sent successfully`
- ❌ Lỗi: `Discord webhook failed: [status] [error]`
- ⚠️ Cảnh báo: `Discord webhook URL not configured`

### Analytics

Bạn có thể track:
- Số lượng quest được submit
- Tần suất level up
- User activity patterns

## 🔄 Nâng cấp

### Sử dụng Discord Bot thay vì Webhook

Để có nhiều tính năng hơn, bạn có thể:
1. Tạo Discord Bot application
2. Thêm bot vào server
3. Sử dụng Discord.js library
4. Implement slash commands, reactions, etc.

### Database logging

Lưu lại lịch sử thông báo:
```javascript
// Thêm vào firestore.js
export const saveNotificationLog = async (type, data) => {
  // Save notification history
};
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Verify webhook URL
3. Test với tool external
4. Check Discord server permissions

---

**Lưu ý**: Webhook URL là thông tin nhạy cảm, không chia sẻ công khai!