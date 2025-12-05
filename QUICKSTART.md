# ⚡ Quick Start - Firebase Configuration

## 🚨 IMPORTANT: Configure Firebase First!

The app **will not work** until you set up Firebase. Follow these steps:

## Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Enter name: `familylinx` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Enable Firestore (2 minutes)

1. In left sidebar, click "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (closest to you)
5. Click "Enable"

## Step 3: Enable Storage (2 minutes)

1. In left sidebar, click "Storage"
2. Click "Get started"
3. Click "Next" (use default rules)
4. Choose same location as Firestore
5. Click "Done"

## Step 4: Get Your Config (3 minutes)

1. Click gear icon ⚙️ → "Project settings"
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Enter nickname: "FamilyLinX"
5. Click "Register app"
6. **COPY** the `firebaseConfig` object

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Create .env File (1 minute)

1. In the root directory of the project, create a file named `.env`
2. Copy the contents from `.env.example`
3. Replace the placeholder values with YOUR actual Firebase config:

```bash
# .env file (DO NOT commit this to git!)

VITE_FIREBASE_API_KEY=AIzaSy...  # Your actual API key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**IMPORTANT:**
- ✅ The `.env` file is already in `.gitignore` - it won't be committed
- ✅ Never share your `.env` file or commit it to GitHub
- ✅ Use `.env.example` as a template for others
- ✅ Restart the dev server after creating `.env`

**Quick way to create .env:**

```bash
# Copy the example file
cp .env.example .env

# Then edit .env with your actual values
```

## Step 6: Deploy Firestore Rules (2 minutes)

1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId} {
      allow read, write: if true;
      
      match /groups/{groupId} {
        allow read, write: if true;
      }
    }
  }
}
```

4. Click "Publish"

## Step 7: Deploy Storage Rules (2 minutes)

1. In Firebase Console, go to "Storage"
2. Click "Rules" tab
3. Replace with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

## Step 8: Test Your App! (1 minute)

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open browser to:
   ```
   http://localhost:5174/your-family-name
   ```

3. You should see:
   - Loading screen
   - Then your family group
   - "Add Member" and "Edit Group" buttons

4. Try adding a member!

---

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Storage enabled
- [ ] Config copied to firebase.ts
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] App loads without errors
- [ ] Can add members
- [ ] Can edit group

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
→ Check your apiKey in firebase.ts

### "Missing or insufficient permissions"
→ Deploy Firestore rules (Step 6)

### "Storage: User does not have permission"
→ Deploy Storage rules (Step 7)

### App shows blank screen
→ Check browser console (F12)
→ Verify firebase.ts has correct config

---

## 🎯 What's Next?

Once Firebase is configured:

1. **Add your family members**
   - Click "Add Member"
   - Fill in details
   - Upload photos

2. **Create sub-groups**
   - Click person card
   - Click "Create Sub-Group"
   - Add members to sub-group

3. **Share with family**
   - Send them your URL
   - They can view and add members

4. **Deploy to production**
   - See DEPLOYMENT.md
   - Use Firebase Hosting (recommended)

---

## 📚 Need More Help?

- **Detailed Guide**: See FIREBASE_SETUP.md
- **Architecture**: See ARCHITECTURE.md
- **Components**: See COMPONENTS.md
- **Deployment**: See DEPLOYMENT.md

---

**Total Setup Time: ~15 minutes**

**🎉 You're ready to go!**
