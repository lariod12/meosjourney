# CSS Height Management Guide

## 📐 Quản lý chiều cao trong CSS

### Vấn đề: Khi có `max-height`, làm sao thay đổi chiều cao?

Khi một element đã có `max-height`, việc chỉ thay đổi `max-height` sẽ **KHÔNG** thay đổi chiều cao thực tế của element nếu content bên trong nhỏ hơn giá trị `max-height`.

---

## ✅ Giải pháp: Sử dụng kết hợp `min-height` và `max-height`

### Cách hoạt động:

```css
.status-box {
    min-height: 250px;  /* Chiều cao tối thiểu */
    max-height: 350px;  /* Chiều cao tối đa */
    overflow: hidden;   /* Ẩn phần tràn */
}
```

### Giải thích:

1. **`min-height`**: Element sẽ luôn có chiều cao **ít nhất** bằng giá trị này, ngay cả khi content ít
2. **`max-height`**: Element sẽ **không cao hơn** giá trị này, scrollbar xuất hiện khi content nhiều
3. **Kết hợp cả 2**: Tạo ra chiều cao cố định hoặc linh hoạt trong khoảng cho phép

---

## 📊 So sánh các cách set height:

### 1. Chỉ dùng `height` (Cố định)
```css
.box {
    height: 350px;
}
```
- ✅ Chiều cao cố định 350px
- ❌ Không linh hoạt
- ❌ Content tràn nếu quá dài

### 2. Chỉ dùng `max-height` (Linh hoạt nhưng không kiểm soát được min)
```css
.box {
    max-height: 350px;
}
```
- ✅ Tự động co lại nếu content ít
- ❌ Không kiểm soát được chiều cao tối thiểu
- ❌ Box có thể quá nhỏ nếu content ít

### 3. Dùng `min-height` + `max-height` (Linh hoạt và kiểm soát)
```css
.box {
    min-height: 250px;
    max-height: 350px;
}
```
- ✅ Chiều cao tối thiểu 250px
- ✅ Chiều cao tối đa 350px
- ✅ Tự động điều chỉnh trong khoảng 250px - 350px
- ✅ Scrollbar xuất hiện khi content > 350px

### 4. Dùng `min-height` = `max-height` (Giống height cố định)
```css
.box {
    min-height: 350px;
    max-height: 350px;
}
```
- ✅ Chiều cao cố định 350px
- ✅ Scrollbar xuất hiện khi content tràn
- ✅ Tương đương `height: 350px` nhưng rõ ràng hơn

---

## 🎯 Áp dụng trong project

### 1. `.status-box` (Left Sidebar)

**Vị trí:** `style.css` - dòng 222-232

```css
.status-box {
    border: 3px solid var(--black);
    padding: 10px;
    background: var(--white);
    position: relative;
    min-height: 250px;  /* ← CHỈNH Ở ĐÂY để thay đổi chiều cao tối thiểu */
    max-height: 350px;  /* ← CHỈNH Ở ĐÂY để thay đổi chiều cao tối đa */
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
```

### 2. `.daily-activities-section` (Right Content)

**Vị trí:** `style.css` - dòng 322-333

```css
.daily-activities-section {
    padding: 15px;
    border: 3px solid var(--black);
    background: var(--white);
    margin-bottom: 15px;
    min-height: 400px;  /* ← CHỈNH Ở ĐÂY để thay đổi chiều cao tối thiểu */
    max-height: 600px;  /* ← CHỈNH Ở ĐÂY để thay đổi chiều cao tối đa */
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
```

**Lưu ý:** `.daily-activities-section` nằm trong `.right-content`, cần đảm bảo:
- `.right-content` có `min-height: 0` để cho phép flex item scroll
- `.tab-content-wrapper` có `flex: 1`, `overflow-y: auto`, `min-height: 0`

### Cách thay đổi chiều cao:

#### A. Status Box (Left Sidebar)

**Muốn box cao hơn:**
```css
min-height: 300px;  /* Tăng từ 250px */
max-height: 400px;  /* Tăng từ 350px */
```

**Muốn box thấp hơn:**
```css
min-height: 200px;  /* Giảm từ 250px */
max-height: 300px;  /* Giảm từ 350px */
```

