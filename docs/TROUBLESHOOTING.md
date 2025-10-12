# Troubleshooting Guide

## Common Issues and Solutions

### ❌ Issue 1: Blank Page on GitHub Pages

**Symptoms:**
- Page loads but shows blank white screen
- Console shows 404 errors for CSS/JS files
- Example: `GET /blog-art-minimal/assets/index.css 404`

**Cause:**
Base path in `vite.config.js` doesn't match repository name.

**Solution:**
```js
// vite.config.js
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/YOUR-REPO-NAME/' : '/',
  // ...
}));
```

**Example:**
- Repo: `github.com/username/meosjourney`
- Base: `/meosjourney/` ✅
- Base: `/blog-art-minimal/` ❌ (wrong name)

---

### ❌ Issue 2: Avatar Not Loading (404)

**Symptoms:**
- Avatar shows fallback DiceBear image
- Console shows: `GET /public/avatars/avatar.png 404`

**Cause:**
Incorrect path to public assets in Vite.

**Wrong:**
```js
fetch('/public/avatars/avatar.png')  // ❌ Wrong
```

**Correct:**
```js
fetch('/avatars/avatar.png')  // ✅ Correct
```

**Explanation:**
In Vite, files in `/public` folder are served at root URL. The `/public/` prefix is automatically removed during build.

**File Structure:**
```
project/
├── public/
│   └── avatars/
│       └── avatar.png
```

**Build Output:**
```
dist/
├── avatars/
│   └── avatar.png
```

**Deployed URL:**
```
https://username.github.io/repo-name/avatars/avatar.png
NOT: /public/avatars/avatar.png
```

---

### ❌ Issue 3: GitHub Actions Workflow Fails

**Symptoms:**
- Build job fails with pnpm version error
- Error: `Multiple versions of pnpm specified`

**Cause:**
pnpm version specified in both workflow and package.json.

**Solution:**
Remove version from workflow, let it read from package.json:

```yaml
# .github/workflows/deploy.yml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  # ❌ with:
  # ❌   version: 10
```

The action will auto-detect version from:
```json
// package.json
{
  "packageManager": "pnpm@10.14.0"
}
```

---

### ❌ Issue 4: CSS/JS Not Loading After Deploy

**Symptoms:**
- Site deployed but no styling
- Console: Multiple 404 errors for assets

**Possible Causes & Solutions:**

**1. Wrong Base Path**
```js
// vite.config.js - Check this matches your repo name
base: '/your-repo-name/'
```

**2. Jekyll Processing**
Create `.nojekyll` file in root:
```bash
touch .nojekyll
```

**3. GitHub Pages Source Setting**
- Go to Settings > Pages
- Source: Select **GitHub Actions** (not branch)

---

### ❌ Issue 5: Changes Not Reflecting on Live Site

**Symptoms:**
- Code changed but site still shows old version
- Pushed to GitHub but no updates

**Solutions:**

**1. Check Workflow Status**
- Go to Actions tab in GitHub
- Wait for workflow to complete (green ✅)
- Usually takes 2-3 minutes

**2. Hard Refresh Browser**
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**3. Clear Browser Cache**
```
Chrome: DevTools > Network tab > Disable cache
```

**4. Check Build Artifacts**
```bash
# Build locally to verify
pnpm run build

# Check dist/ folder contents
dir dist  # Windows
ls dist   # Mac/Linux
```

---

### ❌ Issue 6: Development Server Issues

**Symptoms:**
- `pnpm run dev` doesn't start
- Port already in use
- Hot reload not working

**Solutions:**

**1. Port Already in Use**
```js
// vite.config.js
server: {
  port: 3001,  // Change to different port
  open: true
}
```

**2. Clear Vite Cache**
```bash
# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Vite cache
rm -rf .vite
```

**3. Check Node Version**
```bash
node --version  # Should be 18+
pnpm --version  # Should be 8+
```

---

### ❌ Issue 7: Build Fails Locally

**Symptoms:**
- `pnpm run build` fails
- Obfuscator errors
- TypeScript/React errors

**Solutions:**

**1. Install Missing Dependencies**
```bash
pnpm install
```

**2. Check Obfuscator Config**
If obfuscator causes issues, temporarily disable:
```js
// vite.config.js
plugins: [
  react(),
  // mode === 'production' && obfuscatorPlugin({ ... })  // Commented out
]
```

**3. Update Dependencies**
```bash
pnpm update
```

---

## Environment-Specific Issues

### Development vs Production

**Development (`pnpm run dev`)**
- Base path: `/`
- Source maps: enabled
- Obfuscation: disabled
- Console logs: visible

**Production (`pnpm run build`)**
- Base path: `/repo-name/`
- Source maps: disabled
- Obfuscation: enabled
- Console logs: removed

### Testing Production Build Locally

```bash
# Build production
pnpm run build

# Preview locally
pnpm run preview
# Opens at http://localhost:4173

# Should match GitHub Pages behavior
```

---

## Debugging Checklist

When site doesn't work:

- [ ] Check repository name matches base path
- [ ] Verify `.nojekyll` exists
- [ ] Confirm GitHub Pages source = GitHub Actions
- [ ] Check workflow completed successfully
- [ ] Verify assets in `dist/` folder
- [ ] Test production build locally with `pnpm run preview`
- [ ] Check browser console for errors
- [ ] Clear browser cache and hard refresh
- [ ] Verify all dependencies installed
- [ ] Check Node.js version (18+)

---

## Getting Help

### Useful Commands

```bash
# Check git status
git status

# View recent commits
git log --oneline -5

# Check remote URL
git remote -v

# View build output
pnpm run build

# Test production locally
pnpm run preview
```

### Check GitHub Actions Logs

1. Go to your repo on GitHub
2. Click **Actions** tab
3. Click on latest workflow run
4. Check each step for errors
5. Download logs if needed

### Browser DevTools

```
F12 (Windows) or Cmd+Option+I (Mac)
- Console: See JavaScript errors
- Network: See 404 errors
- Application: Check cached files
```

---

## Known Issues

### Issue: Obfuscation Makes Debugging Hard

**Workaround:** Disable in development:
```js
mode === 'production' && obfuscatorPlugin({ ... })
```

### Issue: Large Bundle Size

**Solutions:**
- Check `dist/` size: `du -sh dist`
- Analyze bundle: `pnpm add -D rollup-plugin-visualizer`
- Lazy load components with `React.lazy()`

---

## Prevention Tips

1. **Always test locally before deploying**
   ```bash
   pnpm run build
   pnpm run preview
   ```

2. **Use correct base path from start**
   - Match repository name exactly
   - Include trailing slash: `/repo-name/`

3. **Don't edit `dist/` folder**
   - It's regenerated on each build
   - Make changes in `src/` instead

4. **Commit often with clear messages**
   ```bash
   git commit -m "Fix: specific issue description"
   ```

5. **Keep dependencies updated**
   ```bash
   pnpm update
   ```

---

**Need more help?** Check [DEPLOY.md](DEPLOY.md) for deployment guide.
