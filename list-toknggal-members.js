/**
 * List all members in /toknggal to help identify the correct person name
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

async function listToknggalMembers() {
    try {
        console.log('🔍 Listing all members in /toknggal...\n');

        const familiesSnapshot = await db.collection('families').get();

        for (const familyDoc of familiesSnapshot.docs) {
            const familyId = familyDoc.id;
            const groupsSnapshot = await db.collection('families')
                .doc(familyId)
                .collection('groups')
                .get();

            for (const groupDoc of groupsSnapshot.docs) {
                const groupData = groupDoc.data();
                if (groupData.slug === 'toknggal' && !groupData.parentGroupId) {
                    console.log(`✅ Found /toknggal group: "${groupData.name}"`);
                    console.log(`📍 Family ID: ${familyId}`);
                    console.log(`📍 Group ID: ${groupDoc.id}\n`);

                    if (groupData.members && groupData.members.length > 0) {
                        console.log(`👥 Members (${groupData.members.length} total):\n`);

                        groupData.members.forEach((member, index) => {
                            console.log(`${index + 1}. Name: "${member.name}"`);
                            console.log(`   ID: ${member.id}`);
                            console.log(`   Relationship: ${member.relationship}`);
                            console.log(`   Has sub-group: ${member.subGroupId ? '✅ Yes (' + member.subGroupId + ')' : '❌ No'}`);
                            console.log('');
                        });
                    } else {
                        console.log('❌ No members found in this group');
                    }

                    return;
                }
            }
        }

        console.log('❌ Could not find /toknggal group');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

listToknggalMembers();
