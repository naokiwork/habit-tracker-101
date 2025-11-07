# HabitGrid

A beautiful habit tracking app with grid, list, monthly, and yearly views. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 📊 **Grid View**: Weekly habit tracking grid
- 📋 **Habits List**: Detailed list view with statistics
- 📅 **Monthly View**: Monthly calendar with completion tracking
- 📈 **Yearly View**: Annual overview with heatmap visualization
- 🎯 **Habit Planning**: Schedule habits with time, days, duration, and description
- 🔥 **Streak Tracking**: Smart streak calculation based on planned days
- 💾 **Local Storage**: All data stored locally in your browser
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Vercel will automatically detect Vite and configure the build settings
5. Click "Deploy"

The `vercel.json` file is already configured for this project.

### Netlify

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "New site from Git" and select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

### GitHub Pages

1. Update `vite.config.ts` to include base path:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

2. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

### Cloudflare Pages

1. Push your code to GitHub/GitLab
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) and sign in
3. Click "Create a project" and connect your repository
4. Configure build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click "Save and Deploy"

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icons

## License

MIT
