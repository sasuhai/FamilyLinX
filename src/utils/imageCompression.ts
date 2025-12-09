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
 * Compress and resize an image file using stepped approach
 */
export const compressImage = async (
    file: File,
    options: CompressImageOptions = {}
): Promise<File> => {
    const {
        maxSizeMB = 0.2
    } = options;

    console.log(`Starting compression for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Convert HEIC to JPEG first if needed
    let processFile = file;
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            processFile = await convertHeicToJpeg(file);
        } catch (error) {
            throw error; // Re-throw HEIC conversion errors
        }
    }

    // Target size in bytes
    const targetSizeBytes = maxSizeMB * 1024 * 1024;
    console.log(`Target size: ${maxSizeMB}MB (${targetSizeBytes} bytes)`);

    // If file is already small enough, return it
    if (processFile.size <= targetSizeBytes) {
        console.log('File is already small enough, skipping compression');
        return processFile;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = async () => {
                const originalWidth = img.width;
                const originalHeight = img.height;

                // Define compression steps: [maxDimension, quality]
                const steps = [
                    [1600, 0.8],
                    [1200, 0.7],
                    [800, 0.6],
                    [600, 0.5]
                ];

                let compressedFile: File | null = null;
                const outputType = 'image/jpeg';

                for (const [maxDim, stepQuality] of steps) {
                    console.log(`Attempting compression: max ${maxDim}px, quality ${stepQuality}`);

                    // Calculate dimensions
                    let width = originalWidth;
                    let height = originalHeight;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = (height / width) * maxDim;
                            width = maxDim;
                        } else {
                            width = (width / height) * maxDim;
                            height = maxDim;
                        }
                    }

                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    // Draw (white background for PNGs)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress
                    const blob = await new Promise<Blob | null>(resolveBlob =>
                        canvas.toBlob(b => resolveBlob(b), outputType, stepQuality)
                    );

                    if (!blob) continue;

                    const tempFile = new File(
                        [blob],
                        processFile.name.replace(/\.(png|gif|webp|tiff|bmp)$/i, '.jpg'),
                        { type: outputType, lastModified: Date.now() }
                    );

                    console.log(`Result: ${(tempFile.size / 1024 / 1024).toFixed(3)}MB`);

                    if (tempFile.size <= targetSizeBytes) {
                        compressedFile = tempFile;
                        break; // Success!
                    }
                }

                if (compressedFile) {
                    console.log(`FINAL Compressed ${processFile.name}: ${(processFile.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                    resolve(compressedFile);
                } else {
                    console.error('Failed to compress under limit even with aggressive steps');
                    reject(new Error(`Could not compress image under ${maxSizeMB}MB. Please try a smaller or simpler image.`));
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
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

    // Ensure we are strict about the limit if not provided
    const safeOptions = {
        ...options,
        maxSizeMB: options.maxSizeMB || 0.3
    };

    console.log('Batch compression options:', safeOptions);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
            const compressed = await compressImage(file, safeOptions);
            compressedFiles.push(compressed);
            if (onProgress) onProgress(i + 1, files.length);
        } catch (error) {
            console.error(`Failed to compress ${file.name}:`, error);
            // Throw error to alert user, NEVER fallback to original
            throw error;
        }
    }

    return compressedFiles;
};

/**
 * Format file size for display
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
 */
export const validateImageFile = (file: File): true | string => {
    const maxSize = 20 * 1024 * 1024; // Allow larger input files (up to 20MB) since we compress them aggressively
    if (file.size > maxSize) {
        return `File too large. Maximum input size is ${formatFileSize(maxSize)}`;
    }

    const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const isAllowedType = allowedTypes.includes(file.type);

    if (!isHeic && !isAllowedType && !file.type.startsWith('image/')) {
        return 'Only JPEG, PNG, WebP, GIF, and HEIC images are allowed';
    }

    return true;
};
