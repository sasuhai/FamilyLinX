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
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Group, Person, Photo } from '../types';

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
