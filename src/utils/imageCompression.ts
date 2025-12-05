/**
 * Image compression and resizing utilities
 */

import heic2any from 'heic2any';

export interface CompressImageOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
}

/**
 * Convert HEIC to JPEG
 * @param file - HEIC file
 * @returns JPEG file
 */
const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
        const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9
        });

        // heic2any can return Blob or Blob[]
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

        return new File(
            [blob],
            file.name.replace(/\.heic$/i, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
        );
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error('Failed to convert HEIC image. Please use JPG or PNG.');
    }
};

/**
 * Compress and resize an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export const compressImage = async (
    file: File,
    options: CompressImageOptions = {}
): Promise<File> => {
    const {
        maxSizeMB = 1,
        maxWidthOrHeight = 1920,
        quality = 0.8
    } = options;

    // Convert HEIC to JPEG first if needed
    let processFile = file;
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            processFile = await convertHeicToJpeg(file);
        } catch (error) {
            throw error; // Re-throw HEIC conversion errors
        }
    }

    // If file is already small enough, return it
    const fileSizeMB = processFile.size / 1024 / 1024;
    if (fileSizeMB <= maxSizeMB) {
        return processFile;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    if (width > height) {
                        height = (height / width) * maxWidthOrHeight;
                        width = maxWidthOrHeight;
                    } else {
                        width = (width / height) * maxWidthOrHeight;
                        height = maxWidthOrHeight;
                    }
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File(
                            [blob],
                            processFile.name.replace(/\.heic$/i, '.jpg'),
                            {
                                type: processFile.type || 'image/jpeg',
                                lastModified: Date.now()
                            }
                        );

                        resolve(compressedFile);
                    },
                    processFile.type || 'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(processFile);
    });
};

/**
 * Compress multiple images
 * @param files - Array of image files
 * @param options - Compression options
 * @param onProgress - Progress callback
 * @returns Array of compressed files
 */
export const compressImages = async (
    files: File[],
    options: CompressImageOptions = {},
    onProgress?: (current: number, total: number) => void
): Promise<File[]> => {
    const compressedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
            const compressed = await compressImage(file, options);
            compressedFiles.push(compressed);

            if (onProgress) {
                onProgress(i + 1, files.length);
            }
        } catch (error) {
            console.error(`Failed to compress ${file.name}:`, error);
            // Use original file if compression fails
            compressedFiles.push(file);
        }
    }

    return compressedFiles;
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if valid, error message if invalid
 */
export const validateImageFile = (file: File): true | string => {
    // Check file size (max 10MB before compression)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return `File too large. Maximum size is ${formatFileSize(maxSize)}`;
    }

    // Check file type - allow HEIC
    const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const isAllowedType = allowedTypes.includes(file.type);

    if (!isHeic && !isAllowedType && !file.type.startsWith('image/')) {
        return 'Only JPEG, PNG, WebP, GIF, and HEIC images are allowed';
    }

    return true;
};