**Muốn chiều cao cố định:**
```css
min-height: 350px;  /* Cùng giá trị */
max-height: 350px;  /* Cùng giá trị */
```

#### B. Daily Activities Section (Right Content)

**Muốn section cao hơn:**
```css
min-height: 500px;  /* Tăng từ 400px */
max-height: 700px;  /* Tăng từ 600px */
```

**Muốn section thấp hơn:**
```css
min-height: 300px;  /* Giảm từ 400px */
max-height: 500px;  /* Giảm từ 600px */
```

**Muốn chiều cao cố định:**
```css
min-height: 500px;  /* Cùng giá trị */
max-height: 500px;  /* Cùng giá trị */
```

---

## 🔧 Kết hợp với Flexbox và Scroll

Để scrollbar hoạt động đúng trong flexbox container:

### Cấu trúc cho Status Box (Left Sidebar):

```css
/* Parent container */
.status-box {
    min-height: 250px;
    max-height: 350px;
    display: flex;
    flex-direction: column;
    overflow: hidden;  /* Ẩn overflow ở parent */
}

/* Child wrapper - nơi scroll thực sự xảy ra */
.status-tab-content-wrapper {
    flex: 1;           /* Chiếm toàn bộ không gian còn lại */
    overflow-y: auto;  /* Scrollbar xuất hiện ở đây */
    min-height: 0;     /* Quan trọng! Cho phép flex item scroll */
}
```

### Cấu trúc cho Daily Activities (Right Content):

```css
/* Grandparent - Right Content Column */
.right-content {
    display: flex;
    flex-direction: column;
    gap: 25px;
    min-height: 0;     /* Quan trọng! Cho phép children scroll */
}

/* Parent container */
.daily-activities-section {
    min-height: 400px;
    max-height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;  /* Ẩn overflow ở parent */
}

/* Child wrapper - nơi scroll thực sự xảy ra */
.tab-content-wrapper {
    flex: 1;           /* Chiếm toàn bộ không gian còn lại */
    overflow-y: auto;  /* Scrollbar xuất hiện ở đây */
    min-height: 0;     /* Quan trọng! Cho phép flex item scroll */
}
```

### Tại sao cần `min-height: 0` ở child?

- Mặc định, flex items có `min-height: auto`
- Điều này ngăn không cho flex item nhỏ hơn content
- Set `min-height: 0` cho phép flex item scroll khi content tràn

---

## 📝 Tóm tắt

### Quy tắc vàng:

1. **Muốn thay đổi chiều cao khi đã có `max-height`**:
   - ✅ Thay đổi `min-height` để điều chỉnh chiều cao tối thiểu
   - ✅ Thay đổi `max-height` để điều chỉnh chiều cao tối đa

2. **Muốn chiều cao cố định**:
   - Set `min-height` = `max-height`

3. **Muốn chiều cao linh hoạt**:
   - Set `min-height` < `max-height`

4. **Khi dùng với Flexbox + Scroll**:
   - Parent: `overflow: hidden`
   - Child wrapper: `flex: 1`, `overflow-y: auto`, `min-height: 0`

---

## 🎨 Ví dụ thực tế

### Case 1: Box có chiều cao cố định 300px
```css
.box {
    min-height: 300px;
    max-height: 300px;
    overflow-y: auto;
}
```

### Case 2: Box tự động co giãn từ 200px đến 400px
```css
.box {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
}
```

### Case 3: Box tối thiểu 150px, không giới hạn tối đa
```css
.box {
    min-height: 150px;
    /* Không có max-height */
}
```

### Case 4: Box tối đa 500px, không giới hạn tối thiểu
```css
.box {
    /* Không có min-height */
    max-height: 500px;
    overflow-y: auto;
}
```

---

## 🚨 Lưu ý quan trọng

1. **Đơn vị đo**: Nên dùng `px` cho height cố định, `%` hoặc `vh` cho responsive
2. **Overflow**: Luôn set `overflow-y: auto` hoặc `overflow: hidden` khi dùng max-height
3. **Flexbox**: Nhớ set `min-height: 0` cho flex items cần scroll
4. **Testing**: Luôn test với content nhiều và ít để đảm bảo hoạt động đúng

---

**Ngày tạo**: 2025-01-05  
**Áp dụng cho**: `.status-box` trong `style.css`  
**Tác giả**: Blog Art Minimal Project

