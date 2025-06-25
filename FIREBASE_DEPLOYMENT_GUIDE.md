# 🚀 QSTSS Portal - Firebase Deployment Guide

## Overview
This guide will help you deploy the Qatar Science & Technology Secondary School Portal to Firebase, making it accessible online for teachers worldwide.

## Prerequisites
- Firebase CLI installed ✅
- Git repository set up ✅
- Google Firebase account

## 📋 Step-by-Step Deployment

### 1. Firebase Project Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create a new project** called "qstss-portal"
3. **Enable the following services:**
   - Authentication (Sign-in methods: Email/Password)
   - Firestore Database
   - Hosting
   - Functions

### 2. Firebase Configuration

Run these commands in your terminal:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select these options:
# - Functions: Configure a Cloud Functions directory
# - Hosting: Configure files for Firebase Hosting 
# - Firestore: Configure security rules and indexes files
```

### 3. Environment Setup

Create environment files:

**Frontend (.env.production):**
```
REACT_APP_API_URL=https://us-central1-qstss-portal.cloudfunctions.net/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=qstss-portal.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=qstss-portal
```

### 4. Deploy Commands

```bash
# Build and deploy everything
npm run deploy:all

# Or deploy individually:
npm run build:frontend
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 5. GitHub Integration

The project includes GitHub Actions for automatic deployment:
- Push to `main` branch automatically deploys to Firebase
- Environment secrets are configured in GitHub repository settings

## 🌐 Access URLs

After deployment, your portal will be available at:
- **Frontend**: https://qstss-portal.web.app
- **API**: https://us-central1-qstss-portal.cloudfunctions.net/api

## 👥 Demo Accounts

The system includes demo accounts for testing:
- **Admin**: admin@qstss.edu.qa / admin123
- **Teacher**: john.smith@qstss.edu.qa / teacher123

## 🔧 Features Available Online

- ✅ Student Management
- ✅ Competition Registration
- ✅ Teacher Dashboard
- ✅ Real-time Notifications
- ✅ Data Export/Import
- ✅ Admin Panel
- ✅ Responsive Mobile Design

## 📱 Mobile Access

Teachers can access the portal from any device:
- Desktop computers
- Tablets
- Mobile phones
- All modern web browsers

## 🔒 Security Features

- Firebase Authentication
- Role-based access control
- Secure API endpoints
- HTTPS encryption
- Data validation

## 📞 Support

For technical support or questions about the portal:
- Check the TEACHER_ACCESS_GUIDE.md
- Review the README.md for detailed documentation

## 🔄 Updates

The portal supports automatic updates through GitHub Actions. Any changes pushed to the main branch will be automatically deployed to the live site.
