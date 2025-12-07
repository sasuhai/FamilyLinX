/**
 * Firebase service for managing albums
 * Enhanced with better cloud service thumbnail support
 */

import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Album } from '../components/AlbumManagementModal';

// Collection names
const FAMILIES_COLLECTION = 'families';
const ALBUMS_COLLECTION = 'albums';

/**
 * Get all albums for a family/group
 */
export const getAlbums = async (familyId: string): Promise<Album[]> => {
    const albumsRef = collection(db, FAMILIES_COLLECTION, familyId, ALBUMS_COLLECTION);
    const albumsSnap = await getDocs(albumsRef);

    const albums: Album[] = [];
    albumsSnap.forEach((doc) => {
        const data = doc.data();
        albums.push({
            id: doc.id,
            title: data.title,
            description: data.description || '',
            url: data.url,
            type: data.type,
            albumDate: data.albumDate || '',
            coverUrl: data.coverUrl || '', // Custom cover image URL
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now()
        });
    });

    // Sort by album date (newest first), then by createdAt
    albums.sort((a, b) => {
        if (a.albumDate && b.albumDate) {
            return b.albumDate.localeCompare(a.albumDate);
        }
        if (a.albumDate) return -1;
        if (b.albumDate) return 1;
        return b.createdAt - a.createdAt;
    });

    return albums;
};

/**
 * Create a new album
 */
export const createAlbum = async (
    familyId: string,
    album: Omit<Album, 'id' | 'createdAt'>
): Promise<string> => {
    const albumId = `album_${Date.now()}`;
    const albumRef = doc(db, FAMILIES_COLLECTION, familyId, ALBUMS_COLLECTION, albumId);

    const albumData = {
        ...album,
        id: albumId,
        createdAt: serverTimestamp()
    };

    await setDoc(albumRef, albumData);
    return albumId;
};

/**
 * Update an album
 */
export const updateAlbum = async (
    familyId: string,
    albumId: string,
    updates: Partial<Album>
): Promise<void> => {
    const albumRef = doc(db, FAMILIES_COLLECTION, familyId, ALBUMS_COLLECTION, albumId);
    await updateDoc(albumRef, updates);
};

/**
 * Delete an album
 */
export const deleteAlbum = async (familyId: string, albumId: string): Promise<void> => {
    const albumRef = doc(db, FAMILIES_COLLECTION, familyId, ALBUMS_COLLECTION, albumId);
    await deleteDoc(albumRef);
};

/**
 * Get albums by type
 */
export const getAlbumsByType = async (familyId: string, type: 'photo' | 'video'): Promise<Album[]> => {
    const allAlbums = await getAlbums(familyId);
    return allAlbums.filter(album => album.type === type);
};

/**
 * Detect the platform from a URL
 */
export const detectPlatform = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('drive.google.com')) return 'google-drive';
    if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) return 'google-photos';
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) return 'onedrive';
    if (url.includes('icloud.com')) return 'icloud';
    if (url.includes('dropbox.com')) return 'dropbox';
    if (url.includes('flickr.com')) return 'flickr';
    if (url.includes('imgur.com')) return 'imgur';
    return 'unknown';
};

/**
 * Check if a platform supports automatic thumbnails
 */
export const platformSupportsThumbnail = (url: string): boolean => {
    const platform = detectPlatform(url);
    return ['youtube', 'vimeo', 'google-drive', 'dropbox', 'imgur'].includes(platform);
};

/**
 * Get video thumbnail URL from popular video platforms
 */
export const getVideoThumbnailUrl = (url: string): string => {
    // YouTube - supports multiple URL formats
    const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
    }

    // Vimeo (basic pattern)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    // Google Drive - single video file
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1280`;
        }
    }

    // Dropbox - convert share link to direct link
    if (url.includes('dropbox.com')) {
        // Convert www.dropbox.com/s/xxx/file?dl=0 to dl.dropboxusercontent.com/s/xxx/file
        if (url.includes('dropbox.com/s/') || url.includes('dropbox.com/scl/')) {
            return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
        }
    }

    // Return empty to trigger fallback
    return '';
};

/**
 * Get photo thumbnail URL - enhanced with more services
 */
export const getPhotoThumbnailUrl = (url: string): string => {
    // Google Drive - single file
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
        }
    }

    // Dropbox - convert share link to direct link
    if (url.includes('dropbox.com')) {
        if (url.includes('dropbox.com/s/') || url.includes('dropbox.com/scl/')) {
            return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
        }
    }

    // Imgur - direct image link
    if (url.includes('imgur.com')) {
        // If it's an album, we can't get a thumbnail
        if (url.includes('/a/') || url.includes('/gallery/')) {
            return '';
        }
        // Convert imgur page to direct image
        const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
        if (imgurMatch) {
            return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
        }
    }

    // Flickr - would need API key, so return empty
    if (url.includes('flickr.com')) {
        return '';
    }

    // For services that don't support direct thumbnails, return empty
    // This includes: OneDrive, Google Photos, iCloud
    const platform = detectPlatform(url);
    if (['onedrive', 'google-photos', 'icloud'].includes(platform)) {
        return ''; // Will trigger fallback
    }

    // Try using the URL directly if it looks like a direct image link
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)) {
        return url;
    }

    // Return empty to trigger fallback
    return '';
};

/**
 * Get a platform-specific placeholder image
 */
export const getPlatformPlaceholder = (url: string, type: 'video' | 'photo'): string => {
    const platform = detectPlatform(url);

    // Platform-specific placeholders with relevant imagery
    const placeholders: Record<string, { video: string; photo: string }> = {
        'onedrive': {
            video: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format', // Microsoft style
            photo: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&auto=format'
        },
        'google-photos': {
            video: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&auto=format', // Google style
            photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&auto=format'
        },
        'icloud': {
            video: 'https://images.unsplash.com/photo-1621768216002-5ac171876625?w=800&auto=format', // Apple style
            photo: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&auto=format'
        },
        'default': {
            video: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format',
            photo: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&auto=format'
        }
    };

    const platformPlaceholders = placeholders[platform] || placeholders['default'];
    return type === 'video' ? platformPlaceholders.video : platformPlaceholders.photo;
};

/**
 * Get explanation for why thumbnails don't work for a platform
 */
export const getThumbnailLimitation = (url: string): string | null => {
    const platform = detectPlatform(url);

    const limitations: Record<string, string> = {
        'onedrive': 'OneDrive shared links require authentication and don\'t provide public thumbnail access. Consider uploading a custom cover image.',
        'google-photos': 'Google Photos shared albums don\'t expose direct image URLs for security reasons. Consider uploading a custom cover image.',
        'icloud': 'iCloud shared albums require Apple authentication and don\'t support external embedding. Consider uploading a custom cover image.',
        'flickr': 'Flickr requires an API key for thumbnail access. Consider uploading a custom cover image.',
    };

    return limitations[platform] || null;
};
