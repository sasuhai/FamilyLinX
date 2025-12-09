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

interface PhotoDetail {
    photoUrl: string;
    memberName: string;
    groupName: string;
    familyName: string;
    yearTaken: number;
    photoId: string;
    estimatedSize: number; // in KB
}

type TabType = 'groups' | 'members' | 'photos';
type GroupSortField = 'familyName' | 'groupName' | 'slug' | 'url' | 'memberCount' | 'photoCount' | 'createdAt';
type PhotoSortField = 'memberName' | 'groupName' | 'familyName' | 'yearTaken' | 'estimatedSize';
type SortDirection = 'asc' | 'desc';

export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('groups');
    const [groups, setGroups] = useState<GroupWithFamily[]>([]);
    const [photos, setPhotos] = useState<PhotoDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [groupSortField, setGroupSortField] = useState<GroupSortField>('familyName');
    const [photoSortField, setPhotoSortField] = useState<PhotoSortField>('memberName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [totalMembers, setTotalMembers] = useState(0);
    const [estimatedStorageSize, setEstimatedStorageSize] = useState(0);
    const [estimatedDbSize, setEstimatedDbSize] = useState(0);

    // Compression states
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState<{
        total: number;
        processed: number;
        successful: number;
        failed: number;
        skipped: number;
    } | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const allGroups: GroupWithFamily[] = [];
            const allPhotos: PhotoDetail[] = [];
            let photoCounter = 0;
            let memberCounter = 0;

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

                for (const groupDoc of groupsSnap.docs) {
                    const group = groupDoc.data() as Group;
                    const memberCount = group.members?.length || 0;
                    const photoCount = group.members?.reduce((total, member) =>
                        total + (member.photos?.length || 0), 0) || 0;

                    photoCounter += photoCount;
                    memberCounter += memberCount;

                    // Collect photo details with actual sizes (fetch in parallel for performance)
                    const { getPhotoSize } = await import('../services/firebase.service');

                    // Build array of photo data with size fetching promises
                    const photoPromises = [];
                    for (const member of group.members) {
                        for (const photo of member.photos) {
                            photoPromises.push(
                                getPhotoSize(photo.url)
                                    .then(photoSize => ({
                                        photoUrl: photo.url,
                                        memberName: member.name,
                                        groupName: group.name,
                                        familyName,
                                        yearTaken: photo.yearTaken,
                                        photoId: photo.id,
                                        estimatedSize: Math.round(photoSize / 1024) // Convert to KB
                                    }))
                                    .catch(error => {
                                        console.error(`Error getting size for photo ${photo.id}:`, error);
                                        return {
                                            photoUrl: photo.url,
                                            memberName: member.name,
                                            groupName: group.name,
                                            familyName,
                                            yearTaken: photo.yearTaken,
                                            photoId: photo.id,
                                            estimatedSize: 500 // Default 500KB if error
                                        };
                                    })
                            );
                        }
                    }

                    // Wait for all photo sizes to be fetched in parallel
                    const groupPhotos = await Promise.all(photoPromises);
                    allPhotos.push(...groupPhotos);

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
                }

            }

            setGroups(allGroups);
            setPhotos(allPhotos);
            setTotalPhotos(photoCounter);
            setTotalMembers(memberCounter);

            // Calculate actual storage size from real photo sizes (in KB)
            const totalStorageKB = allPhotos.reduce((sum, photo) => sum + photo.estimatedSize, 0);
            const actualStorageMB = totalStorageKB / 1024;
            setEstimatedStorageSize(actualStorageMB);


            // Estimate database size (rough estimate based on JSON size)
            const dbDataString = JSON.stringify(allGroups);
            const dbSizeBytes = new Blob([dbDataString]).size;
            const dbSizeMB = dbSizeBytes / (1024 * 1024);
            setEstimatedDbSize(dbSizeMB);

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please check your Firebase configuration.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompressAllPhotos = async () => {
        const photosOver02MB = photos.filter(p => p.estimatedSize > 200).length;

        if (photosOver02MB === 0) {
            alert('All photos are already under 0.2MB!');
            return;
        }

        const confirmed = window.confirm(
            `This will compress ${photosOver02MB} photos that are larger than 0.2MB.\n\n` +
            `⚠️ WARNING: This process:\n` +
            `- Will replace existing photos with compressed versions\n` +
            `- Cannot be undone\n` +
            `- May take several minutes\n\n` +
            `Do you want to continue?`
        );

        if (!confirmed) return;

        setIsCompressing(true);
        setCompressionProgress({ total: 0, processed: 0, successful: 0, failed: 0, skipped: 0 });

        try {
            const { compressAllPhotos } = await import('../utils/compressAllPhotos');

            const result = await compressAllPhotos((progress) => {
                setCompressionProgress(progress);
            });

            // Reload data after compression
            await loadAllData();

            const { calculateStorageSavings } = await import('../utils/compressAllPhotos');
            const savings = calculateStorageSavings(result);

            alert(
                `Compression complete!\n\n` +
                `Total photos: ${result.total}\n` +
                `Successfully compressed: ${result.successful}\n` +
                `Skipped (already < 0.2MB): ${result.skipped}\n` +
                `Failed: ${result.failed}\n\n` +
                `Storage saved: ${savings.savedMB.toFixed(2)}MB (${savings.savedPercentage.toFixed(1)}%)`
            );

        } catch (error) {
            console.error('Error compressing photos:', error);
            alert(`Failed to compress photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCompressing(false);
            setCompressionProgress(null);
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

    const handleGroupSort = (field: GroupSortField) => {
        if (groupSortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setGroupSortField(field);
            setSortDirection('asc');
        }
    };

    const handlePhotoSort = (field: PhotoSortField) => {
        if (photoSortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPhotoSortField(field);
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

            switch (groupSortField) {
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

    const getSortedPhotos = () => {
        let filtered = photos;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = photos.filter(p =>
                p.memberName.toLowerCase().includes(query) ||
                p.groupName.toLowerCase().includes(query) ||
                p.familyName.toLowerCase().includes(query) ||
                p.yearTaken.toString().includes(query)
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (photoSortField) {
                case 'memberName':
                    aValue = a.memberName;
                    bValue = b.memberName;
                    break;
                case 'groupName':
                    aValue = a.groupName;
                    bValue = b.groupName;
                    break;
                case 'familyName':
                    aValue = a.familyName;
                    bValue = b.familyName;
                    break;
                case 'yearTaken':
                    aValue = a.yearTaken;
                    bValue = b.yearTaken;
                    break;
                case 'estimatedSize':
                    aValue = a.estimatedSize;
                    bValue = b.estimatedSize;
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
    const sortedPhotos = getSortedPhotos();

    const GroupSortIcon = ({ field }: { field: GroupSortField }) => {
        if (groupSortField !== field) return <span className="sort-icon">↕️</span>;
        return <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const PhotoSortIcon = ({ field }: { field: PhotoSortField }) => {
        if (photoSortField !== field) return <span className="sort-icon">↕️</span>;
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
                    <h2>Loading data...</h2>
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
                        <p className="admin-subtitle">Manage all groups, members, and photos across all families</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab ${activeTab === 'groups' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('groups');
                                setSearchQuery('');
                            }}
                        >
                            📊 Groups
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'members' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('members');
                                setSearchQuery('');
                            }}
                        >
                            👥 Members
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('photos');
                                setSearchQuery('');
                            }}
                        >
                            📸 Photos
                        </button>
                    </div>

                    {/* Groups Tab */}
                    {activeTab === 'groups' && (
                        <>
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
                                            <th onClick={() => handleGroupSort('familyName')} className="sortable">
                                                Family Name <GroupSortIcon field="familyName" />
                                            </th>
                                            <th onClick={() => handleGroupSort('groupName')} className="sortable">
                                                Group Name <GroupSortIcon field="groupName" />
                                            </th>
                                            <th onClick={() => handleGroupSort('slug')} className="sortable">
                                                Slug <GroupSortIcon field="slug" />
                                            </th>
                                            <th onClick={() => handleGroupSort('url')} className="sortable">
                                                URL <GroupSortIcon field="url" />
                                            </th>
                                            <th onClick={() => handleGroupSort('memberCount')} className="sortable">
                                                Members <GroupSortIcon field="memberCount" />
                                            </th>
                                            <th onClick={() => handleGroupSort('photoCount')} className="sortable">
                                                Photos <GroupSortIcon field="photoCount" />
                                            </th>
                                            <th onClick={() => handleGroupSort('createdAt')} className="sortable">
                                                Created <GroupSortIcon field="createdAt" />
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
                        </>
                    )}

                    {/* Members Tab - Placeholder */}
                    {activeTab === 'members' && (
                        <div className="placeholder-tab">
                            <div className="placeholder-content">
                                <h2>👥 Members</h2>
                                <p>Members management interface coming soon...</p>
                                <div className="placeholder-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Members</span>
                                        <span className="stat-value">{totalMembers}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Photos Tab */}
                    {activeTab === 'photos' && (
                        <>
                            <div className="admin-controls">
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by member name, group, family, or year..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Photos</span>
                                        <span className="stat-value">{photos.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Total Storage</span>
                                        <span className="stat-value">{formatSize(estimatedStorageSize)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Over 0.3MB</span>
                                        <span className="stat-value" style={{ color: photos.filter(p => p.estimatedSize > 300).length > 0 ? '#ef4444' : '#10b981' }}>
                                            {photos.filter(p => p.estimatedSize > 300).length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCompressAllPhotos}
                                        disabled={isCompressing || photos.filter(p => p.estimatedSize > 300).length === 0}
                                        className="btn-small btn-primary"
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {isCompressing ? '⏳ Compressing...' : '🗜️ Compress All Photos'}
                                    </button>
                                </div>
                            </div>

                            {/* Compression Progress */}
                            {isCompressing && compressionProgress && (
                                <div className="compression-progress">
                                    <h3>Compressing Photos...</h3>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${compressionProgress.total > 0 ? (compressionProgress.processed / compressionProgress.total) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                    <div className="progress-stats">
                                        <span>Processed: {compressionProgress.processed} / {compressionProgress.total}</span>
                                        <span>✓ {compressionProgress.successful}</span>
                                        <span>⊘ {compressionProgress.skipped}</span>
                                        <span>✗ {compressionProgress.failed}</span>
                                    </div>
                                </div>
                            )}

                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Thumbnail</th>
                                            <th onClick={() => handlePhotoSort('memberName')} className="sortable">
                                                Member Name <PhotoSortIcon field="memberName" />
                                            </th>
                                            <th onClick={() => handlePhotoSort('groupName')} className="sortable">
                                                Group Name <PhotoSortIcon field="groupName" />
                                            </th>
                                            <th onClick={() => handlePhotoSort('familyName')} className="sortable">
                                                Family <PhotoSortIcon field="familyName" />
                                            </th>
                                            <th onClick={() => handlePhotoSort('yearTaken')} className="sortable">
                                                Year Taken <PhotoSortIcon field="yearTaken" />
                                            </th>
                                            <th onClick={() => handlePhotoSort('estimatedSize')} className="sortable">
                                                Size <PhotoSortIcon field="estimatedSize" />
                                            </th>
                                            <th>URL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedPhotos.map((photo, index) => (
                                            <tr key={`${photo.photoId}-${index}`} className={index % 2 === 0 ? 'even' : 'odd'}>
                                                <td>
                                                    <img
                                                        src={photo.photoUrl}
                                                        alt={photo.memberName}
                                                        className="photo-thumbnail"
                                                        loading="lazy"
                                                    />
                                                </td>
                                                <td><strong>{photo.memberName}</strong></td>
                                                <td>{photo.groupName}</td>
                                                <td>{photo.familyName}</td>
                                                <td className="text-center">{photo.yearTaken}</td>
                                                <td className="text-center">{formatSize(photo.estimatedSize / 1024)}</td>
                                                <td>
                                                    <a
                                                        href={photo.photoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="url-link"
                                                        title="View full size"
                                                    >
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {sortedPhotos.length === 0 && (
                                    <div className="empty-state">
                                        <p>No photos found matching your search.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
