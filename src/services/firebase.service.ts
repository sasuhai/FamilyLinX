/**
 * Firebase service for managing groups, persons, and photos
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Group, Person, Photo } from '../types';

// Export db and storage for use in other components
export { db, storage };

// Collection names
const GROUPS_COLLECTION = 'groups';
const FAMILIES_COLLECTION = 'families';

/**
 * Family/Team Operations
 */

export const createFamily = async (familyId: string, name: string, description: string = '') => {
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId);
    await setDoc(familyRef, {
        id: familyId,
        name,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return familyId;
};

export const getFamily = async (familyId: string) => {
    const familyRef = doc(db, FAMILIES_COLLECTION, familyId);
    const familySnap = await getDoc(familyRef);

    if (familySnap.exists()) {
        return familySnap.data();
    }
    return null;
};

export const getFamilyByRootSlug = async (rootSlug: string): Promise<{ familyId: string; family: any } | null> => {
    // Get all families
    const familiesRef = collection(db, FAMILIES_COLLECTION);
    const familiesSnap = await getDocs(familiesRef);

    // Search through each family's groups to find one with matching root slug
    for (const familyDoc of familiesSnap.docs) {
        const familyId = familyDoc.id;
        const groups = await getAllGroups(familyId);

        // Find root group (no parent) with matching slug
        const rootGroup = Object.values(groups).find(g => !g.parentGroupId && g.slug === rootSlug);

        if (rootGroup) {
            return {
                familyId,
                family: familyDoc.data()
            };
        }
    }

    return null;
};

export const getAllRootSlugs = async (): Promise<string[]> => {
    const familiesRef = collection(db, FAMILIES_COLLECTION);
    const familiesSnap = await getDocs(familiesRef);

    const rootSlugs: string[] = [];

    // Search through each family's groups to collect all root slugs
    for (const familyDoc of familiesSnap.docs) {
        const familyId = familyDoc.id;
        const groups = await getAllGroups(familyId);

        // Find all root groups (no parent) and collect their slugs
        Object.values(groups).forEach(g => {
            if (!g.parentGroupId && g.slug) {
                rootSlugs.push(g.slug);
            }
        });
    }

    return rootSlugs;
};


/**
 * Group Operations
 */

export const createGroup = async (familyId: string, group: Omit<Group, 'createdAt' | 'updatedAt'>) => {
    const groupRef = doc(db, FAMILIES_COLLECTION, familyId, GROUPS_COLLECTION, group.id);

    const groupData = {
        ...group,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(groupRef, groupData);
    return group.id;
};

export const getGroup = async (familyId: string, groupId: string): Promise<Group | null> => {
    const groupRef = doc(db, FAMILIES_COLLECTION, familyId, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
        const data = groupSnap.data();
        return {
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now()
        } as Group;
    }
    return null;
};

export const getAllGroups = async (familyId: string): Promise<Record<string, Group>> => {
    const groupsRef = collection(db, FAMILIES_COLLECTION, familyId, GROUPS_COLLECTION);
    const groupsSnap = await getDocs(groupsRef);

    const groups: Record<string, Group> = {};
    groupsSnap.forEach((doc) => {
        const data = doc.data();
        groups[doc.id] = {
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now()
        } as Group;
    });

    return groups;
};

export const updateGroup = async (familyId: string, groupId: string, updates: Partial<Group>) => {
    console.log('🔥 Firebase updateGroup called');
    console.log('🔥 familyId:', familyId);
    console.log('🔥 groupId:', groupId);
    console.log('🔥 updates:', updates);

    const groupRef = doc(db, FAMILIES_COLLECTION, familyId, GROUPS_COLLECTION, groupId);

    console.log('🔥 groupRef path:', groupRef.path);

    const dataToUpdate = {
        ...updates,
        updatedAt: serverTimestamp()
    };

    console.log('🔥 Data being written to Firestore:', dataToUpdate);

    await updateDoc(groupRef, dataToUpdate);

    console.log('✅ Firebase updateDoc completed successfully');
};

export const deleteGroup = async (familyId: string, groupId: string) => {
    // Get the group to access all members and their photos
    const group = await getGroup(familyId, groupId);

    if (group && group.members && group.members.length > 0) {
        console.log(`Deleting photos for ${group.members.length} members in group ${group.name}`);

        // Delete all photos from all members
        for (const member of group.members) {
            if (member.photos && member.photos.length > 0) {
                console.log(`Deleting ${member.photos.length} photos for ${member.name}`);
                for (const photo of member.photos) {
                    try {
                        await deletePhoto(photo.url);
                        console.log(`Deleted photo: ${photo.url}`);
                    } catch (error) {
                        console.error(`Failed to delete photo ${photo.url}:`, error);
                        // Continue deleting other photos even if one fails
                    }
                }
            }
        }
    }

    // Delete the group document
    const groupRef = doc(db, FAMILIES_COLLECTION, familyId, GROUPS_COLLECTION, groupId);
    await deleteDoc(groupRef);
};

/**
 * Person Operations
 */

export const addPersonToGroup = async (familyId: string, groupId: string, person: Person) => {
    const group = await getGroup(familyId, groupId);
    if (!group) throw new Error('Group not found');

    const updatedMembers = [...group.members, person];
    await updateGroup(familyId, groupId, { members: updatedMembers });
};

export const updatePerson = async (familyId: string, groupId: string, personId: string, updates: Partial<Person>) => {
    const group = await getGroup(familyId, groupId);
    if (!group) throw new Error('Group not found');

    const updatedMembers = group.members.map(member =>
        member.id === personId ? { ...member, ...updates } : member
    );

    await updateGroup(familyId, groupId, { members: updatedMembers });
};

export const deletePerson = async (familyId: string, groupId: string, personId: string) => {
    const group = await getGroup(familyId, groupId);
    if (!group) throw new Error('Group not found');

    // Find the person to delete
    const personToDelete = group.members.find(member => member.id === personId);

    // Delete all photos from Firebase Storage
    if (personToDelete && personToDelete.photos && personToDelete.photos.length > 0) {
        console.log(`Deleting ${personToDelete.photos.length} photos for person ${personToDelete.name}`);
        for (const photo of personToDelete.photos) {
            try {
                await deletePhoto(photo.url);
                console.log(`Deleted photo: ${photo.url}`);
            } catch (error) {
                console.error(`Failed to delete photo ${photo.url}:`, error);
                // Continue deleting other photos even if one fails
            }
        }
    }

    // Remove person from members array
    const updatedMembers = group.members.filter(member => member.id !== personId);
    await updateGroup(familyId, groupId, { members: updatedMembers });
};

/**
 * Photo Operations
 */

export const uploadPhoto = async (
    familyId: string,
    personId: string,
    file: File,
    yearTaken: number,
    caption?: string
): Promise<Photo> => {
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `${familyId}/${personId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, `photos/${filename}`);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return {
        id: `photo_${timestamp}`,
        url,
        yearTaken,
        caption
    };
};

export const deletePhoto = async (photoUrl: string) => {
    try {
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
    } catch (error) {
        console.error('Error deleting photo:', error);
    }
};

export const getPhotoSize = async (photoUrl: string): Promise<number> => {
    try {
        const photoRef = ref(storage, photoUrl);
        const metadata = await getMetadata(photoRef);
        return metadata.size; // Returns size in bytes
    } catch (error) {
        console.error('Error getting photo size:', error);
        // Return estimated average size (500KB) if we can't get the actual size
        return 500 * 1024; // 500KB in bytes
    }
};



export const addPhotoToPerson = async (
    familyId: string,
    groupId: string,
    personId: string,
    photo: Photo
) => {
    const group = await getGroup(familyId, groupId);
    if (!group) throw new Error('Group not found');

    const updatedMembers = group.members.map(member =>
        member.id === personId
            ? { ...member, photos: [...member.photos, photo] }
            : member
    );

    await updateGroup(familyId, groupId, { members: updatedMembers });
};

export const removePhotoFromPerson = async (
    familyId: string,
    groupId: string,
    personId: string,
    photoId: string
) => {
    const group = await getGroup(familyId, groupId);
    if (!group) throw new Error('Group not found');

    const updatedMembers = group.members.map(member => {
        if (member.id === personId) {
            const photoToDelete = member.photos.find(p => p.id === photoId);
            if (photoToDelete) {
                deletePhoto(photoToDelete.url); // Delete from storage
            }
            return {
                ...member,
                photos: member.photos.filter(p => p.id !== photoId)
            };
        }
        return member;
    });

    await updateGroup(familyId, groupId, { members: updatedMembers });
};
