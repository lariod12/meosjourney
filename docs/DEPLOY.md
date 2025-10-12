# Deployment Guide - GitHub Pages

## 🚀 Hướng Dẫn Deploy Lên GitHub Pages

### Tự Động Deploy Với GitHub Actions (Khuyến Nghị)

#### Bước 1: Cấu Hình GitHub Pages

1. Vào repository trên GitHub: `https://github.com/lariod12/blog-art-minimal`
2. Click vào **Settings** tab
3. Trong sidebar bên trái, click **Pages**
4. Trong phần **Build and deployment**:
   - **Source**: Chọn **GitHub Actions** (thay vì Deploy from a branch)
   - GitHub sẽ tự động detect workflow file

#### Bước 2: Push Code

```bash
# Commit tất cả thay đổi
git add .
git commit -m "Migrate to React + Vite with GitHub Actions deployment"

# Push lên main branch
git push origin main
```

#### Bước 3: Theo Dõi Deployment

1. Vào tab **Actions** trong GitHub repo
2. Bạn sẽ thấy workflow "Deploy to GitHub Pages" đang chạy
3. Đợi workflow hoàn thành (thường mất 2-3 phút)
4. Sau khi hoàn thành, site sẽ có tại: `https://lariod12.github.io/blog-art-minimal`

### Workflow Tự Động Làm Gì?

GitHub Actions workflow (`.github/workflows/deploy.yml`) sẽ:

1. ✅ Checkout code từ main branch
2. ✅ Cài đặt pnpm và Node.js
3. ✅ Install dependencies với pnpm
4. ✅ Build production với code obfuscation
5. ✅ Upload build artifacts
6. ✅ Deploy lên GitHub Pages

**Mỗi lần push lên main branch, workflow tự động chạy lại!**

---

## 🛠️ Deploy Thủ Công (Alternative)

Nếu bạn muốn deploy thủ công từ local machine:

### Cách 1: Dùng gh-pages Package

```bash
# Build và deploy
pnpm run deploy
```

Script này sẽ:
- Build production (`pnpm run build`)
- Push folder `dist/` lên branch `gh-pages`

### Cách 2: Manual Build & Push

```bash
# Build production
pnpm run build

# Deploy folder dist/ lên branch gh-pages
npx gh-pages -d dist
```

---

## ⚙️ Cấu Hình Quan Trọng

### 1. Base Path (vite.config.js)

```js
base: mode === 'production' ? '/blog-art-minimal/' : '/'
```

- Trong development: base = `/` (localhost)
- Trong production: base = `/blog-art-minimal/` (GitHub Pages subdirectory)

**Lưu ý**: Nếu bạn dùng custom domain (vd: `example.com`), đổi thành `base: '/'`

### 2. Homepage (package.json)

```json
"homepage": "https://lariod12.github.io/blog-art-minimal"
```

### 3. .nojekyll File

File `.nojekyll` ở root để GitHub Pages không xử lý Vite build như Jekyll site.

---

## 🔍 Troubleshooting

### Issue: Site không load, blank page

**Nguyên nhân**: Base path không đúng

**Giải pháp**:
```js
// vite.config.js
base: '/blog-art-minimal/'  // Phải khớp với tên repo
```

### Issue: CSS/JS không load (404 errors)

**Nguyên nhân**: Assets path không đúng

**Giải pháp**:
- Kiểm tra `base` trong vite.config.js
- Build lại: `pnpm run build`

### Issue: Workflow fails

**Nguyên nhân**: Permissions không đúng

**Giải pháp**:
1. Vào **Settings** > **Actions** > **General**
2. Scroll xuống **Workflow permissions**
3. Chọn **Read and write permissions**
4. Chọn **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### Issue: 404 khi refresh page

**Nguyên nhân**: GitHub Pages không support client-side routing

**Giải pháp**: Thêm file `404.html` redirect về `index.html` (không cần cho single page app đơn giản)

---

## 📊 Kiểm Tra Deployment

### 1. Check Build Locally

```bash
# Build production
pnpm run build

# Preview production build
pnpm run preview
```

Mở `http://localhost:4173` để xem production build

### 2. Check GitHub Actions

Vào `https://github.com/lariod12/blog-art-minimal/actions` để xem:
- ✅ Workflow status
- 📝 Build logs
- ⏱️ Deploy time

### 3. Check Live Site

Site live tại: `https://lariod12.github.io/blog-art-minimal`

---

## 🔄 Update Site Sau Khi Deploy

Mỗi khi bạn muốn update site:

```bash
# 1. Make changes to code
# 2. Commit changes
git add .
git commit -m "Update: your changes"

# 3. Push to trigger auto-deploy
git push origin main

# 4. Wait 2-3 minutes for workflow to complete
# 5. Site tự động update!
```

---

## 🚀 Deploy Lần Đầu - Checklist

- [ ] Đã cài gh-pages: `pnpm add -D gh-pages`
- [ ] Đã config `base` trong vite.config.js
- [ ] Đã set `homepage` trong package.json
- [ ] Đã tạo `.nojekyll` file
- [ ] Đã push workflow file: `.github/workflows/deploy.yml`
- [ ] Đã bật GitHub Pages trong Settings > Pages
- [ ] Đã chọn Source = GitHub Actions
- [ ] Đã set Workflow permissions = Read and write
- [ ] Đã push code lên main branch
- [ ] Đã check Actions tab để xem workflow
- [ ] Đã test site live

---

## 📝 Notes

- **Build time**: ~30 giây
- **Deploy time**: ~1-2 phút
- **Total time**: ~2-3 phút từ push đến live
- **Cost**: Miễn phí (GitHub Pages free tier)
- **Bandwidth**: Unlimited
- **SSL**: Tự động enable HTTPS

---

**Deployment URL**: https://lariod12.github.io/blog-art-minimal

**GitHub Repo**: https://github.com/lariod12/blog-art-minimal

🎉 Happy Deploying!
