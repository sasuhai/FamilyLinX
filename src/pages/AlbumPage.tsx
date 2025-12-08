import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernHeader } from '../components/ModernHeader';
import { AlbumManagementModal, type Album } from '../components/AlbumManagementModal';
import {
    getAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    getVideoThumbnailUrl,
    getPhotoThumbnailUrl,
    getPlatformPlaceholder
} from '../services/album.service';
import { getFamilyByRootSlug } from '../services/firebase.service';
import { useLanguage } from '../contexts/LanguageContext';
import './AlbumPage.css';

export const AlbumPage: React.FC = () => {
    const { t } = useLanguage();
    const { rootSlug } = useParams<{ rootSlug: string }>();
    const navigate = useNavigate();

    // State
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [familyName, setFamilyName] = useState('');
    const [albums, setAlbums] = useState<Album[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'photo'>('all');
    const [darkMode, setDarkMode] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showAlbumManagement, setShowAlbumManagement] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('');

    // Load family data
    useEffect(() => {
        const loadFamilyData = async () => {
            if (!rootSlug) return;

            setIsLoading(true);
            try {
                const familyData = await getFamilyByRootSlug(rootSlug);
                if (familyData) {
                    setFamilyId(familyData.familyId);
                    setFamilyName(familyData.family.name);
                }
            } catch (error) {
                console.error('Error loading family data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFamilyData();
    }, [rootSlug]);

    // Load albums
    useEffect(() => {
        const loadAlbums = async () => {
            if (!familyId) {
                console.log('📀 No familyId yet, skipping album load');
                return;
            }

            console.log('📀 Loading albums for familyId:', familyId);
            try {
                const loadedAlbums = await getAlbums(familyId);
                console.log('📀 Albums loaded:', loadedAlbums.length, loadedAlbums);
                setAlbums(loadedAlbums);
            } catch (error) {
                console.error('📀 Error loading albums:', error);
            }
        };

        loadAlbums();
    }, [familyId]);

    // Dark mode
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Navigation handlers
    const handleNavigateHome = () => {
        navigate(`/${rootSlug}`);
    };

    // Album handlers
    const handleAddAlbum = async (albumData: Omit<Album, 'id' | 'createdAt'>) => {
        if (!familyId) return;

        try {
            const albumId = await createAlbum(familyId, albumData);
            const newAlbum: Album = {
                ...albumData,
                id: albumId,
                createdAt: Date.now()
            };
            setAlbums(prev => [newAlbum, ...prev]);
        } catch (error) {
            console.error('Error creating album:', error);
            alert('Failed to create album. Please try again.');
        }
    };

    const handleUpdateAlbum = async (id: string, updates: Partial<Album>) => {
        if (!familyId) return;

        try {
            await updateAlbum(familyId, id, updates);
            setAlbums(prev => prev.map(album =>
                album.id === id ? { ...album, ...updates } : album
            ));
        } catch (error) {
            console.error('Error updating album:', error);
            alert('Failed to update album. Please try again.');
        }
    };

    const handleDeleteAlbum = async (id: string) => {
        if (!familyId) return;

        try {
            await deleteAlbum(familyId, id);
            setAlbums(prev => prev.filter(album => album.id !== id));
        } catch (error) {
            console.error('Error deleting album:', error);
            alert('Failed to delete album. Please try again.');
        }
    };

    // Open album in new tab
    const handleOpenAlbum = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Format album date
    const formatAlbumDate = (albumDate?: string): string => {
        if (!albumDate) return '';
        const [year, month] = albumDate.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Get thumbnail URL with fallback - uses custom cover, then auto-detection, then platform placeholder
    const getThumbnailSrc = (album: Album): string => {
        // First, check if there's a custom cover URL
        if (album.coverUrl) {
            return album.coverUrl;
        }

        // Try to get automatic thumbnail from the URL
        const autoThumbnail = album.type === 'video'
            ? getVideoThumbnailUrl(album.url)
            : getPhotoThumbnailUrl(album.url);

        // If auto-detection returned a valid URL, use it
        if (autoThumbnail) {
            return autoThumbnail;
        }

        // Fall back to platform-specific placeholder
        return getPlatformPlaceholder(album.url, album.type);
    };

    // Get unique years for filter dropdown
    const availableYears = [...new Set(albums
        .filter(a => a.albumDate)
        .map(a => a.albumDate!.split('-')[0])
    )].sort((a, b) => parseInt(b) - parseInt(a));

    // Filtered albums based on search and filters
    const filteredAlbums = albums.filter(album => {
        const matchesSearch = !searchQuery.trim() ||
            album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (album.albumDate && album.albumDate.includes(searchQuery));

        const matchesYear = !yearFilter ||
            (album.albumDate && album.albumDate.startsWith(yearFilter));

        return matchesSearch && matchesYear;
    });

    // Filtered albums by type
    const videoAlbums = filteredAlbums.filter(a => a.type === 'video');
    const photoAlbums = filteredAlbums.filter(a => a.type === 'photo');

    const hasActiveFilters = searchQuery || yearFilter;
    const clearFilters = () => {
        setSearchQuery('');
        setYearFilter('');
    };



    // Render video carousel with seamless infinite scroll
    const renderVideoCarousel = () => {
        if (videoAlbums.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">🎥</div>
                    <h3>{t('albums.noVideos')}</h3>
                    <p>{t('albums.noVideosDesc')}</p>
                </div>
            );
        }

        // Duplicate albums for seamless loop
        const duplicatedAlbums = [...videoAlbums, ...videoAlbums];

        return (
            <div className="infinite-carousel-container">
                <div className="infinite-carousel-track video-track">
                    {duplicatedAlbums.map((album, index) => (
                        <div
                            key={`${album.id}-${index}`}
                            className="infinite-carousel-card video-card"
                            onClick={() => handleOpenAlbum(album.url)}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenAlbum(album.url)}
                        >
                            <img
                                src={getThumbnailSrc(album)}
                                alt={album.title}
                                className="card-thumbnail"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format';
                                }}
                            />
                            <div className="card-overlay" />

                            <div className="play-button">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            <div className="card-content">
                                <div className="type-badge">
                                    <span className="badge-icon">🎥</span>
                                    <span>{t('albums.video')}</span>
                                </div>
                                <h4 className="card-title">{album.title}</h4>
                                {album.albumDate && (
                                    <span className="card-date">{formatAlbumDate(album.albumDate)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render photo carousel with seamless infinite scroll
    const renderPhotoCarousel = () => {
        if (photoAlbums.length === 0) {
            return (
                <div className="empty-state">
                    <div className="empty-icon">📸</div>
                    <h3>{t('albums.noPhotos')}</h3>
                    <p>{t('albums.noPhotosDesc')}</p>
                </div>
            );
        }

        // Duplicate albums for seamless loop
        const duplicatedAlbums = [...photoAlbums, ...photoAlbums];

        return (
            <div className="infinite-carousel-container">
                <div className="infinite-carousel-track photo-track">
                    {duplicatedAlbums.map((album, index) => (
                        <div
                            key={`${album.id}-${index}`}
                            className="infinite-carousel-card photo-card"
                            onClick={() => handleOpenAlbum(album.url)}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenAlbum(album.url)}
                        >
                            <img
                                src={getThumbnailSrc(album)}
                                alt={album.title}
                                className="card-thumbnail"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&auto=format';
                                }}
                            />
                            <div className="card-overlay" />

                            <div className="card-content">
                                <div className="type-badge">
                                    <span className="badge-icon">📸</span>
                                    <span>{t('albums.photoAlbum')}</span>
                                </div>
                                <h4 className="card-title">{album.title}</h4>
                                {album.albumDate && (
                                    <span className="card-date">{formatAlbumDate(album.albumDate)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="album-page">
                <div className="album-loading">
                    <div className="loading-spinner" />
                    <p>{t('albums.loadingAlbums')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="album-page">
            <ModernHeader
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onNavigateHome={handleNavigateHome}
                familyName={familyName}
                isAdminMode={isAdminMode}
                onToggleAdminMode={() => setIsAdminMode(!isAdminMode)}
                onCreateNewPage={() => { }}
                onManageAlbums={() => setShowAlbumManagement(true)}
            />

            <div className="album-container grid-corners">
                <div className="grid-corners-bottom" />

                <div className="album-header">
                    <h1 className="album-title">{familyName} {t('albums.title')}</h1>
                    <p className="album-subtitle">
                        {t('albums.subtitle')}
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="album-tabs">
                    <button
                        className={`album-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        📁 {t('albums.all')}
                        <span className="tab-count">{filteredAlbums.length}</span>
                    </button>
                    <button
                        className={`album-tab ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        🎥 {t('albums.videos')}
                        <span className="tab-count">{videoAlbums.length}</span>
                    </button>
                    <button
                        className={`album-tab ${activeTab === 'photo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photo')}
                    >
                        📸 {t('albums.photos')}
                        <span className="tab-count">{photoAlbums.length}</span>
                    </button>
                </div>

                {/* Search and Filter Section */}
                <div className="album-filter-section">
                    <div className="album-filter-row">
                        <div className="album-search-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('albums.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="album-search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="album-clear-btn"
                                    onClick={() => setSearchQuery('')}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="album-select-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="album-filter-select"
                            >
                                <option value="">{t('albums.allYears')}</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                className="album-clear-all-btn"
                                onClick={clearFilters}
                            >
                                {t('albums.clearFilters')}
                            </button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <div className="album-filter-results">
                            {t('albums.showing')} {filteredAlbums.length} {t('albums.of')} {albums.length} {t('albums.albums')}
                        </div>
                    )}
                </div>

                {/* Video Section */}
                {(activeTab === 'all' || activeTab === 'video') && (
                    <section className="album-section">
                        <div className="section-header">
                            <span className="section-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                {t('albums.videos')}
                            </span>
                            <h2 className="section-title">{t('albums.videoCollection')}</h2>
                        </div>
                        {renderVideoCarousel()}
                    </section>
                )}

                {/* Photo Section */}
                {(activeTab === 'all' || activeTab === 'photo') && (
                    <section className="album-section">
                        <div className="section-header">
                            <span className="section-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                {t('albums.photos')}
                            </span>
                            <h2 className="section-title">{t('albums.photoAlbums')}</h2>
                        </div>
                        {renderPhotoCarousel()}
                    </section>
                )}
            </div>

            {/* Floating Add Button (Admin Only) */}
            {isAdminMode && (
                <button
                    className="add-album-floating-btn"
                    onClick={() => setShowAlbumManagement(true)}
                >
                    ➕ {t('albums.manageAlbums')}
                </button>
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
        </div>
    );
};
