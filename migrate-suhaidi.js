/**
 * Migration Script: Copy members from /alifamily/suhaidi to /toknggal/ngahjusoh/alisulong/suhaidi
 * 
 * This script will:
 * 1. Find the suhaidi sub-group under /alifamily
 * 2. Find the suhaidi sub-group under /toknggal/ngahjusoh/alisulong
 * 3. Copy all members from source to destination
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(
    readFileSync('./serviceAccountKey.json', 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const FAMILIES_COLLECTION = 'families';
const GROUPS_COLLECTION = 'groups';

/**
 * Generate new ID for copied members
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Find a group by its slug (root groups only)
 */
async function findRootGroupBySlug(slug) {
    console.log(`🔍 Searching for root group with slug: ${slug}`);

    const familiesSnapshot = await db.collection(FAMILIES_COLLECTION).get();

    for (const familyDoc of familiesSnapshot.docs) {
        const familyId = familyDoc.id;
        const groupsSnapshot = await db.collection(FAMILIES_COLLECTION)
            .doc(familyId)
            .collection(GROUPS_COLLECTION)
            .get();

        for (const groupDoc of groupsSnapshot.docs) {
            const groupData = groupDoc.data();
            if (groupData.slug === slug && !groupData.parentGroupId) {
                console.log(`✅ Found root group "${groupData.name}"`);
                return {
                    familyId,
                    groupId: groupDoc.id,
                    group: groupData
                };
            }
        }
    }

    return null;
}

/**
 * Find a group by slug and parent ID
 */
async function findGroupBySlugAndParent(familyId, slug, parentGroupId) {
    console.log(`🔍 Searching for group with slug "${slug}" under parent ${parentGroupId}`);

    const groupsSnapshot = await db.collection(FAMILIES_COLLECTION)
        .doc(familyId)
        .collection(GROUPS_COLLECTION)
        .get();

    for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data();
        if (groupData.slug === slug && groupData.parentGroupId === parentGroupId) {
            console.log(`✅ Found group "${groupData.name}" (ID: ${groupDoc.id})`);
            return {
                groupId: groupDoc.id,
                group: groupData
            };
        }
    }

    return null;
}

/**
 * Get a specific group by familyId and groupId
 */
async function getGroup(familyId, groupId) {
    const groupDoc = await db.collection(FAMILIES_COLLECTION)
        .doc(familyId)
        .collection(GROUPS_COLLECTION)
        .doc(groupId)
        .get();

    if (groupDoc.exists) {
        return groupDoc.data();
    }
    return null;
}

/**
 * Copy members from source group to destination group
 */
async function copyMembers(sourceFamilyId, sourceGroupId, destFamilyId, destGroupId) {
    console.log('\n📋 Starting member copy process...');

    // Get source group members
    const sourceGroup = await getGroup(sourceFamilyId, sourceGroupId);
    if (!sourceGroup || !sourceGroup.members || sourceGroup.members.length === 0) {
        console.log('❌ No members found in source group');
        return 0;
    }

    console.log(`📊 Found ${sourceGroup.members.length} members in source group`);

    // Get destination group
    const destGroup = await getGroup(destFamilyId, destGroupId);
    if (!destGroup) {
        console.log('❌ Destination group not found');
        return 0;
    }

    const existingCount = destGroup.members ? destGroup.members.length : 0;
    console.log(`📊 Destination group currently has ${existingCount} members`);

    // Create copies of all members with new IDs
    const copiedMembers = sourceGroup.members.map(member => ({
        ...member,
        id: generateId(), // Generate new ID for each member
        photos: member.photos.map(photo => ({
            ...photo,
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
    }));

    // Add copied members to destination group
    const updatedMembers = [...(destGroup.members || []), ...copiedMembers];

    // Update Firestore
    await db.collection(FAMILIES_COLLECTION)
        .doc(destFamilyId)
        .collection(GROUPS_COLLECTION)
        .doc(destGroupId)
        .update({
            members: updatedMembers,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

    console.log(`✅ Successfully copied ${copiedMembers.length} members`);
    console.log(`📊 Destination group now has ${updatedMembers.length} members total`);
    return copiedMembers.length;
}

/**
 * Main migration function
 */
async function migrate() {
    try {
        console.log('🚀 Starting migration: /alifamily/suhaidi → /toknggal/ngahjusoh/alisulong/suhaidi\n');

        // ========== SOURCE PATH: /alifamily/suhaidi ==========

        // Step 1: Find alifamily root group
        const alifamilyResult = await findRootGroupBySlug('alifamily');
        if (!alifamilyResult) {
            console.error('❌ Could not find /alifamily root group');
            process.exit(1);
        }

        // Step 2: Find suhaidi sub-group under alifamily
        const sourceResult = await findGroupBySlugAndParent(
            alifamilyResult.familyId,
            'suhaidi',
            alifamilyResult.groupId
        );

        if (!sourceResult) {
            console.error('❌ Could not find /alifamily/suhaidi group');
            process.exit(1);
        }

        console.log('✅ Source path resolved: /alifamily/suhaidi\n');

        // ========== DESTINATION PATH: /toknggal/ngahjusoh/alisulong/suhaidi ==========

        // Step 3: Find toknggal root group
        const toknggalResult = await findRootGroupBySlug('toknggal');
        if (!toknggalResult) {
            console.error('❌ Could not find /toknggal root group');
            process.exit(1);
        }

        // Step 4: Find ngahjusoh sub-group under toknggal
        const ngahjusohResult = await findGroupBySlugAndParent(
            toknggalResult.familyId,
            'ngahjusoh',
            toknggalResult.groupId
        );

        if (!ngahjusohResult) {
            console.error('❌ Could not find /toknggal/ngahjusoh group');
            process.exit(1);
        }

        // Step 5: Find alisulong sub-group under ngahjusoh
        const alisulongResult = await findGroupBySlugAndParent(
            toknggalResult.familyId,
            'alisulong',
            ngahjusohResult.groupId
        );

        if (!alisulongResult) {
            console.error('❌ Could not find /toknggal/ngahjusoh/alisulong group');
            process.exit(1);
        }

        // Step 6: Find suhaidi sub-group under alisulong
        const destResult = await findGroupBySlugAndParent(
            toknggalResult.familyId,
            'suhaidi',
            alisulongResult.groupId
        );

        if (!destResult) {
            console.error('❌ Could not find /toknggal/ngahjusoh/alisulong/suhaidi group');
            console.error('💡 Make sure a sub-group with slug "suhaidi" exists under /toknggal/ngahjusoh/alisulong');
            process.exit(1);
        }

        console.log('✅ Destination path resolved: /toknggal/ngahjusoh/alisulong/suhaidi\n');

        // Step 7: Copy members
        const copiedCount = await copyMembers(
            alifamilyResult.familyId,
            sourceResult.groupId,
            toknggalResult.familyId,
            destResult.groupId
        );

        console.log('\n🎉 Migration completed successfully!');
        console.log(`📊 Total members copied: ${copiedCount}`);
        console.log(`📍 From: /alifamily/suhaidi`);
        console.log(`   Family: ${alifamilyResult.familyId}`);
        console.log(`   Group: ${sourceResult.groupId}`);
        console.log(`📍 To: /toknggal/ngahjusoh/alisulong/suhaidi`);
        console.log(`   Family: ${toknggalResult.familyId}`);
        console.log(`   Group: ${destResult.groupId}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        process.exit(0);
    }
}

// Run migration
migrate();
