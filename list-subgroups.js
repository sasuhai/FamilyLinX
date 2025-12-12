/**
 * List all sub-groups under /toknggal
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

async function listSubGroups() {
    try {
        console.log('🔍 Listing all sub-groups under /toknggal...\n');

        // Find toknggal root group
        const familiesSnapshot = await db.collection('families').get();

        let toknggalGroupId = null;
        let toknggalFamilyId = null;

        for (const familyDoc of familiesSnapshot.docs) {
            const familyId = familyDoc.id;
            const groupsSnapshot = await db.collection('families')
                .doc(familyId)
                .collection('groups')
                .get();

            for (const groupDoc of groupsSnapshot.docs) {
                const groupData = groupDoc.data();
                if (groupData.slug === 'toknggal' && !groupData.parentGroupId) {
                    toknggalGroupId = groupDoc.id;
                    toknggalFamilyId = familyId;
                    console.log(`✅ Found /toknggal root group: "${groupData.name}"`);
                    console.log(`📍 Group ID: ${toknggalGroupId}\n`);
                    break;
                }
            }
            if (toknggalGroupId) break;
        }

        if (!toknggalGroupId) {
            console.log('❌ Could not find /toknggal group');
            process.exit(1);
        }

        // Find all sub-groups
        const allGroupsSnapshot = await db.collection('families')
            .doc(toknggalFamilyId)
            .collection('groups')
            .get();

        const subGroups = [];
        allGroupsSnapshot.forEach(groupDoc => {
            const groupData = groupDoc.data();
            if (groupData.parentGroupId === toknggalGroupId) {
                subGroups.push({
                    id: groupDoc.id,
                    ...groupData
                });
            }
        });

        if (subGroups.length === 0) {
            console.log('❌ No sub-groups found under /toknggal');
        } else {
            console.log(`📂 Found ${subGroups.length} sub-group(s):\n`);

            subGroups.forEach((subGroup, index) => {
                console.log(`${index + 1}. Name: "${subGroup.name}"`);
                console.log(`   Slug: ${subGroup.slug || '(no slug)'}`);
                console.log(`   ID: ${subGroup.id}`);
                console.log(`   Members: ${subGroup.members ? subGroup.members.length : 0}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

listSubGroups();
