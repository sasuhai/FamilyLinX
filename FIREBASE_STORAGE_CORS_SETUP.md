# Firebase Storage CORS Configuration

## Problem
The photo compression tool is failing with CORS errors because Firebase Storage doesn't allow cross-origin requests from localhost by default.

## Solution
Configure CORS on your Firebase Storage bucket using the `gsutil` command-line tool.

## Steps to Fix

### 1. Install Google Cloud SDK (if not already installed)

**On macOS:**
```bash
brew install google-cloud-sdk
```

**Or download from:** https://cloud.google.com/sdk/docs/install

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
```

This will open a browser window for you to sign in with your Google account.

### 3. Set your Firebase project

```bash
gcloud config set project familylinx-a03dc
```

### 4. Apply CORS configuration to your storage bucket

```bash
gsutil cors set cors.json gs://familylinx-a03dc.firebasestorage.app
```

### 5. Verify the CORS configuration

```bash
gsutil cors get gs://familylinx-a03dc.firebasestorage.app
```

You should see the CORS configuration you just applied.

## What the CORS Configuration Does

The `cors.json` file allows:
- ✅ Requests from `localhost:5173` (Vite dev server)
- ✅ Requests from `localhost:3000` and `localhost:5174` (alternative ports)
- ✅ GET, POST, PUT, DELETE methods
- ✅ Necessary headers for the compression tool to work

## After Configuration

Once CORS is configured:
1. Refresh your browser
2. Try the photo compression tool again
3. It should work without CORS errors!

## Production Deployment
Even for production, you MUST apply the CORS configuration because the compression tool reads image data directly.

1. We have added the production domains to `cors.json`
2. Run the `gsutil` command to apply it

---

## Troubleshooting

**If you get "command not found: gsutil":**
- Make sure Google Cloud SDK is installed
- Try restarting your terminal
- Check installation: `which gsutil`

**If you get permission errors:**
- Make sure you're logged in: `gcloud auth login`
- Make sure you have owner/editor permissions on the Firebase project

**If CORS errors persist:**
- Clear your browser cache
- Wait a few minutes for the configuration to propagate
- Try in an incognito window
