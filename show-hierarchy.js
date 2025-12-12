/**
 * Show full hierarchy tree of all groups under /toknggal
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

async function showHierarchy() {
    try {
        console.log('🌳 Building hierarchy tree for /toknggal...\n');

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
                    console.log(`📍 ROOT: /toknggal`);
                    console.log(`   Name: "${groupData.name}"`);
                    console.log(`   ID: ${toknggalGroupId}\n`);
                    break;
                }
            }
            if (toknggalGroupId) break;
        }

        if (!toknggalGroupId) {
            console.log('❌ Could not find /toknggal group');
            process.exit(1);
        }

        // Get ALL groups in this family
        const allGroupsSnapshot = await db.collection('families')
            .doc(toknggalFamilyId)
            .collection('groups')
            .get();

        const allGroups = {};
        allGroupsSnapshot.forEach(groupDoc => {
            allGroups[groupDoc.id] = {
                id: groupDoc.id,
                ...groupDoc.data()
            };
        });

        // Function to print group tree recursively
        function printTree(groupId, level = 0, path = '') {
            const group = allGroups[groupId];
            if (!group) return;

            const indent = '  '.repeat(level);
            const currentPath = path ? `${path}/${group.slug}` : group.slug;

            console.log(`${indent}├─ /${currentPath}`);
            console.log(`${indent}│  Name: "${group.name}"`);
            console.log(`${indent}│  ID: ${group.id}`);
            console.log(`${indent}│  Parent ID: ${group.parentGroupId || 'none (root)'}`);
            console.log(`${indent}│  Members: ${group.members ? group.members.length : 0}`);

            // Find child groups
            const children = Object.values(allGroups).filter(g => g.parentGroupId === groupId);

            if (children.length > 0) {
                console.log(`${indent}│  Children: ${children.length}`);
                console.log(`${indent}│`);
                children.forEach(child => {
                    printTree(child.id, level + 1, currentPath);
                });
            } else {
                console.log(`${indent}│  Children: 0`);
            }
            console.log(`${indent}│`);
        }

        // Print the tree starting from toknggal
        printTree(toknggalGroupId);

        // Also check for alisulong specifically
        console.log('\n🔍 Searching specifically for "alisulong"...\n');

        const alisulongGroups = Object.values(allGroups).filter(g =>
            g.slug === 'alisulong' || (g.name && g.name.toLowerCase().includes('alisulong'))
        );

        if (alisulongGroups.length > 0) {
            console.log(`✅ Found ${alisulongGroups.length} group(s) matching "alisulong":\n`);
            alisulongGroups.forEach((group, index) => {
                console.log(`${index + 1}. Name: "${group.name}"`);
                console.log(`   Slug: ${group.slug}`);
                console.log(`   ID: ${group.id}`);
                console.log(`   Parent ID: ${group.parentGroupId}`);

                // Find parent name
                if (group.parentGroupId) {
                    const parent = allGroups[group.parentGroupId];
                    if (parent) {
                        console.log(`   Parent: "${parent.name}" (slug: ${parent.slug})`);
                    }
                }
                console.log('');
            });
        } else {
            console.log('❌ No groups found with name or slug containing "alisulong"');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

showHierarchy();
