import React, { useState } from 'react';
import { generateId } from '../utils/helpers';
import { compressImages, validateImageFile, formatFileSize } from '../utils/imageCompression';
import type { Person } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import './AddMemberModal.css';

interface AddMemberModalProps {
    onClose: () => void;
    onAdd: (person: Person, photoFiles?: File[], photoYears?: number[]) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAdd }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [yearOfBirth, setYearOfBirth] = useState('');
    const [isDeceased, setIsDeceased] = useState(false);
    const [yearOfDeath, setYearOfDeath] = useState('');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoYears, setPhotoYears] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Validate files
            const invalidFiles: string[] = [];
            const validFiles: File[] = [];

            files.forEach(file => {
                const validation = validateImageFile(file);
                if (validation === true) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(`${file.name}: ${validation}`);
                }
            });

            if (invalidFiles.length > 0) {
                alert('Some files were rejected:\n\n' + invalidFiles.join('\n'));
            }

            if (validFiles.length === 0) {
                return;
            }

            // Compress images
            setIsCompressing(true);
            setCompressionProgress({ current: 0, total: validFiles.length });

            try {
                const compressedFiles = await compressImages(
                    validFiles,
                    {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        quality: 0.8
                    },
                    (current, total) => {
                        setCompressionProgress({ current, total });
                    }
                );

                setPhotoFiles(compressedFiles);
                setPhotoYears(compressedFiles.map(() => new Date().getFullYear()));
            } catch (error) {
                console.error('Error compressing images:', error);
                alert('Failed to process images. Please try again.');
            } finally {
                setIsCompressing(false);
                setCompressionProgress({ current: 0, total: 0 });
            }
        }
    };

    // Handle paste events for images
    const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();

            // Validate files
            const invalidFiles: string[] = [];
            const validFiles: File[] = [];

            imageFiles.forEach(file => {
                const validation = validateImageFile(file);
                if (validation === true) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(`${file.name}: ${validation}`);
                }
            });

            if (invalidFiles.length > 0) {
                alert('Some files were rejected:\n\n' + invalidFiles.join('\n'));
            }

            if (validFiles.length === 0) {
                return;
            }

            // Compress images
            setIsCompressing(true);
            setCompressionProgress({ current: 0, total: validFiles.length });

            try {
                const compressedFiles = await compressImages(
                    validFiles,
                    {
                        maxSizeMB: 0.2,
                        maxWidthOrHeight: 1920,
                        quality: 0.8
                    },
                    (current, total) => {
                        setCompressionProgress({ current, total });
                    }
                );

                // Append to existing photos
                const newPhotoFiles = [...photoFiles, ...compressedFiles];
                const newPhotoYears = [...photoYears, ...compressedFiles.map(() => new Date().getFullYear())];
                console.log('📋 Pasted images processed:', {
                    count: compressedFiles.length,
                    totalPhotos: newPhotoFiles.length,
                    years: newPhotoYears
                });
                setPhotoFiles(newPhotoFiles);
                setPhotoYears(newPhotoYears);
            } catch (error) {
                console.error('Error compressing pasted images:', error);
                alert('Failed to process pasted images. Please try again.');
            } finally {
                setIsCompressing(false);
                setCompressionProgress({ current: 0, total: 0 });
            }
        }
    };

    // Handle paste button click (for mobile)
    const handlePasteButton = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            const imageFiles: File[] = [];

            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        const file = new File([blob], `pasted-image-${Date.now()}.${type.split('/')[1]}`, { type });
                        imageFiles.push(file);
                    }
                }
            }

            if (imageFiles.length === 0) {
                alert('No images found in clipboard. Please copy an image first.');
                return;
            }

            // Validate files
            const invalidFiles: string[] = [];
            const validFiles: File[] = [];

            imageFiles.forEach(file => {
                const validation = validateImageFile(file);
                if (validation === true) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(`${file.name}: ${validation}`);
                }
            });

            if (invalidFiles.length > 0) {
                alert('Some files were rejected:\n\n' + invalidFiles.join('\n'));
            }

            if (validFiles.length === 0) {
                return;
            }

            // Compress images
            setIsCompressing(true);
            setCompressionProgress({ current: 0, total: validFiles.length });

            try {
                const compressedFiles = await compressImages(
                    validFiles,
                    {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        quality: 0.8
                    },
                    (current, total) => {
                        setCompressionProgress({ current, total });
                    }
                );

                // Append to existing photos
                const newPhotoFiles = [...photoFiles, ...compressedFiles];
                const newPhotoYears = [...photoYears, ...compressedFiles.map(() => new Date().getFullYear())];
                console.log('📋 Pasted images from button:', {
                    count: compressedFiles.length,
                    totalPhotos: newPhotoFiles.length,
                    years: newPhotoYears
                });
                setPhotoFiles(newPhotoFiles);
                setPhotoYears(newPhotoYears);
            } catch (error) {
                console.error('Error compressing pasted images:', error);
                alert('Failed to process pasted images. Please try again.');
            } finally {
                setIsCompressing(false);
                setCompressionProgress({ current: 0, total: 0 });
            }
        } catch (error) {
            console.error('Error reading clipboard:', error);
            alert('Failed to read from clipboard. Please make sure you have copied an image and granted clipboard permissions.');
        }
    };

    // Add paste event listener
    React.useEffect(() => {
        window.addEventListener('paste', handlePaste as any);
        return () => {
            window.removeEventListener('paste', handlePaste as any);
        };
    }); // No dependencies - will use latest closure

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !relationship || !yearOfBirth) {
            alert('Please fill in all required fields');
            return;
        }

        // Final safety check for file sizes
        const MAX_SIZE_BYTES = 0.25 * 1024 * 1024; // 0.25MB safety buffer
        const largeFiles = photoFiles.filter(f => f.size > MAX_SIZE_BYTES);
        if (largeFiles.length > 0) {
            alert(`Error: The following photos are still too large (${largeFiles.map(f => (f.size / 1024 / 1024).toFixed(2) + 'MB').join(', ')}). Please try resizing them manually or using a different image.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const newPerson: Person = {
                id: generateId(),
                name,
                relationship,
                gender: gender || undefined,
                yearOfBirth: parseInt(yearOfBirth),
                isDeceased: isDeceased ? true : undefined,
                yearOfDeath: isDeceased && yearOfDeath ? parseInt(yearOfDeath) : undefined,
                photos: [] // Photos will be added after upload
            };

            // Pass person, photo files, and years to parent
            onAdd(newPerson, photoFiles.length > 0 ? photoFiles : undefined, photoFiles.length > 0 ? photoYears : undefined);
            onClose();
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Failed to add member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop-dark" onClick={handleBackdropClick}>
            <div className="modal-container-dark modal-lg">
                {/* Header */}
                <div className="modal-header-dark">
                    <div className="modal-header-content">
                        <div className="modal-icon-box icon-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="16" y1="11" x2="22" y2="11" />
                            </svg>
                        </div>
                        <div className="modal-titles">
                            <h2 className="modal-title-dark">{t('addMember.title')}</h2>
                            <p className="modal-subtitle-dark">{t('addMember.subtitle')}</p>
                        </div>
                    </div>
                    <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body-dark">
                    <form className="add-member-form" onSubmit={handleSubmit}>
                        <div className="form-row-dark">
                            <div className="form-group-dark">
                                <label htmlFor="name" className="form-label-dark">
                                    {t('addMember.name')} <span className="form-required">{t('addMember.nameRequired')}</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    className="form-input-dark"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('addMember.namePlaceholder')}
                                    required
                                />
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="relationship" className="form-label-dark">
                                    {t('addMember.relationship')} <span className="form-required">{t('addMember.nameRequired')}</span>
                                </label>
                                <input
                                    type="text"
                                    id="relationship"
                                    className="form-input-dark"
                                    value={relationship}
                                    onChange={(e) => setRelationship(e.target.value)}
                                    placeholder={t('addMember.relationshipPlaceholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row-dark">
                            <div className="form-group-dark">
                                <label htmlFor="gender" className="form-label-dark">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    className="form-select-dark"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="yearOfBirth" className="form-label-dark">
                                    {t('addMember.yearOfBirth')} <span className="form-required">{t('addMember.nameRequired')}</span>
                                </label>
                                <input
                                    type="number"
                                    id="yearOfBirth"
                                    className="form-input-dark"
                                    value={yearOfBirth}
                                    onChange={(e) => setYearOfBirth(e.target.value)}
                                    placeholder={t('addMember.yearPlaceholder')}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group-dark checkbox-group">
                            <label className="checkbox-label-dark">
                                <input
                                    type="checkbox"
                                    checked={isDeceased}
                                    onChange={(e) => setIsDeceased(e.target.checked)}
                                    className="checkbox-input-dark"
                                />
                                <span className="checkbox-mark"></span>
                                <span>Deceased</span>
                            </label>
                            <span className="form-hint-dark">Check if this person has passed away</span>
                        </div>

                        {isDeceased && (
                            <div className="form-group-dark">
                                <label htmlFor="yearOfDeath" className="form-label-dark">
                                    Year of Death <span className="form-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="yearOfDeath"
                                    className="form-input-dark"
                                    value={yearOfDeath}
                                    onChange={(e) => setYearOfDeath(e.target.value)}
                                    placeholder="e.g., 2020"
                                    min={yearOfBirth || "1900"}
                                    max={new Date().getFullYear()}
                                    required={isDeceased}
                                />
                            </div>
                        )}

                        <div className="form-group-dark">
                            <label htmlFor="photos" className="form-label-dark">
                                {t('addMember.photos')}
                            </label>
                            <div className="photo-upload-row">
                                <input
                                    type="file"
                                    id="photos"
                                    className="form-file-dark"
                                    accept="image/*,.heic"
                                    multiple
                                    onChange={handlePhotoChange}
                                    disabled={isCompressing}
                                />
                                <button
                                    type="button"
                                    className="btn-dark btn-dark-secondary"
                                    onClick={handlePasteButton}
                                    disabled={isCompressing}
                                    title="Paste image from clipboard"
                                >
                                    📋 Paste
                                </button>
                            </div>
                            <span className="form-hint-dark">
                                Upload photos or paste from clipboard. HEIC images supported.
                            </span>
                        </div>

                        {isCompressing && (
                            <div className="compression-progress-dark">
                                <div className="progress-bar-dark">
                                    <div
                                        className="progress-fill-dark"
                                        style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                                    />
                                </div>
                                <p className="progress-text-dark">
                                    Compressing images... {compressionProgress.current} of {compressionProgress.total}
                                </p>
                            </div>
                        )}

                        {photoFiles.length > 0 && !isCompressing && (
                            <div className="photo-preview-dark">
                                <p className="preview-label-dark">{photoFiles.length} photo(s) selected</p>
                                <div className="preview-grid-dark">
                                    {photoFiles.map((file, index) => (
                                        <div key={index} className="preview-item-dark">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Preview ${index + 1}`}
                                                className="preview-image-dark"
                                            />
                                            <div className="preview-info-dark">
                                                <span className="preview-size-dark">{formatFileSize(file.size)}</span>
                                                <input
                                                    type="number"
                                                    className="preview-year-dark"
                                                    value={photoYears[index]}
                                                    onChange={(e) => {
                                                        const newYears = [...photoYears];
                                                        newYears[index] = parseInt(e.target.value) || new Date().getFullYear();
                                                        setPhotoYears(newYears);
                                                    }}
                                                    placeholder="Year"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="modal-footer-dark">
                            <button type="button" className="btn-dark btn-dark-secondary" onClick={onClose}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn-dark btn-dark-primary" disabled={isSubmitting || isCompressing}>
                                {isSubmitting ? t('common.saving') : isCompressing ? t('common.loading') : t('group.addMember')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
