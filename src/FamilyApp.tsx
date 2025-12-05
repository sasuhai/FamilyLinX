import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Group, Person, BreadcrumbItem } from './types';
import { Header } from './components/Header';
import { GroupView } from './components/GroupView';
import { AddMemberModal } from './components/AddMemberModal';
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
            setCurrentGroupId(groupId);
            setNavigationHistory(navigationHistory.slice(0, index + 1));
        }
    };

    const handleCreateSubGroup = async (personId: string) => {
        if (!currentGroup || !familyId) return;

        const person = currentGroup.members.find(m => m.id === personId);
        if (!person) return;

        const newGroupId = generateId();
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: `${person.name}'s Family`,
            description: `Sub-group for ${person.name}`,
            members: [],
            parentGroupId: currentGroup.id
        };

        try {
            // Create group in Firebase
            await createGroup(familyId, newGroup);

            // Update person with subGroupId
            const updatedMembers = currentGroup.members.map(m =>
                m.id === personId ? { ...m, subGroupId: newGroupId } : m
            );

            await updateGroup(familyId, currentGroup.id, { members: updatedMembers });

            // Update local state
            setGroups(prev => ({
                ...prev,
                [newGroupId]: { ...newGroup, createdAt: Date.now(), updatedAt: Date.now() },
                [currentGroup.id]: {
                    ...currentGroup,
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
            const newSet = new Set<string>();

            // If this sub-group is already open, close it
            // Otherwise, close all others and open only this one
            if (!prev.has(subGroupId)) {
                newSet.add(subGroupId);
            }

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
        const groupName = prompt('Enter group name:');
        if (!groupName || !familyId) return;

        const newGroupId = generateId();
        const newGroup: Omit<Group, 'createdAt' | 'updatedAt'> = {
            id: newGroupId,
            name: groupName,
            description: '',
            members: []
        };

        createGroup(familyId, newGroup)
            .then(() => {
                setGroups(prev => ({
                    ...prev,
                    [newGroupId]: { ...newGroup, createdAt: Date.now(), updatedAt: Date.now() }
                }));
                setCurrentGroupId(newGroupId);
                setNavigationHistory([newGroupId]);
            })
            .catch(error => {
                console.error('Error creating group:', error);
                alert('Failed to create group. Please try again.');
            });
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
        setSearchQuery(query);
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
            />

            <main className="app-main">
                <div className="container">
                    <div className="group-actions">
                        <button className="btn btn-primary" onClick={() => setShowAddMember(true)}>
                            <span>➕</span>
                            Add Member
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowEditGroup(true)}>
                            <span>✏️</span>
                            Edit Group
                        </button>
                    </div>

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
