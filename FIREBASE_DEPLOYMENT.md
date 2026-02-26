# Firebase Hosting Deployment Guide

## Prerequisites
- Firebase CLI installed globally
- Firebase project created (or will create during init)
- Production build ready

## Steps to Deploy

### 1. Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in project
```bash
firebase init hosting
```

**Configuration:**
- Choose or create Firebase project
- Public directory: `dist`
- Single-page app: `Yes`
- Automatic builds with GitHub: `No` (for now)

### 4. Build production app
```bash
npm run build
```

### 5. Deploy to Firebase
```bash
firebase deploy --only hosting
```

---

## Configuration Files

### firebase.json (auto-generated)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Post-Deployment

Your app will be live at:
- `https://YOUR-PROJECT-ID.web.app`
- `https://YOUR-PROJECT-ID.firebaseapp.com`

### Update Supabase Redirect URLs
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Firebase hosting URLs to:
   - Site URL
   - Redirect URLs

---

## Environment Variables

Make sure your `.env` file has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are baked into the build at build time.
