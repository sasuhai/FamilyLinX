# FamilyLinX - Firebase Integration & Multi-Tenant Setup Guide

## 🔥 Firebase Setup Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `familylinx` (or your preferred name)
4. Follow the setup wizard
5. Enable Google Analytics (optional)

### Step 2: Enable Firebase Services

#### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location (choose closest to your users)
5. Click "Enable"

#### Storage
1. Go to "Storage"
2. Click "Get started"
3. Use default security rules for now
4. Click "Done"

#### Authentication (Optional - for future user login)
1. Go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" and "Google" sign-in methods

### Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Register your app with nickname: "FamilyLinX Web"
5. Copy the `firebaseConfig` object

### Step 4: Configure Environment Variables

**IMPORTANT: Never commit API keys to GitHub!**

1. In the root directory of your project, create a `.env` file
2. Copy the template from `.env.example`:

```bash
cp .env.example .env
```

3. Edit the `.env` file and add your Firebase credentials:

```bash
# .env file (This file is in .gitignore and won't be committed)

VITE_FIREBASE_API_KEY=AIzaSy...  # Paste your actual API key here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Security Notes:**
- ✅ `.env` is already in `.gitignore` - it won't be committed to GitHub
- ✅ Never share your `.env` file
- ✅ Use `.env.example` as a template for team members
- ✅ For production, set environment variables in your hosting platform (Netlify, Vercel, etc.)
- ✅ Restart the dev server after creating/modifying `.env`

### Step 5: Set Up Firestore Security Rules

In Firebase Console → Firestore Database → Rules, use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to families collection
    match /families/{familyId} {
      allow read, write: if true; // For now, open access
      
      // Allow read/write to groups subcollection
      match /groups/{groupId} {
        allow read, write: if true;
      }
    }
  }
}
```

**Note**: These are permissive rules for development. For production, add proper authentication.

### Step 6: Set Up Storage Security Rules

In Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read, write: if true; // For now, open access
    }
  }
}
```

## 🌐 Multi-Tenant URL Structure

### URL Format
```
https://your-domain.com/{familyId}
```

### Examples
- `https://familylinx.com/sasuhai` → Sasuhai family
- `https://familylinx.com/smith-family` → Smith family
- `https://familylinx.com/acme-team` → ACME team

### How It Works

1. **Route Parameter**: The app uses React Router with a dynamic `:familyId` parameter
2. **Data Isolation**: Each family/team has its own Firestore subcollection
3. **Automatic Creation**: First visit to a new familyId creates the family automatically
4. **Deep Linking**: URLs preserve the current state and can be shared

### Creating a New Family

To create a new family, simply navigate to:
```
http://localhost:5174/your-family-name
```

The app will:
1. Check if the family exists in Firestore
2. If not, create a new family with a default main group
3. Load the family data and display it

## 📁 Firestore Data Structure

```
families (collection)
  └── {familyId} (document)
      ├── id: string
      ├── name: string
      ├── description: string
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      └── groups (subcollection)
          └── {groupId} (document)
              ├── id: string
              ├── name: string
              ├── description: string
              ├── parentGroupId: string | null
              ├── members: array
              │   └── {
              │       id: string,
              │       name: string,
              │       relationship: string,
              │       yearOfBirth: number,
              │       photos: array,
              │       subGroupId: string | null
              │     }
              ├── createdAt: timestamp
              └── updatedAt: timestamp
```

## 🖼️ Storage Structure

```
photos/
  └── {familyId}/
      └── {personId}/
          └── {timestamp}_{filename}
```

## ✨ New Features

### 1. Add Members
- Click "Add Member" button in any group
- Fill in name, relationship, year of birth
- Optionally upload photos with year tags
- Photos are automatically uploaded to Firebase Storage

### 2. Edit Group
- Click the edit icon (✏️) next to group name
- Update group name and description
- Changes sync to Firebase in real-time

### 3. Multi-Tenant Support
- Each family/team has its own URL
- Data is completely isolated
- Share URLs with family members
- No login required (for now)

## 🚀 Deployment

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build the app
npm run build

# Deploy
firebase deploy --only hosting
```

### Option 2: Netlify

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables if needed

### Option 3: Vercel

```bash
npm install -g vercel
vercel
```

## 🔐 Security Considerations

### Current Setup (Development)
- ✅ Open read/write access for testing
- ⚠️ No authentication required
- ⚠️ Anyone can modify any family's data

### Production Recommendations

1. **Add Authentication**
   - Implement Firebase Auth
   - Require login to view/edit data
   - Use email/password or Google sign-in

2. **Secure Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId} {
      // Only authenticated users can read
      allow read: if request.auth != null;
      
      // Only family admins can write
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/families/$(familyId)/admins/$(request.auth.uid)).data.isAdmin == true;
      
      match /groups/{groupId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}
```

3. **Secure Storage Rules**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{familyId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

4. **Add Admin System**
   - Create an `admins` subcollection in each family
   - Only admins can add/remove members
   - Only admins can edit group settings

## 📊 Cost Estimation

### Firebase Free Tier (Spark Plan)
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day
- **Storage**: 5 GB, 1 GB/day downloads
- **Hosting**: 10 GB/month

### Typical Usage (Small Family - 20 members, 200 photos)
- **Firestore**: ~10 MB
- **Storage**: ~500 MB
- **Reads**: ~100/day
- **Writes**: ~10/day

**Result**: Easily fits in free tier! 🎉

### Scaling to 100+ Families
- Consider upgrading to Blaze (pay-as-you-go)
- Estimated cost: $5-20/month depending on usage

## 🎯 Next Steps

1. ✅ Set up Firebase project
2. ✅ Create `.env` file with your Firebase credentials
3. ✅ Deploy Firestore and Storage rules
4. ✅ Test locally with `npm run dev`
5. ✅ Create your first family at `/your-family-name`
6. ✅ Add members and photos
7. ✅ Deploy to production

## 🐛 Troubleshooting

### "Firebase not initialized"
- Check that firebase.ts has correct config
- Verify Firebase project is created

### "Permission denied"
- Check Firestore rules are deployed
- Verify Storage rules are set

### "Photos not uploading"
- Check Storage is enabled
- Verify file size < 5MB
- Check browser console for errors

### "Family not loading"
- Check familyId in URL is valid
- Verify Firestore connection
- Check browser console for errors

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Storage Guide](https://firebase.google.com/docs/storage)
- [React Router Documentation](https://reactrouter.com/)

---

**Built with ❤️ using Firebase, React, and TypeScript**
