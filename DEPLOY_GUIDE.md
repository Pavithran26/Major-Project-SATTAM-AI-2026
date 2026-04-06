# Sattam AI Deployment Guide

This file contains copy-paste commands and a clear checklist to:
- push code to GitHub
- deploy frontend on Vercel
- deploy backend on Railway
- connect Firebase auth

---

## 1) Push Code to GitHub

### Frontend (`SattamAI-frontend-main`)

```bash
cd "C:\Users\Adhoc19\Desktop\Pavithran\Major-Project-SATTAM-AI-2026\SattamAI-frontend-main"
git status
git add .
git commit -m "Migrate Clerk auth to Firebase auth"
git push origin main
```

### Flutter (`sattam_flutter-master`)

```bash
cd "C:\Users\Adhoc19\Desktop\Pavithran\Major-Project-SATTAM-AI-2026\sattam_flutter-master"
git status
git add .
git commit -m "Replace Clerk auth with Firebase auth in Flutter"
git push origin main
```

### Backend (`Sattam-AI-Backend`) if needed

```bash
cd "YOUR_BACKEND_LOCAL_PATH"
git status
git add .
git commit -m "Prepare backend for production deployment"
git push origin main
```

---

## 2) Deploy Frontend (Vercel)

1. Open: https://vercel.com/new
2. Import repo: `Pavithran26/Sattam-AI`
3. Keep default Next.js settings
4. Add these Environment Variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sattam-ai-57938.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sattam-ai-57938
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sattam-ai-57938.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=930621796365
NEXT_PUBLIC_FIREBASE_APP_ID=1:930621796365:web:bff540b361beffb4756544
NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_URL
```

5. Click **Deploy**

---

## 3) Deploy Backend (Railway)

1. Open: https://railway.app/new
2. Deploy from GitHub: `Pavithran26/Sattam-AI-Backend`
3. Add backend environment variables from your backend `.env`
4. Deploy
5. Copy backend URL (example: `https://xxxx.up.railway.app`)

---

## 4) Connect Frontend to Backend

After backend is live:

1. Open Vercel project settings
2. Update:

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_RAILWAY_BACKEND_URL
```

3. Redeploy frontend

---

## 5) Firebase Settings

In Firebase Console:

1. Authentication -> Sign-in method -> enable **Email/Password**
2. Authentication -> Settings -> Authorized domains:
   - `localhost`
   - your Vercel domain

---

## 6) Final Live Test

1. Open your Vercel frontend URL
2. Sign up user
3. Sign in user
4. Open chat or backend-connected page
5. Confirm no CORS/auth/network errors

---

## 7) Flutter Final Steps

Run locally:

```bash
cd "C:\Users\Adhoc19\Desktop\Pavithran\Major-Project-SATTAM-AI-2026\sattam_flutter-master"
flutter pub get
```

If building Android/iOS, configure platform Firebase files:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

Recommended:

```bash
flutterfire configure
```

---

## Notes

- Do not share passwords/private keys in chat.
- HTTPS GitHub links are enough; SSH is optional.
- If deployment fails, collect build logs and fix step-by-step.
