import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Group, Person, BreadcrumbItem } from './types';
import { Header } from './components/Header';
import { GroupView } from './components/GroupView';
import { AddMemberModal } from './components/AddMemberModal';
import { AddGroupModal } from './components/AddGroupModal';
import { EditGroupModal } from './components/EditGroupModal';
import { generateId } from './utils/helpers';
import {
    createFamily,
    getFamily,
    getAllGroups,
    createGroup,
    updateGroup,
    addPersonToGroup
} from './services/firebase.service';
import './App.css';

export function FamilyApp() {
    const { familyId } = useParams<{ familyId: string }>();
    const [groups, setGroups] = useState<Record<string, Group>>({});
    const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [showEditGroup, setShowEditGroup] = useState(false);
    const [familyName, setFamilyName] = useState('');

    // Load family data from Firebase
    useEffect(() => {
        const loadFamilyData = async () => {
            if (!familyId) return;

            setIsLoading(true);
            try {
                // Check if family exists
                let family = await getFamily(familyId);

                if (!family) {
                    // Create new family if it doesn't exist
                    const displayName = familyId
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

                    await createFamily(familyId, `${displayName} Family`, 'Welcome to your family group!');

                    // Create main group
                    const mainGroupId = generateId();
                    const mainGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
                        id: mainGroupId,
                        name: `${displayName} Family`,
                        description: 'Our wonderful family through the years',
                        members: []
                    };

                    await createGroup(familyId, mainGroup);

                    setFamilyName(`${displayName} Family`);
                    setGroups({ [mainGroupId]: { ...mainGroup, createdAt: Date.now(), updatedAt: Date.now() } });
                    setCurrentGroupId(mainGroupId);
                    setNavigationHistory([mainGroupId]);
                } else {
                    // Load existing family
                    setFamilyName(family.name);
                    const loadedGroups = await getAllGroups(familyId);
                    setGroups(loadedGroups);

                    // Find root group (no parent)
                    const rootGroup = Object.values(loadedGroups).find(g => !g.parentGroupId);
                    if (rootGroup) {
                        setCurrentGroupId(rootGroup.id);
                        setNavigationHistory([rootGroup.id]);
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
    }, [familyId]);

    useEffect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            darkMode ? 'dark' : 'light'
        );
    }, [darkMode]);

    const currentGroup = currentGroupId ? groups[currentGroupId] : null;

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        return navigationHistory.map(id => ({
            id,
            name: groups[id]?.name || 'Unknown'
        }));
    };

    const handleNavigateToBreadcrumb = (groupId: string) => {
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
    };

    const handleBack = () => {
        if (navigationHistory.length > 1) {
            const newHistory = navigationHistory.slice(0, -1);
            setNavigationHistory(newHistory);
            setCurrentGroupId(newHistory[newHistory.length - 1]);
        }
    };

    const handleNavigateHome = () => {
        if (navigationHistory.length > 0) {
            const firstGroupId = navigationHistory[0];
            setCurrentGroupId(firstGroupId);
            setNavigationHistory([firstGroupId]);
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
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: `${person.name}'s Family`,
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

        if (!currentGroup || !familyId) {
            console.log('❌ Early return: currentGroup or familyId missing');
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
        if (!currentGroup || !familyId) return;

        console.log('🔄 Starting member update...', { personId, updates, newPhotos: newPhotos?.length });

        try {
            const person = currentGroup.members.find(m => m.id === personId);
            if (!person) {
                console.error('❌ Person not found:', personId);
                return;
            }

            console.log('👤 Found person:', person.name, 'Current photos:', person.photos.length);

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
            const updatedMembers = currentGroup.members.map(m =>
                m.id === personId ? updatedPerson : m
            );

            // Remove all undefined values from the entire members array
            const cleanMembers = removeUndefined(updatedMembers);

            console.log('🧹 Cleaned members array');

            await updateGroup(familyId, currentGroup.id, { members: cleanMembers });
            console.log('✅ Firestore updated successfully');

            // Update local state
            setGroups(prev => ({
                ...prev,
                [currentGroup.id]: {
                    ...currentGroup,
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

    const handleCreateGroup = () => {
        setShowAddGroup(true);
    };

    const handleAddGroup = async (groupData: { name: string; description?: string; slug: string }) => {
        if (!familyId) return;

        const newGroupId = generateId();
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: groupData.name,
            description: groupData.description || '',
            slug: groupData.slug,
            members: []
        };

        try {
            await createGroup(familyId, newGroup);

            setGroups(prev => ({
                ...prev,
                [newGroupId]: { ...newGroup, createdAt: Date.now(), updatedAt: Date.now() }
            }));
            setCurrentGroupId(newGroupId);
            setNavigationHistory([newGroupId]);
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        }
    };

    const handleExportData = () => {
        const dataStr = JSON.stringify(groups, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${familyId}_export_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = async (_file: File) => {
        alert('Import functionality coming soon! Data is now stored in Firebase.');
    };

    const handleToggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const handleSearchChange = (query: string) => {
        console.log('🔍 Search query:', query);
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

            console.log('📂 Expanding sub-groups:', Array.from(allSubGroupIds));
            setExpandedGroups(allSubGroupIds);
        } else {
            // Clear expansion when search is cleared
            console.log('🔄 Clearing search, collapsing groups');
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
                <Header
                    darkMode={darkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                    onCreateGroup={handleCreateGroup}
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
            </div>
        );
    }

    return (
        <div className="app">
            <Header
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onCreateGroup={handleCreateGroup}
                onBack={handleBack}
                canGoBack={navigationHistory.length > 1}
                onNavigateHome={handleNavigateHome}
            />

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
                        onEditGroup={handleEditAnyGroup}
                        onAddMember={handleAddMemberToAnyGroup}
                        searchQuery={searchQuery}
                        depth={0}
                    />
                </div>
            </main>

            <footer className="app-footer">
                <div className="container">
                    <p>FamilyLinX © 2025 - {familyName}</p>
                </div>
            </footer>

            {showAddGroup && (
                <AddGroupModal
                    onClose={() => setShowAddGroup(false)}
                    onSave={handleAddGroup}
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
                    />
                );
            })()}
        </div>
    );
}
