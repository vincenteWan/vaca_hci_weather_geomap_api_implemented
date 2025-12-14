# 🚀 Deploy Your VACA App - 3 Easy Options

## ⭐ Option 1: Vercel (Recommended - Easiest)

1. **Go to https://vercel.com**
2. **Sign up/Login** with GitHub, GitLab, or Bitbucket
3. **Click "Add New" → "Project"**
4. **Import your project**:
   - Either push this folder to GitHub first, OR
   - Use Vercel CLI: `npx vercel login` then `npx vercel`
5. **Deploy!** - Vercel auto-detects Vite and deploys
6. **Get your URL** - Something like: `https://your-app.vercel.app`

### Quick Deploy with Vercel CLI:
```bash
npx vercel login
npx vercel
```

---

## 🔥 Option 2: Netlify (Also Very Easy)

1. **Go to https://netlify.com**
2. **Sign up/Login** with GitHub
3. **Drag & Drop** your project folder, OR
4. **Use Netlify CLI**:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`

---

## 🐙 Option 3: GitHub Pages (Free)

1. **Push to GitHub**:
```bash
# Create a new repo on github.com first
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

2. **Install gh-pages**:
```bash
npm install -D gh-pages
```

3. **Add to package.json scripts**:
```json
"deploy": "npm run build && gh-pages -d dist"
```

4. **Update vite.config.js** - add base:
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/',
})
```

5. **Deploy**:
```bash
npm run deploy
```

6. **Enable GitHub Pages**:
   - Go to repo Settings → Pages
   - Source: `gh-pages` branch
   - Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## 📦 Build Your App Locally First

Before deploying, always test the build:

```bash
npm run build
npm run preview
```

This creates optimized production files in the `dist/` folder.

---

## 🎯 Recommended: Vercel

**Why Vercel?**
- ✅ Automatic HTTPS
- ✅ Auto-deploys on git push
- ✅ Free for personal projects
- ✅ Fast global CDN
- ✅ Zero configuration
- ✅ Get a shareable URL instantly

**Your URL will look like:**
`https://hci-vaca-app.vercel.app`

Anyone in the world can access it - no installation needed! 🌍
