# Icon Picker Component

Component tìm kiếm và chọn icon từ thư viện react-icons.

## Sử dụng

```jsx
import IconPicker from './components/IconPicker/IconPicker';

<IconPicker
  value={formData.icon}
  onChange={handleChange}
  placeholder="Search icons..."
/>
```

## Tính năng

- Tìm kiếm icon theo tên (ví dụ: trophy, star, medal, heart)
- Hiển thị tối đa 50 icon phù hợp
- Preview icon đã chọn
- Hỗ trợ nhiều thư viện icon: FontAwesome, Material Design, Ionicons, Bootstrap Icons, v.v.

## Icon Libraries

- **Fa** - FontAwesome
- **Md** - Material Design
- **Io** - Ionicons 5
- **Bi** - Bootstrap Icons
- **Ai** - Ant Design Icons
- **Bs** - Bootstrap Icons
- **Fi** - Feather Icons
- **Gi** - Game Icons
- **Hi** - Hero Icons 2
- **Ri** - Remix Icons

## Ví dụ tìm kiếm

- "trophy" → FaTrophy, MdEmojiEvents, GiTrophy
- "star" → FaStar, MdStar, AiFillStar
- "heart" → FaHeart, MdFavorite, AiFillHeart
- "medal" → FaMedal, GiMedal
