# 🔐 Security Best Practices - Environment Variables

## ✅ What We've Implemented

### Environment Variable Protection
- ✅ Firebase credentials stored in `.env` file
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` template provided
- ✅ Validation for missing environment variables
- ✅ Clear error messages if config is incomplete

---

## 📁 File Structure

```
FamilyLinX/
├── .env                    ← Your actual credentials (NOT in git)
├── .env.example            ← Template (safe to commit)
├── .gitignore              ← Protects .env from being committed
└── src/
    └── config/
        └── firebase.ts     ← Reads from environment variables
```

---

## 🚫 What NOT to Do

### ❌ Never Commit These Files:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- Any file containing actual API keys

### ❌ Never Do This:
```typescript
// DON'T hardcode credentials!
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",  // ❌ NEVER DO THIS
  // ...
};
```

---

## ✅ What TO Do

### ✅ Use Environment Variables:
```typescript
// ✅ CORRECT - Read from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...
};
```

### ✅ Provide Template:
```bash
# .env.example (safe to commit)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# ...
```

---

## 🔧 Setup for Team Members

### For New Developers:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/FamilyLinX.git
   cd FamilyLinX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Get Firebase credentials**
   - Ask team admin for Firebase credentials
   - OR create your own Firebase project for testing

5. **Fill in .env**
   ```bash
   # Edit .env with actual values
   nano .env  # or use your preferred editor
   ```

6. **Start development**
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment Configuration

### Netlify

1. Go to Site Settings → Build & Deploy → Environment
2. Add environment variables:
   ```
   VITE_FIREBASE_API_KEY = your_actual_key
   VITE_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = your_project
   VITE_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
   VITE_FIREBASE_APP_ID = 1:123456789:web:abc123
   ```

### Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable:
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: `your_actual_key`
   - Environment: Production, Preview, Development

### Firebase Hosting

Create `.firebaserc` and `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Then set environment variables in Firebase Functions or use build-time variables.

---

## 🔍 Verification

### Check if .env is Protected

```bash
# This should show .env in the list
cat .gitignore | grep .env

# This should NOT show .env
git status
```

### Check if Environment Variables are Loaded

```bash
# Start dev server
npm run dev

# Check browser console - should NOT see errors about missing env vars
```

---

## 🚨 What to Do if You Accidentally Commit Credentials

### If you committed .env to GitHub:

1. **Immediately rotate your Firebase API keys**
   - Go to Firebase Console → Project Settings
   - Regenerate API keys
   - Update your `.env` file

2. **Remove from git history**
   ```bash
   # Remove file from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (WARNING: This rewrites history)
   git push origin --force --all
   ```

3. **Add to .gitignore** (if not already there)
   ```bash
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "Add .env to gitignore"
   git push
   ```

4. **Notify team members**
   - Tell them to update their Firebase credentials
   - Share new credentials securely (NOT via email or Slack)

---

## 🔐 Additional Security Measures

### 1. Use Firebase App Check (Recommended)

Protect your Firebase resources from abuse:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Implement Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId} {
      // Only authenticated users
      allow read: if request.auth != null;
      
      // Only family admins can write
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/families/$(familyId)/admins/$(request.auth.uid));
    }
  }
}
```

### 3. Add Authentication

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // User signed in
  })
  .catch((error) => {
    // Handle error
  });
```

### 4. Use Environment-Specific Configs

```bash
# .env.development
VITE_FIREBASE_PROJECT_ID=familylinx-dev

# .env.production
VITE_FIREBASE_PROJECT_ID=familylinx-prod
```

---

## 📋 Security Checklist

### Before Committing:
- [ ] `.env` is in `.gitignore`
- [ ] No API keys in source code
- [ ] `.env.example` has placeholder values only
- [ ] Run `git status` to verify .env is not staged

### Before Deploying:
- [ ] Environment variables set in hosting platform
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] App Check enabled (optional but recommended)
- [ ] Authentication implemented (for production)

### Regular Maintenance:
- [ ] Rotate API keys every 90 days
- [ ] Review Firestore rules monthly
- [ ] Monitor Firebase usage for anomalies
- [ ] Keep dependencies updated

---

## 📚 Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🎯 Summary

### What We Did:
✅ Moved Firebase credentials to `.env`  
✅ Added `.env` to `.gitignore`  
✅ Created `.env.example` template  
✅ Added validation for missing variables  
✅ Updated all documentation  

### Why It Matters:
🔒 Protects your Firebase project from unauthorized access  
🔒 Prevents accidental credential exposure on GitHub  
🔒 Follows industry best practices  
🔒 Makes credential rotation easier  
🔒 Enables different configs for dev/staging/production  

### Next Steps:
1. Create your `.env` file
2. Add your Firebase credentials
3. Never commit `.env` to git
4. Share credentials securely with team members
5. Set environment variables in your hosting platform

---

**🔐 Security is not optional - it's essential!**

**Built with security in mind using Firebase, React, and TypeScript**
