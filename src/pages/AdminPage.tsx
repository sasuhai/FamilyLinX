import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase.service';
import type { Group } from '../types';
import { ModernHeader } from '../components/ModernHeader';
import './AdminPage.css';

interface GroupWithFamily {
    familyId: string;
    familyName: string;
    group: Group;
    url: string;
    memberCount: number;
    photoCount: number;
}

type SortField = 'familyName' | 'groupName' | 'slug' | 'url' | 'memberCount' | 'photoCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<GroupWithFamily[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('familyName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [estimatedStorageSize, setEstimatedStorageSize] = useState(0);
    const [estimatedDbSize, setEstimatedDbSize] = useState(0);

    useEffect(() => {
        loadAllGroups();
    }, []);

    const loadAllGroups = async () => {
        setIsLoading(true);
        try {
            const allGroups: GroupWithFamily[] = [];
            let photoCounter = 0;

            // Get all families
            const familiesRef = collection(db, 'families');
            const familiesSnap = await getDocs(familiesRef);

            // For each family, get all groups
            for (const familyDoc of familiesSnap.docs) {
                const familyId = familyDoc.id;
                const familyData = familyDoc.data();
                const familyName = familyData.name || 'Unknown Family';

                // Get groups for this family
                const groupsRef = collection(db, 'families', familyId, 'groups');
                const groupsSnap = await getDocs(groupsRef);

                groupsSnap.forEach(groupDoc => {
                    const group = groupDoc.data() as Group;
                    const memberCount = group.members?.length || 0;
                    const photoCount = group.members?.reduce((total, member) =>
                        total + (member.photos?.length || 0), 0) || 0;

                    photoCounter += photoCount;

                    // Determine URL based on whether it's a root group or sub-group
                    const isRootGroup = !group.parentGroupId;
                    const url = isRootGroup
                        ? `/${group.slug || familyId}`
                        : `/${getRootSlug(groupsSnap.docs, group)}/${group.slug || group.id}`;

                    allGroups.push({
                        familyId,
                        familyName,
                        group,
                        url,
                        memberCount,
                        photoCount
                    });
                });
            }

            setGroups(allGroups);
            setTotalPhotos(photoCounter);

            // Estimate storage size (assuming average 0.5MB per photo after compression)
            const avgPhotoSizeMB = 0.5;
            const estimatedStorage = photoCounter * avgPhotoSizeMB;
            setEstimatedStorageSize(estimatedStorage);

            // Estimate database size (rough estimate based on JSON size)
            const dbDataString = JSON.stringify(allGroups);
            const dbSizeBytes = new Blob([dbDataString]).size;
            const dbSizeMB = dbSizeBytes / (1024 * 1024);
            setEstimatedDbSize(dbSizeMB);

        } catch (error) {
            console.error('Error loading groups:', error);
            alert('Failed to load groups. Please check your Firebase configuration.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to find root slug
    const getRootSlug = (groupDocs: any[], currentGroup: Group): string => {
        if (!currentGroup.parentGroupId) return currentGroup.slug || 'unknown';

        // Find parent recursively
        let parentId = currentGroup.parentGroupId;
        while (parentId) {
            const parentDoc = groupDocs.find(doc => doc.id === parentId);
            if (!parentDoc) break;
            const parentGroup = parentDoc.data() as Group;
            if (!parentGroup.parentGroupId) {
                return parentGroup.slug || 'unknown';
            }
            parentId = parentGroup.parentGroupId;
        }
        return 'unknown';
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortedGroups = () => {
        let filtered = groups;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = groups.filter(g =>
                g.familyName.toLowerCase().includes(query) ||
                g.group.name.toLowerCase().includes(query) ||
                g.group.slug?.toLowerCase().includes(query) ||
                g.url.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'familyName':
                    aValue = a.familyName;
                    bValue = b.familyName;
                    break;
                case 'groupName':
                    aValue = a.group.name;
                    bValue = b.group.name;
                    break;
                case 'slug':
                    aValue = a.group.slug || '';
                    bValue = b.group.slug || '';
                    break;
                case 'url':
                    aValue = a.url;
                    bValue = b.url;
                    break;
                case 'memberCount':
                    aValue = a.memberCount;
                    bValue = b.memberCount;
                    break;
                case 'photoCount':
                    aValue = a.photoCount;
                    bValue = b.photoCount;
                    break;
                case 'createdAt':
                    // Handle Firestore Timestamp objects
                    const aTimestamp: any = a.group.createdAt;
                    const bTimestamp: any = b.group.createdAt;

                    if (aTimestamp && typeof aTimestamp === 'object' && aTimestamp.toDate) {
                        aValue = aTimestamp.toDate().getTime();
                    } else {
                        aValue = aTimestamp || 0;
                    }

                    if (bTimestamp && typeof bTimestamp === 'object' && bTimestamp.toDate) {
                        bValue = bTimestamp.toDate().getTime();
                    } else {
                        bValue = bTimestamp || 0;
                    }
                    break;
            }

            if (typeof aValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return sortDirection === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });
    };

    const sortedGroups = getSortedGroups();

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="sort-icon">↕️</span>;
        return <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const formatDate = (timestamp?: number | any) => {
        if (!timestamp) return 'N/A';

        // Handle Firestore Timestamp object
        if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        // Handle regular timestamp number
        if (typeof timestamp === 'number') {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        return 'N/A';
    };

    const formatSize = (sizeMB: number): string => {
        if (sizeMB < 1) {
            return `${(sizeMB * 1024).toFixed(2)} KB`;
        } else if (sizeMB < 1024) {
            return `${sizeMB.toFixed(2)} MB`;
        } else {
            return `${(sizeMB / 1024).toFixed(2)} GB`;
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page">
                <div className="loading-screen">
                    <div className="loading-spinner"></div>
                    <h2>Loading groups...</h2>
                </div>
            </div>
        );
    }

    return (
        <>
            <ModernHeader
                darkMode={false}
                onToggleDarkMode={() => { }}
                onNavigateHome={() => navigate('/')}
                familyName="Admin Dashboard"
                isAdminMode={true}
                onToggleAdminMode={() => navigate('/')}
                onCreateNewPage={() => { }}
                onManageAlbums={() => { }}
            />
            <div className="admin-page">
                <div className="admin-content">
                    <div className="admin-header">
                        <button
                            className="back-button"
                            onClick={() => navigate('/')}
                            title="Back to home"
                        >
                            <span className="back-icon">←</span>
                            <span className="back-text">Back</span>
                        </button>
                        <h1>Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage all groups across all families</p>
                    </div>

                    <div className="admin-controls">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by family, group name, slug, or URL..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="stats">
                            <div className="stat-item">
                                <span className="stat-label">Total Groups</span>
                                <span className="stat-value">{groups.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Total Photos</span>
                                <span className="stat-value">{totalPhotos}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Storage Used</span>
                                <span className="stat-value">{formatSize(estimatedStorageSize)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Database Size</span>
                                <span className="stat-value">{formatSize(estimatedDbSize)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('familyName')} className="sortable">
                                        Family Name <SortIcon field="familyName" />
                                    </th>
                                    <th onClick={() => handleSort('groupName')} className="sortable">
                                        Group Name <SortIcon field="groupName" />
                                    </th>
                                    <th onClick={() => handleSort('slug')} className="sortable">
                                        Slug <SortIcon field="slug" />
                                    </th>
                                    <th onClick={() => handleSort('url')} className="sortable">
                                        URL <SortIcon field="url" />
                                    </th>
                                    <th onClick={() => handleSort('memberCount')} className="sortable">
                                        Members <SortIcon field="memberCount" />
                                    </th>
                                    <th onClick={() => handleSort('photoCount')} className="sortable">
                                        Photos <SortIcon field="photoCount" />
                                    </th>
                                    <th onClick={() => handleSort('createdAt')} className="sortable">
                                        Created <SortIcon field="createdAt" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedGroups.map((item, index) => (
                                    <tr key={`${item.familyId}-${item.group.id}`} className={index % 2 === 0 ? 'even' : 'odd'}>
                                        <td>{item.familyName}</td>
                                        <td>
                                            <strong>{item.group.name}</strong>
                                            {item.group.description && (
                                                <div className="group-description">{item.group.description}</div>
                                            )}
                                        </td>
                                        <td>
                                            <code className="slug-code">{item.group.slug || 'N/A'}</code>
                                        </td>
                                        <td>
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="url-link"
                                            >
                                                {item.url}
                                            </a>
                                        </td>
                                        <td className="text-center">{item.memberCount}</td>
                                        <td className="text-center">{item.photoCount}</td>
                                        <td>{formatDate(item.group.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {sortedGroups.length === 0 && (
                            <div className="empty-state">
                                <p>No groups found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
