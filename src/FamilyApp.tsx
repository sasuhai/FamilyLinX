import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Group, Person, BreadcrumbItem } from './types';
import { ModernHeader } from './components/ModernHeader';
import { HeroSection } from './components/HeroSection';
import { GroupView } from './components/GroupView';
import { AddMemberModal } from './components/AddMemberModal';
import { AddGroupModal } from './components/AddGroupModal';
import { EditGroupModal } from './components/EditGroupModal';
import { CreatePageModal } from './components/CreatePageModal';
import { AlbumManagementModal, type Album } from './components/AlbumManagementModal';
import { generateId } from './utils/helpers';
import {
    createFamily,
    getFamilyByRootSlug,
    getAllGroups,
    getAllRootSlugs,
    createGroup,
    updateGroup,
    addPersonToGroup
} from './services/firebase.service';
import {
    getAlbums,
    createAlbum as createAlbumInFirebase,
    updateAlbum as updateAlbumInFirebase,
    deleteAlbum as deleteAlbumInFirebase
} from './services/album.service';
import './App.css';

export function FamilyApp() {
    const { rootSlug, groupSlug } = useParams<{ rootSlug: string; groupSlug?: string }>();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Record<string, Group>>({});
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [darkMode, setDarkMode] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [showEditGroup, setShowEditGroup] = useState(false);
    const [familyName, setFamilyName] = useState('');
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showCreatePage, setShowCreatePage] = useState(false);
    const [showAlbumManagement, setShowAlbumManagement] = useState(false);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [existingRootSlugs, setExistingRootSlugs] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<{ title: string; message: string; url: string } | null>(null);



    // Helper function to generate URL-friendly slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Load family data from Firebase using root slug
    useEffect(() => {
        const loadFamilyData = async () => {
            if (!rootSlug) return;

            setIsLoading(true);
            try {
                // Find family by root slug
                const familyData = await getFamilyByRootSlug(rootSlug);

                if (!familyData) {
                    // Root slug doesn't exist - show error
                    setErrorMessage(`The family "${rootSlug}" does not exist. Please check the URL and try again.`);
                    setIsLoading(false);
                    return;
                } else {
                    // Load existing family
                    setFamilyId(familyData.familyId);
                    setFamilyName(familyData.family.name);
                    const loadedGroups = await getAllGroups(familyData.familyId);

                    // Generate slugs for groups that don't have them
                    const groupsWithSlugs: Record<string, Group> = {};
                    for (const [id, group] of Object.entries(loadedGroups)) {
                        if (!group.slug) {
                            const slug = generateSlug(group.name);
                            groupsWithSlugs[id] = { ...group, slug };
                            // Update in Firebase
                            await updateGroup(familyData.familyId, id, { slug });
                        } else {
                            groupsWithSlugs[id] = group;
                        }
                    }

                    setGroups(groupsWithSlugs);

                    // Find the target group
                    let targetGroup: Group | undefined;

                    if (groupSlug) {
                        // If groupSlug is provided, find that specific group
                        targetGroup = Object.values(groupsWithSlugs).find(g => g.slug === groupSlug);

                        // If groupSlug provided but not found, show error
                        if (!targetGroup) {
                            setErrorMessage(`The group "${groupSlug}" does not exist under "${rootSlug}". Please check the URL and try again.`);
                            setIsLoading(false);
                            return;
                        }
                    } else {
                        // Otherwise, find the root group (should match rootSlug)
                        targetGroup = Object.values(groupsWithSlugs).find(g => !g.parentGroupId && g.slug === rootSlug);
                    }

                    if (targetGroup) {
                        setCurrentGroupId(targetGroup.id);
                        setNavigationHistory([targetGroup.id]);
                    }
                }
            } catch (error) {
                console.error('Error loading family data:', error);
                alert('Failed to load family data. Please check your Firebase configuration.');
            } finally {
                setIsLoading(false);
            }
        };

        loadFamilyData();
    }, [rootSlug, groupSlug]);

    useEffect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            darkMode ? 'dark' : 'light'
        );
    }, [darkMode]);

    // Load existing root slugs when create page modal is shown
    useEffect(() => {
        const loadExistingSlugs = async () => {
            if (showCreatePage) {
                try {
                    const slugs = await getAllRootSlugs();
                    setExistingRootSlugs(slugs);
                } catch (error) {
                    console.error('Error loading existing slugs:', error);
                    setExistingRootSlugs([]);
                }
            }
        };
        loadExistingSlugs();
    }, [showCreatePage]);

    // Load albums when familyId is available
    useEffect(() => {
        const loadAlbumData = async () => {
            if (!familyId) return;

            try {
                const loadedAlbums = await getAlbums(familyId);
                setAlbums(loadedAlbums);
                console.log('📀 Loaded albums in FamilyApp:', loadedAlbums.length);
            } catch (error) {
                console.error('Error loading albums:', error);
            }
        };
        loadAlbumData();
    }, [familyId]);

    const currentGroup = currentGroupId ? groups[currentGroupId] : null;

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        return navigationHistory.map(id => ({
            id,
            name: groups[id]?.name || 'Unknown'
        }));
    };

    const getRootSlug = (): string => {
        const rootGroup = Object.values(groups).find(g => !g.parentGroupId);
        return rootGroup?.slug || rootSlug || 'otai';
    };

    const handleNavigateToBreadcrumb = (groupId: string) => {
        const group = groups[groupId];
        if (!group) return;

        const index = navigationHistory.indexOf(groupId);
        if (index !== -1) {
            // Group is already in history, navigate back to it
            setCurrentGroupId(groupId);
            setNavigationHistory(navigationHistory.slice(0, index + 1));
        } else {
            // Group is not in history, add it (for sub-group navigation)
            setCurrentGroupId(groupId);
            setNavigationHistory([...navigationHistory, groupId]);
        }

        // Update URL with slug
        const rootSlugValue = getRootSlug();
        if (group.parentGroupId && group.slug) {
            // Sub-group: /:rootSlug/:groupSlug
            navigate(`/${rootSlugValue}/${group.slug}`, { replace: true });
        } else {
            // Root group: /:rootSlug
            navigate(`/${rootSlugValue}`, { replace: true });
        }
    };


    const handleNavigateHome = () => {
        if (navigationHistory.length > 0) {
            const firstGroupId = navigationHistory[0];
            const rootSlugValue = getRootSlug();

            setCurrentGroupId(firstGroupId);
            setNavigationHistory([firstGroupId]);

            // Update URL to root group
            navigate(`/${rootSlugValue}`, { replace: true });
        }
    };

    const handleCreateSubGroup = async (personId: string) => {
        if (!familyId) return;

        // Find the person and their parent group across all groups
        let person: Person | undefined;
        let parentGroup: Group | undefined;

        for (const group of Object.values(groups)) {
            const foundPerson = group.members.find(m => m.id === personId);
            if (foundPerson) {
                person = foundPerson;
                parentGroup = group;
                break;
            }
        }

        if (!person || !parentGroup) {
            console.error('Person or parent group not found');
            return;
        }

        const newGroupId = generateId();
        const groupName = `${person.name}'s Family`;
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: groupName,
            slug: generateSlug(groupName),
            description: `Sub-group for ${person.name}`,
            members: [],
            parentGroupId: parentGroup.id
        };

        try {
            // Create group in Firebase
            await createGroup(familyId, newGroup);

            // Update person with subGroupId
            const updatedMembers = parentGroup.members.map(m =>
                m.id === personId ? { ...m, subGroupId: newGroupId } : m
            );

            await updateGroup(familyId, parentGroup.id, { members: updatedMembers });

            // Update local state
            setGroups(prev => ({
                ...prev,
                [newGroupId]: { ...newGroup, createdAt: Date.now(), updatedAt: Date.now() },
                [parentGroup.id]: {
                    ...parentGroup,
                    members: updatedMembers,
                    updatedAt: Date.now()
                }
            }));

            // Auto-expand the newly created sub-group
            setExpandedGroups(prev => new Set([...prev, newGroupId]));
        } catch (error) {
            console.error('Error creating sub-group:', error);
            alert('Failed to create sub-group. Please try again.');
        }
    };

    const handleToggleSubGroup = (subGroupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);

            // If this sub-group is already open, close it
            if (prev.has(subGroupId)) {
                newSet.delete(subGroupId);
                return newSet;
            }

            // Find the parent of this sub-group
            const subGroup = groups[subGroupId];
            if (!subGroup) return newSet;

            const parentGroupId = subGroup.parentGroupId;
            if (!parentGroupId) return newSet;

            // Find all siblings (sub-groups with the same parent)
            const parentGroup = groups[parentGroupId];
            if (!parentGroup) return newSet;

            const siblingSubGroupIds = parentGroup.members
                .filter(m => m.subGroupId)
                .map(m => m.subGroupId!);

            // Close all siblings
            siblingSubGroupIds.forEach(id => newSet.delete(id));

            // Open this sub-group
            newSet.add(subGroupId);

            return newSet;
        });
    };

    const handleAddMember = async (person: Person, photoFiles?: File[], photoYears?: number[]) => {
        if (!currentGroup || !familyId) return;

        try {
            // Upload photos to Firebase Storage if provided
            if (photoFiles && photoFiles.length > 0 && photoYears) {
                const { uploadPhoto } = await import('./services/firebase.service');

                for (let i = 0; i < photoFiles.length; i++) {
                    const file = photoFiles[i];
                    const year = photoYears[i];

                    try {
                        // Upload photo to Firebase Storage
                        const photo = await uploadPhoto(familyId, person.id, file, year);

                        // Add photo to person
                        person.photos.push(photo);
                    } catch (error) {
                        console.error(`Failed to upload photo ${file.name}:`, error);
                        // Continue with other photos even if one fails
                    }
                }
            }

            // Helper function to remove undefined values recursively
            const removeUndefined = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined);
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .filter(([_, value]) => value !== undefined)
                            .map(([key, value]) => [key, removeUndefined(value)])
                    );
                }
                return obj;
            };

            // Clean person object before saving
            const cleanPerson = removeUndefined(person);

            // Add person to group in Firestore
            await addPersonToGroup(familyId, currentGroup.id, cleanPerson);

            // Update local state
            setGroups(prev => ({
                ...prev,
                [currentGroup.id]: {
                    ...currentGroup,
                    members: [...currentGroup.members, cleanPerson],
                    updatedAt: Date.now()
                }
            }));
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member. Please try again.');
        }
    };

    const handleEditGroup = async (updates: { name?: string; description?: string; slug?: string }) => {
        console.log('🎯 handleEditGroup CALLED with updates:', updates);
        console.log('🎯 currentGroup:', currentGroup?.id, currentGroup?.name);
        console.log('🎯 familyId:', familyId);

        if (!currentGroup) {
            console.log('❌ Early return: currentGroup missing');
            alert('Error: No group selected. Please try again.');
            return;
        }

        if (!familyId) {
            console.log('❌ Early return: familyId missing');
            alert('Error: Family ID not loaded. Please refresh the page and try again.');
            return;
        }

        console.log('🔄 handleEditGroup proceeding with save...');

        try {
            await updateGroup(familyId, currentGroup.id, updates);

            // Update local state
            setGroups(prev => ({
                ...prev,
                [currentGroup.id]: {
                    ...currentGroup,
                    ...updates,
                    updatedAt: Date.now()
                }
            }));

            console.log('✅ Group updated successfully');
        } catch (error) {
            console.error('Error updating group:', error);
            alert('Failed to update group. Please try again.');
        }
    };

    const handleEditAnyGroup = async (groupId: string, updates: { name?: string; description?: string; slug?: string }) => {
        console.log('🔵 handleEditAnyGroup CALLED');
        console.log('🔵 groupId:', groupId);
        console.log('🔵 updates:', updates);
        console.log('🔵 familyId:', familyId);

        if (!familyId) {
            console.log('❌ handleEditAnyGroup: No familyId, returning');
            return;
        }

        console.log('🔵 Calling updateGroup...');

        try {
            await updateGroup(familyId, groupId, updates);

            console.log('🔵 updateGroup completed, updating local state...');

            // Update local state
            setGroups(prev => ({
                ...prev,
                [groupId]: {
                    ...prev[groupId],
                    ...updates,
                    updatedAt: Date.now()
                }
            }));

            console.log('✅ handleEditAnyGroup: Group updated successfully');
        } catch (error) {
            console.error('Error updating group:', error);
            alert('Failed to update group. Please try again.');
        }
    };

    const handleAddMemberToAnyGroup = async (groupId: string, person: Person, photoFiles?: File[], photoYears?: number[]) => {
        if (!familyId) return;

        try {
            // Upload photos to Firebase Storage if provided
            if (photoFiles && photoFiles.length > 0 && photoYears) {
                const { uploadPhoto } = await import('./services/firebase.service');

                for (let i = 0; i < photoFiles.length; i++) {
                    const file = photoFiles[i];
                    const year = photoYears[i];

                    try {
                        // Upload photo to Firebase Storage
                        const photo = await uploadPhoto(familyId, person.id, file, year);

                        // Add photo to person
                        person.photos.push(photo);
                    } catch (error) {
                        console.error(`Failed to upload photo ${file.name}:`, error);
                        // Continue with other photos even if one fails
                    }
                }
            }

            // Helper function to remove undefined values recursively
            const removeUndefined = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined);
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .filter(([_, value]) => value !== undefined)
                            .map(([key, value]) => [key, removeUndefined(value)])
                    );
                }
                return obj;
            };

            // Clean person object before saving
            const cleanPerson = removeUndefined(person);

            // Get the target group
            const targetGroup = groups[groupId];
            if (!targetGroup) return;

            // Add person to group in Firestore
            await addPersonToGroup(familyId, groupId, cleanPerson);

            // Update local state
            setGroups(prev => ({
                ...prev,
                [groupId]: {
                    ...targetGroup,
                    members: [...targetGroup.members, cleanPerson],
                    updatedAt: Date.now()
                }
            }));
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member. Please try again.');
        }
    };

    const handleUpdateMember = async (personId: string, updates: Partial<Person>, newPhotos?: File[], photoYears?: number[]) => {
        if (!familyId) return;

        console.log('🔄 Starting member update...', { personId, updates, newPhotos: newPhotos?.length });

        try {
            // Find the person and their group across all groups
            let person: Person | undefined;
            let personGroup: Group | undefined;

            for (const group of Object.values(groups)) {
                const foundPerson = group.members.find(m => m.id === personId);
                if (foundPerson) {
                    person = foundPerson;
                    personGroup = group;
                    break;
                }
            }

            if (!person || !personGroup) {
                console.error('❌ Person not found:', personId);
                return;
            }

            console.log('👤 Found person:', person.name, 'in group:', personGroup.name, 'Current photos:', person.photos.length);

            // Start with existing photos or filtered photos from updates
            let finalPhotos = updates.photos ? [...updates.photos] : [...person.photos];
            console.log('📸 Starting with photos:', finalPhotos.length);

            // Upload new photos if provided
            if (newPhotos && newPhotos.length > 0 && photoYears) {
                console.log('⬆️ Uploading', newPhotos.length, 'new photos...');
                const { uploadPhoto } = await import('./services/firebase.service');

                for (let i = 0; i < newPhotos.length; i++) {
                    const file = newPhotos[i];
                    const year = photoYears[i];

                    console.log(`📤 Uploading photo ${i + 1}/${newPhotos.length}:`, file.name, 'Year:', year);

                    try {
                        // Upload photo to Firebase Storage
                        const photo = await uploadPhoto(familyId, person.id, file, year);
                        console.log('✅ Photo uploaded successfully:', photo.url);

                        // Add photo to final photos array
                        finalPhotos.push(photo);
                    } catch (error) {
                        console.error(`❌ Failed to upload photo ${file.name}:`, error);
                        // Continue with other photos even if one fails
                    }
                }
                console.log('📸 Final photos count:', finalPhotos.length);
            }

            // Create updated person object with all changes
            // Filter out undefined values from updates to prevent Firestore errors
            const cleanUpdates = Object.fromEntries(
                Object.entries(updates).filter(([_, value]) => value !== undefined)
            );

            const updatedPerson = {
                ...person,
                ...cleanUpdates,
                photos: finalPhotos
            };

            // If isDeceased is explicitly set to undefined in updates, remove it and yearOfDeath
            if ('isDeceased' in updates && updates.isDeceased === undefined) {
                delete updatedPerson.isDeceased;
                delete updatedPerson.yearOfDeath;
            }

            console.log('💾 Saving updated person:', updatedPerson.name, 'Photos:', updatedPerson.photos.length);
            console.log('🔍 Updated person object:', JSON.stringify(updatedPerson, null, 2));

            // Helper function to remove undefined values recursively
            const removeUndefined = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined);
                } else if (obj !== null && typeof obj === 'object') {
                    return Object.fromEntries(
                        Object.entries(obj)
                            .filter(([_, value]) => value !== undefined)
                            .map(([key, value]) => [key, removeUndefined(value)])
                    );
                }
                return obj;
            };

            // Update person in Firestore
            const updatedMembers = personGroup.members.map(m =>
                m.id === personId ? updatedPerson : m
            );

            // Remove all undefined values from the entire members array
            const cleanMembers = removeUndefined(updatedMembers);

            console.log('🧹 Cleaned members array');

            await updateGroup(familyId, personGroup.id, { members: cleanMembers });
            console.log('✅ Firestore updated successfully');

            // Update local state
            setGroups(prev => ({
                ...prev,
                [personGroup.id]: {
                    ...personGroup,
                    members: updatedMembers,
                    updatedAt: Date.now()
                }
            }));
            console.log('✅ Local state updated successfully');
        } catch (error) {
            console.error('❌ Error updating member:', error);
            alert('Failed to update member. Please try again.');
        }
    };

    const handleDeleteMember = async (personId: string) => {
        if (!familyId) return;

        console.log('🗑️ Deleting member:', personId);

        try {
            // Find the person and their group across all groups
            let personGroup: Group | undefined;

            for (const group of Object.values(groups)) {
                const foundPerson = group.members.find(m => m.id === personId);
                if (foundPerson) {
                    personGroup = group;
                    break;
                }
            }

            if (!personGroup) {
                console.error('❌ Person not found:', personId);
                return;
            }

            console.log('🗑️ Deleting from group:', personGroup.name);

            // Remove member from group
            const updatedMembers = personGroup.members.filter(m => m.id !== personId);

            // Update Firestore
            await updateGroup(familyId, personGroup.id, { members: updatedMembers });
            console.log('✅ Member deleted from Firestore');

            // Update local state
            setGroups(prev => ({
                ...prev,
                [personGroup.id]: {
                    ...personGroup,
                    members: updatedMembers,
                    updatedAt: Date.now()
                }
            }));
            console.log('✅ Member deleted from local state');
        } catch (error) {
            console.error('❌ Error deleting member:', error);
            alert('Failed to delete member. Please try again.');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!familyId) return;

        console.log('🗑️ Deleting group:', groupId);

        try {
            const groupToDelete = groups[groupId];
            if (!groupToDelete) {
                console.error('❌ Group not found:', groupId);
                return;
            }

            console.log('🗑️ Deleting group:', groupToDelete.name, 'with', groupToDelete.members.length, 'members');

            // Find the parent person who has this sub-group
            let parentPerson: Person | undefined;
            let parentGroup: Group | undefined;

            for (const group of Object.values(groups)) {
                const person = group.members.find(m => m.subGroupId === groupId);
                if (person) {
                    parentPerson = person;
                    parentGroup = group;
                    break;
                }
            }

            // Delete from Firestore
            const { deleteGroup, updateGroup } = await import('./services/firebase.service');
            await deleteGroup(familyId, groupId);
            console.log('✅ Group deleted from Firestore');

            // If there's a parent person, remove their subGroupId
            if (parentPerson && parentGroup) {
                console.log('🔗 Removing subGroupId from parent person:', parentPerson.name);

                // Remove subGroupId by destructuring and omitting it (Firestore doesn't accept undefined)
                const updatedMembers = parentGroup.members.map(m => {
                    if (m.id === parentPerson.id) {
                        const { subGroupId, ...personWithoutSubGroup } = m;
                        return personWithoutSubGroup;
                    }
                    return m;
                });

                await updateGroup(familyId, parentGroup.id, { members: updatedMembers });
                console.log('✅ Parent person updated in Firestore');

                // Update local state for parent group (here we can use undefined for local state)
                setGroups(prev => ({
                    ...prev,
                    [parentGroup.id]: {
                        ...parentGroup,
                        members: parentGroup.members.map(m =>
                            m.id === parentPerson.id ? { ...m, subGroupId: undefined } : m
                        ),
                        updatedAt: Date.now()
                    }
                }));
            }

            // Update local state - remove the group
            setGroups(prev => {
                const newGroups = { ...prev };
                delete newGroups[groupId];
                return newGroups;
            });

            // If we're currently viewing this group, navigate to first group
            if (currentGroup?.id === groupId) {
                const remainingGroups = Object.values(groups).filter(g => g.id !== groupId);
                if (remainingGroups.length > 0) {
                    setNavigationHistory([remainingGroups[0].id]);
                }
            }

            console.log('✅ Group deleted from local state');
            setShowEditGroup(false);
        } catch (error) {
            console.error('❌ Error deleting group:', error);
            alert('Failed to delete group. Please try again.');
        }
    };

    const handleCreateGroup = () => {
        setShowAddGroup(true);
    };

    const handleAddGroup = async (groupData: { name: string; description?: string; slug: string }) => {
        // Create a new family and root group
        const newFamilyId = `family_${Date.now()}`;
        const newGroupId = generateId();
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: groupData.name,
            description: groupData.description || '',
            slug: groupData.slug,
            members: []
            // No parentGroupId - this is a root group
        };

        try {
            // Create new family
            await createFamily(newFamilyId, groupData.name, groupData.description || '');

            // Create root group under new family
            await createGroup(newFamilyId, newGroup);

            // Update state to the new family
            setFamilyId(newFamilyId);
            setFamilyName(groupData.name);
            setGroups({ [newGroupId]: { ...newGroup, createdAt: Date.now(), updatedAt: Date.now() } });
            setCurrentGroupId(newGroupId);
            setNavigationHistory([newGroupId]);

            // Navigate to the new root group's URL
            if (newGroup.slug) {
                navigate(`/${newGroup.slug}`, { replace: true });
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        }
    };

    const handleToggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const handleToggleAdminMode = () => {
        setIsAdminMode(prev => !prev);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);

        // Auto-expand all sub-groups when searching to show results
        if (query.trim()) {
            const allSubGroupIds = new Set<string>();

            // Recursively find all sub-groups
            const findAllSubGroups = (groupId: string) => {
                const group = groups[groupId];
                if (!group) return;

                group.members.forEach(member => {
                    if (member.subGroupId) {
                        allSubGroupIds.add(member.subGroupId);
                        findAllSubGroups(member.subGroupId); // Recursive for nested sub-groups
                    }
                });
            };

            // Start from current group
            if (currentGroupId) {
                findAllSubGroups(currentGroupId);
            }

            setExpandedGroups(allSubGroupIds);
        } else {
            // Clear expansion when search is cleared
            setExpandedGroups(new Set());
        }
    };

    if (isLoading) {
        return (
            <div className="app">
                <div className="loading-screen">
                    <div className="loading-spinner"></div>
                    <h2>Loading {familyName || 'family'}...</h2>
                    <p>Connecting to Firebase</p>
                </div>
            </div>
        );
    }

    if (!currentGroup) {
        return (
            <div className="app">
                <ModernHeader
                    darkMode={darkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    onNavigateHome={() => { }}
                    familyName="FamilyLinX"
                    isAdminMode={isAdminMode}
                    onToggleAdminMode={handleToggleAdminMode}
                    onCreateNewPage={handleCreateGroup}
                    onManageAlbums={() => { }}
                />
                <div className="container">
                    <div className="empty-state" style={{ marginTop: '4rem' }}>
                        <div className="empty-icon">📁</div>
                        <h3>No group selected</h3>
                        <p>Create a new group to get started</p>
                        <button className="btn btn-primary" onClick={handleCreateGroup} style={{ marginTop: '1rem' }}>
                            <span>➕</span>
                            Create Group
                        </button>
                    </div>
                </div>

                {/* Error Modal for Invalid URLs */}
                {errorMessage && (
                    <div className="modal-backdrop fade-in" onClick={() => setErrorMessage(null)}>
                        <div
                            className="modal-container"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '500px',
                                textAlign: 'center',
                                padding: '2rem'
                            }}
                        >
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '1rem',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                }}>
                                    🔍
                                </div>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: 'var(--error-600)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Page Not Found
                                </h2>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    marginBottom: '1rem',
                                    color: 'var(--gray-700)'
                                }}>
                                    {errorMessage}
                                </p>
                                <div style={{
                                    backgroundColor: 'var(--primary-50)',
                                    border: '1px solid var(--primary-200)',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    marginTop: '1rem'
                                }}>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--primary-700)',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span>💡</span>
                                        <span>Check the URL in your browser's address bar and correct it.</span>
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setErrorMessage(null)}
                                    style={{
                                        minWidth: '120px',
                                        padding: '0.75rem 2rem',
                                        fontSize: '1rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Handler for creating new page
    const handleCreateNewPage = async (pageData: { name: string; description?: string; slug: string }) => {
        console.log('Creating new page:', pageData);

        try {
            // Create a new family and root group
            const newFamilyId = `family_${Date.now()}`;
            const newGroupId = generateId();
            const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
                id: newGroupId,
                name: pageData.name,
                description: pageData.description || '',
                slug: pageData.slug,
                members: []
                // No parentGroupId - this is a root group
            };

            // Create new family
            await createFamily(newFamilyId, pageData.name, pageData.description || '');

            // Create root group under new family
            await createGroup(newFamilyId, newGroup);

            // Show success modal
            setSuccessMessage({
                title: pageData.name,
                message: 'Your new page has been created successfully!',
                url: `/${pageData.slug}`
            });
        } catch (error) {
            console.error('Error creating page:', error);
            alert('Failed to create page. Please try again.');
        }
    };

    // Handler for album management
    const handleAddAlbum = async (album: Omit<Album, 'id' | 'createdAt'>) => {
        if (!familyId) return;

        try {
            const albumId = await createAlbumInFirebase(familyId, album);
            const newAlbum: Album = {
                ...album,
                id: albumId,
                createdAt: Date.now(),
            };
            setAlbums([...albums, newAlbum]);
        } catch (error) {
            console.error('Error creating album:', error);
            // Fallback to local-only if Firebase fails
            const newAlbum: Album = {
                ...album,
                id: generateId(),
                createdAt: Date.now(),
            };
            setAlbums([...albums, newAlbum]);
        }
    };

    const handleUpdateAlbum = async (id: string, updates: Partial<Album>) => {
        if (!familyId) return;

        try {
            await updateAlbumInFirebase(familyId, id, updates);
            setAlbums(albums.map(album => album.id === id ? { ...album, ...updates } : album));
        } catch (error) {
            console.error('Error updating album:', error);
            // Still update local state
            setAlbums(albums.map(album => album.id === id ? { ...album, ...updates } : album));
        }
    };

    const handleDeleteAlbum = async (id: string) => {
        if (!familyId) return;

        try {
            await deleteAlbumInFirebase(familyId, id);
            setAlbums(albums.filter(album => album.id !== id));
        } catch (error) {
            console.error('Error deleting album:', error);
            // Still update local state
            setAlbums(albums.filter(album => album.id !== id));
        }
    };

    return (
        <div className="app">
            <ModernHeader
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onNavigateHome={handleNavigateHome}
                familyName={familyName}
                isAdminMode={isAdminMode}
                onToggleAdminMode={handleToggleAdminMode}
                onCreateNewPage={() => setShowCreatePage(true)}
                onManageAlbums={() => setShowAlbumManagement(true)}
            />

            {/* Hero Section - Only for root groups */}
            {!currentGroup?.parentGroupId && (
                <HeroSection
                    group={currentGroup}
                    allGroups={groups}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                />
            )}

            <main className="app-main">
                <div className="container">
                    <GroupView
                        group={currentGroup}
                        allGroups={groups}
                        expandedGroups={expandedGroups}
                        breadcrumbs={getBreadcrumbs()}
                        onNavigateToBreadcrumb={handleNavigateToBreadcrumb}
                        onCreateSubGroup={handleCreateSubGroup}
                        onToggleSubGroup={handleToggleSubGroup}
                        onUpdateMember={handleUpdateMember}
                        onDeleteMember={handleDeleteMember}
                        onEditGroup={handleEditAnyGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onAddMember={handleAddMemberToAnyGroup}
                        searchQuery={searchQuery}
                        depth={0}
                        isAdminMode={isAdminMode}
                    />
                </div>
            </main>

            <footer className="app-footer">
                <div className="container">
                    <p>FamilyLinX © Idiahus 2025 - {familyName}</p>
                </div>
            </footer>

            {showAddGroup && (
                <AddGroupModal
                    onClose={() => setShowAddGroup(false)}
                    onSave={handleAddGroup}
                    existingGroups={groups}
                />
            )}

            {showAddMember && (
                <AddMemberModal
                    onClose={() => setShowAddMember(false)}
                    onAdd={handleAddMember}
                />
            )}

            {showEditGroup && currentGroup && (() => {
                console.log('🔧 Rendering EditGroupModal, onSave type:', typeof handleEditGroup);
                console.log('🔧 handleEditGroup function:', handleEditGroup);
                return (
                    <EditGroupModal
                        group={currentGroup}
                        onClose={() => setShowEditGroup(false)}
                        onSave={handleEditGroup}
                        onDelete={handleDeleteGroup}
                        existingGroups={groups}
                    />
                );
            })()}

            {/* Error Modal for Invalid URLs */}
            {errorMessage && (
                <div className="modal-backdrop fade-in" onClick={() => setErrorMessage(null)}>
                    <div
                        className="modal-container"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '500px',
                            textAlign: 'center',
                            padding: '2rem'
                        }}
                    >
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: '1rem',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}>
                                🔍
                            </div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'var(--error-600)',
                                marginBottom: '0.5rem'
                            }}>
                                Page Not Found
                            </h2>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                marginBottom: '1rem',
                                color: 'var(--gray-700)'
                            }}>
                                {errorMessage}
                            </p>
                            <div style={{
                                backgroundColor: 'var(--primary-50)',
                                border: '1px solid var(--primary-200)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                marginTop: '1rem'
                            }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--primary-700)',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>💡</span>
                                    <span>Check the URL in your browser's address bar and correct it.</span>
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setErrorMessage(null)}
                                style={{
                                    minWidth: '120px',
                                    padding: '0.75rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Page Modal */}
            {showCreatePage && (
                <CreatePageModal
                    onClose={() => setShowCreatePage(false)}
                    onSave={handleCreateNewPage}
                    existingSlugs={existingRootSlugs}
                />
            )}

            {/* Album Management Modal */}
            {showAlbumManagement && (
                <AlbumManagementModal
                    onClose={() => setShowAlbumManagement(false)}
                    albums={albums}
                    onAddAlbum={handleAddAlbum}
                    onUpdateAlbum={handleUpdateAlbum}
                    onDeleteAlbum={handleDeleteAlbum}
                />
            )}

            {/* Success Modal */}
            {successMessage && (
                <div className="modal-backdrop fade-in" onClick={() => setSuccessMessage(null)}>
                    <div
                        className="modal-container"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '500px',
                            textAlign: 'center',
                            padding: '2rem'
                        }}
                    >
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: '1rem',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}>
                                ✅
                            </div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: 'var(--success-600)',
                                marginBottom: '0.5rem'
                            }}>
                                Page Created Successfully!
                            </h2>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                marginBottom: '1rem',
                                color: 'var(--gray-700)'
                            }}>
                                <strong>{successMessage.title}</strong> {successMessage.message}
                            </p>
                            <div style={{
                                backgroundColor: 'var(--primary-50)',
                                border: '1px solid var(--primary-200)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                marginTop: '1rem'
                            }}>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--primary-700)',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>🔗</span>
                                    <span>Access your page at: <code style={{
                                        backgroundColor: 'var(--primary-100)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontFamily: 'monospace'
                                    }}>{successMessage.url}</code></span>
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSuccessMessage(null)}
                                style={{
                                    minWidth: '120px',
                                    padding: '0.75rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}
                            >
                                Close
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    navigate(successMessage.url, { replace: true });
                                    setSuccessMessage(null);
                                }}
                                style={{
                                    minWidth: '120px',
                                    padding: '0.75rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: '600'
                                }}
                            >
                                Visit Page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
