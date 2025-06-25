# 🔥 Firebase Configuration Guide for QSTSS Portal

## 🎯 Current Status
- ✅ GitHub Repository: Ready
- ✅ Firebase Project: `qstss-portal` created
- ✅ Firestore Database: Rules deployed
- ⏳ Firebase Config: Needs API keys
- ⏳ Functions: Needs Blaze plan

## 🔑 Get Firebase Configuration Keys

### Step 1: Get Firebase Config
1. Go to [Firebase Console](https://console.firebase.google.com/project/qstss-portal)
2. Click **Project Settings** (gear icon)
3. Scroll down to **Your apps**
4. Click **Add app** → **Web app** (</> icon)
5. App nickname: `qstss-portal-web`
6. ✅ Check "Also set up Firebase Hosting for this app"
7. Click **Register app**
8. **Copy the config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyX...",
  authDomain: "qstss-portal.firebaseapp.com",
  projectId: "qstss-portal",
  storageBucket: "qstss-portal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 2: Enable Authentication
1. In Firebase Console → **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Click **Save**

### Step 3: Enable Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode**
4. Select location: **us-central** (or closest to Qatar)
5. Click **Done**

### Step 4: Add Sample Data
Run this in Firestore Console to add demo users:

**Collection: `teachers`**
```json
{
  "email": "admin@qstss.edu.qa",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "department": "Administration",
  "isActive": true
}
```

```json
{
  "email": "john.smith@qstss.edu.qa", 
  "firstName": "John",
  "lastName": "Smith",
  "role": "teacher",
  "department": "Science",
  "subjects": ["Physics", "Mathematics"],
  "isActive": true
}
```

## 🌍 GitHub Pages Setup

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository
2. **Settings** → **Pages**
3. Source: **GitHub Actions**
4. Save

### Step 2: Update Firebase Config
Edit `docs/index.html` and replace the firebaseConfig with your actual keys:

```html
<!-- Replace this in docs/index.html -->
const firebaseConfig = {
    apiKey: "your-actual-api-key-here",
    authDomain: "qstss-portal.firebaseapp.com", 
    projectId: "qstss-portal",
    storageBucket: "qstss-portal.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

### Step 3: Deploy
```bash
git add .
git commit -m "Configure Firebase integration"
git push origin main
```

## 🚀 Your Portal URLs

After setup:
- **GitHub Pages**: `https://yourusername.github.io/qstss-portal`
- **Firebase Console**: `https://console.firebase.google.com/project/qstss-portal`
- **Firestore Database**: Connected and ready!

## ⚡ Quick Test
1. Visit your GitHub Pages URL
2. Click on demo credentials to auto-fill
3. Login to test the interface
4. Firebase database connection will be active!

## 💰 Cost Information
- **GitHub Pages**: 100% Free
- **Firebase**: 
  - Firestore: Free up to 1GB and 50K reads/day
  - Authentication: Free up to 10K users
  - Functions: Requires Blaze plan ($0.40/million invocations)

## 🔧 Optional: Enable Functions (Backend API)
To enable full backend functionality:
1. Upgrade to Blaze plan: https://console.firebase.google.com/project/qstss-portal/usage/details
2. Run: `firebase deploy --only functions`
3. API will be available at: `https://us-central1-qstss-portal.cloudfunctions.net/api`

---

**🎉 Your QSTSS Portal will be live on GitHub Pages with Firebase backend!**
