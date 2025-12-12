# Migration Script: Copy /alifamily members to /toknggal/alisulong

This script copies all members from the `/alifamily` root group to the `/toknggal/alisulong` sub-group.

## Prerequisites

1. **Firebase Admin SDK service account key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `serviceAccountKey.json` in the project root

2. **Install Firebase Admin SDK**
   ```bash
   npm install firebase-admin
   ```

## How to Run

1. **Download your service account key** (see Prerequisites above)

2. **Run the migration script:**
   ```bash
   node migrate-alifamily.js
   ```

## What the Script Does

1. ✅ Finds the `/alifamily` root group
2. ✅ Finds the `/toknggal` root group
3. ✅ Locates the person "alisulong" in `/toknggal`
4. ✅ Gets alisulong's sub-group
5. ✅ Copies all members from `/alifamily` to alisulong's sub-group
6. ✅ Generates new unique IDs for all copied members
7. ✅ Preserves all member data including photos (photo URLs are reused)

## Important Notes

⚠️ **Before running:**
- Make sure a person named "alisulong" exists in `/toknggal`
- Make sure alisulong has a family sub-group created (click "Create Family" on their card)

⚠️ **Photo Note:**
- Photos are referenced by URL, so they will appear in both locations
- The actual photo files in Firebase Storage are NOT duplicated
- If you need to duplicate photos, additional code is required

## Safety Features

- ✅ Generates new IDs for all copied members
- ✅ Does not modify the source `/alifamily` group
- ✅ Validates all groups exist before copying
- ✅ Provides clear error messages
- ✅ Shows progress and summary

## Troubleshooting

**Error: "Could not find /alifamily root group"**
→ Check that a root group with slug "alifamily" exists

**Error: "Could not find /toknggal root group"**
→ Check that a root group with slug "toknggal" exists

**Error: "Could not find alisulong person or their sub-group"**
→ Make sure:
  1. A person named "alisulong" exists in /toknggal
  2. This person has a family sub-group created (via "Create Family" button)
