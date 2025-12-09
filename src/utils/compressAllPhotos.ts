/**
 * Utility to compress all existing photos in Firebase Storage
 * This is a one-time migration script
 */

import { ref, getDownloadURL, uploadBytes, getMetadata, getBlob } from 'firebase/storage';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../services/firebase.service';
import { compressImage } from './imageCompression';
import type { Group, Person } from '../types';

interface CompressionResult {
    photoUrl: string;
    memberName: string;
    groupName: string;
    originalSize: number;
    compressedSize: number;
    success: boolean;
    error?: string;
}

interface CompressionProgress {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    results: CompressionResult[];
}

/**
 * Download a photo from Firebase Storage as a File object
 */
const downloadPhotoAsFile = async (photoUrl: string, filename: string): Promise<File> => {
    // Create a storage reference from the URL
    const photoRef = ref(storage, photoUrl);

    // Use Firebase Storage SDK to download the blob (bypasses CORS)
    const blob = await getBlob(photoRef);

    return new File([blob], filename, { type: blob.type });
};


/**
 * Compress all photos across all families and groups
 */
export const compressAllPhotos = async (
    onProgress?: (progress: CompressionProgress) => void,
    maxSizeMB: number = 0.2
): Promise<CompressionProgress> => {
    const progress: CompressionProgress = {
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: []
    };

    try {
        // Get all families
        const familiesRef = collection(db, 'families');
        const familiesSnap = await getDocs(familiesRef);

        console.log(`Found ${familiesSnap.docs.length} families`);

        // Count total photos first
        for (const familyDoc of familiesSnap.docs) {
            const familyId = familyDoc.id;
            const groupsRef = collection(db, 'families', familyId, 'groups');
            const groupsSnap = await getDocs(groupsRef);

            groupsSnap.docs.forEach(groupDoc => {
                const group = groupDoc.data() as Group;
                group.members.forEach((member: Person) => {
                    progress.total += member.photos.length;
                });
            });
        }

        console.log(`Total photos to process: ${progress.total}`);
        onProgress?.(progress);

        // Process each family
        for (const familyDoc of familiesSnap.docs) {
            const familyId = familyDoc.id;

            const groupsRef = collection(db, 'families', familyId, 'groups');
            const groupsSnap = await getDocs(groupsRef);

            // Process each group
            for (const groupDoc of groupsSnap.docs) {
                const group = groupDoc.data() as Group;
                const groupId = groupDoc.id;
                let groupUpdated = false;

                console.log(`Processing group: ${group.name} (${group.members.length} members)`);

                // Process each member
                for (let memberIndex = 0; memberIndex < group.members.length; memberIndex++) {
                    const member = group.members[memberIndex];

                    // Process each photo
                    for (let photoIndex = 0; photoIndex < member.photos.length; photoIndex++) {
                        const photo = member.photos[photoIndex];
                        progress.processed++;

                        try {
                            // Get current photo metadata
                            const photoRef = ref(storage, photo.url);
                            const metadata = await getMetadata(photoRef);
                            const originalSizeBytes = metadata.size;
                            const originalSizeMB = originalSizeBytes / 1024 / 1024;

                            console.log(`Photo: ${member.name} - ${photo.id} (${originalSizeMB.toFixed(2)}MB)`);

                            // Skip if already under target size
                            if (originalSizeMB <= maxSizeMB) {
                                console.log(`✓ Skipped (already ${originalSizeMB.toFixed(2)}MB)`);
                                progress.skipped++;
                                progress.results.push({
                                    photoUrl: photo.url,
                                    memberName: member.name,
                                    groupName: group.name,
                                    originalSize: originalSizeBytes,
                                    compressedSize: originalSizeBytes,
                                    success: true
                                });
                                onProgress?.(progress);
                                continue;
                            }

                            // Download photo
                            const filename = photo.url.split('/').pop() || `photo_${photo.id}.jpg`;
                            const file = await downloadPhotoAsFile(photo.url, filename);

                            // Compress photo
                            const compressedFile = await compressImage(file, {
                                maxSizeMB,
                                maxWidthOrHeight: 1920,
                                quality: 0.8
                            });

                            const compressedSizeMB = compressedFile.size / 1024 / 1024;
                            console.log(`Compressed: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);

                            // Upload compressed photo (overwrites the original)
                            await uploadBytes(photoRef, compressedFile);

                            // Get new download URL (should be the same, but let's be safe)
                            const newUrl = await getDownloadURL(photoRef);

                            // Update photo URL in database if changed
                            if (newUrl !== photo.url) {
                                group.members[memberIndex].photos[photoIndex].url = newUrl;
                                groupUpdated = true;
                            }

                            progress.successful++;
                            progress.results.push({
                                photoUrl: photo.url,
                                memberName: member.name,
                                groupName: group.name,
                                originalSize: originalSizeBytes,
                                compressedSize: compressedFile.size,
                                success: true
                            });

                            console.log(`✓ Success: ${member.name} - ${photo.id}`);

                        } catch (error) {
                            console.error(`✗ Failed: ${member.name} - ${photo.id}`, error);
                            progress.failed++;
                            progress.results.push({
                                photoUrl: photo.url,
                                memberName: member.name,
                                groupName: group.name,
                                originalSize: 0,
                                compressedSize: 0,
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error'
                            });
                        }

                        onProgress?.(progress);
                    }
                }

                // Update group in database if any URLs changed
                if (groupUpdated) {
                    const groupRef = doc(db, 'families', familyId, 'groups', groupId);
                    await updateDoc(groupRef, { members: group.members });
                    console.log(`Updated group: ${group.name}`);
                }
            }
        }

        console.log('Compression complete!');
        console.log(`Total: ${progress.total}`);
        console.log(`Successful: ${progress.successful}`);
        console.log(`Skipped: ${progress.skipped}`);
        console.log(`Failed: ${progress.failed}`);

    } catch (error) {
        console.error('Error during photo compression:', error);
        throw error;
    }

    return progress;
};

/**
 * Calculate total storage savings from compression
 */
export const calculateStorageSavings = (progress: CompressionProgress): {
    totalOriginalMB: number;
    totalCompressedMB: number;
    savedMB: number;
    savedPercentage: number;
} => {
    const totalOriginal = progress.results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = progress.results.reduce((sum, r) => sum + r.compressedSize, 0);
    const saved = totalOriginal - totalCompressed;

    return {
        totalOriginalMB: totalOriginal / 1024 / 1024,
        totalCompressedMB: totalCompressed / 1024 / 1024,
        savedMB: saved / 1024 / 1024,
        savedPercentage: totalOriginal > 0 ? (saved / totalOriginal) * 100 : 0
    };
};
