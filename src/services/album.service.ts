/**
 * Firebase service for managing albums
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
 * Get video thumbnail URL from popular video platforms
 */
export const getVideoThumbnailUrl = (url: string): string => {
    // YouTube - supports multiple URL formats
    // Standard: youtube.com/watch?v=VIDEO_ID
    // Short: youtu.be/VIDEO_ID
    // Embed: youtube.com/embed/VIDEO_ID
    // Shorts: youtube.com/shorts/VIDEO_ID
    // Playlist: youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
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
            // Use hqdefault (480x360) - always available
            // Other options: mqdefault (320x180), sddefault (640x480), maxresdefault (1280x720 - not always available)
            return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
    }

    // Vimeo (basic pattern)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        // Vumbnail is a service that provides Vimeo thumbnails
        return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1280`;
        }
    }

    // Google Photos - shared albums don't provide direct thumbnail access
    if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
        return url;
    }

    // OneDrive
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
        return url;
    }

    // Default: return original URL (will trigger fallback image in component)
    return url;
};

/**
 * Get photo thumbnail URL
 */
export const getPhotoThumbnailUrl = (url: string): string => {
    // Google Drive
    if (url.includes('drive.google.com')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
        }
    }

    // Google Photos - try to extract thumbnail
    if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
        return url;
    }

    // OneDrive
    if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
        return url;
    }

    // Default: return original URL
    return url;
};
