# Deployment Guide

## Vercel (Recommended)

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project" and import your GitHub repository
3. Vercel will automatically detect the settings from `vercel.json`
4. Click "Deploy"

## Netlify

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "New site from Git" and select your repository
3. Netlify will use `netlify.toml` for configuration
4. Click "Deploy site"

## GitHub Pages

1. Enable GitHub Pages in your repository settings
2. Select "GitHub Actions" as the source
3. The workflow in `.github/workflows/deploy.yml` will automatically deploy on push to main
4. Note: If deploying to a subdirectory, update `vite.config.ts` with the base path:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

## Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com) and sign in
2. Click "Create a project" and connect your repository
3. Configure:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `habitgrid` (if deploying from monorepo)
4. Click "Save and Deploy"

