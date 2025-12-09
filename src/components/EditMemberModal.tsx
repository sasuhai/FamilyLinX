import React, { useState } from 'react';
import { compressImages, validateImageFile, formatFileSize } from '../utils/imageCompression';
import type { Person } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import './EditMemberModal.css';

interface EditMemberModalProps {
    person: Person;
    onClose: () => void;
    onUpdate: (personId: string, updates: Partial<Person>, newPhotos?: File[], photoYears?: number[]) => void;
    onDelete: (personId: string) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ person, onClose, onUpdate, onDelete }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(person.name);
    const [relationship, setRelationship] = useState(person.relationship);
    const [gender, setGender] = useState<'male' | 'female' | ''>(person.gender || '');
    const [yearOfBirth, setYearOfBirth] = useState(person.yearOfBirth.toString());
    const [isDeceased, setIsDeceased] = useState(person.isDeceased || false);
    const [yearOfDeath, setYearOfDeath] = useState(person.yearOfDeath?.toString() || '');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoYears, setPhotoYears] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
    const [photosToDelete, setPhotosToDelete] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                        maxSizeMB: 0.2,
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
                alert(t('editMember.imageProcessingError'));
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
                setPhotoFiles([...photoFiles, ...compressedFiles]);
                setPhotoYears([...photoYears, ...compressedFiles.map(() => new Date().getFullYear())]);
            } catch (error) {
                console.error('Error compressing pasted images:', error);
                alert(t('editMember.pastedImageProcessingError'));
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
                console.log('📋 Pasted images from button:', {
                    count: compressedFiles.length,
                    totalPhotos: newPhotoFiles.length,
                    years: newPhotoYears
                });
                setPhotoFiles(newPhotoFiles);
                setPhotoYears(newPhotoYears);
            } catch (error) {
                console.error('Error compressing pasted images:', error);
                alert(t('editMember.pastedImageProcessingError'));
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

    const handleDeletePhoto = (photoUrl: string) => {
        const newSet = new Set(photosToDelete);
        if (newSet.has(photoUrl)) {
            newSet.delete(photoUrl);
        } else {
            newSet.add(photoUrl);
        }
        setPhotosToDelete(newSet);
    };

    const handleRemoveNewPhoto = (index: number) => {
        const newFiles = photoFiles.filter((_, i) => i !== index);
        const newYears = photoYears.filter((_, i) => i !== index);
        setPhotoFiles(newFiles);
        setPhotoYears(newYears);
    };

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
            const updates: Partial<Person> = {
                name,
                relationship,
                gender: gender || undefined,
                yearOfBirth: parseInt(yearOfBirth),
                isDeceased: isDeceased ? true : undefined,
                yearOfDeath: isDeceased && yearOfDeath ? parseInt(yearOfDeath) : undefined
            };

            // If photos are marked for deletion, filter them out
            if (photosToDelete.size > 0) {
                updates.photos = person.photos.filter(photo => !photosToDelete.has(photo.url));
            }

            // Pass updates and new photos to parent
            onUpdate(
                person.id,
                updates,
                photoFiles.length > 0 ? photoFiles : undefined,
                photoFiles.length > 0 ? photoYears : undefined
            );
            onClose();
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop-dark" onClick={onClose}>
                <div className="modal-container-dark modal-lg" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header-dark">
                        <div className="modal-header-content">
                            <div className="modal-icon-box icon-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="modal-titles">
                                <h2 className="modal-title-dark">{t('editMember.title')}</h2>
                                <p className="modal-subtitle-dark">{t('editMember.subtitle')}</p>
                            </div>
                        </div>
                        <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="modal-form-scrollable">
                        <div className="modal-body-dark">
                            {/* Stats Row */}
                            <div className="stats-row-dark">
                                <div className="stat-item-dark">
                                    <div className="stat-value-dark">{person.photos.length}</div>
                                    <div className="stat-label-dark">{t('group.photos')}</div>
                                </div>
                                <div className="stat-item-dark">
                                    <div className="stat-value-dark">
                                        {new Date().getFullYear() - person.yearOfBirth}
                                    </div>
                                    <div className="stat-label-dark">{t('editMember.age')}</div>
                                </div>
                            </div>

                            {/* Form Grid */}
                            <div className="form-row-dark">
                                <div className="form-group-dark">
                                    <label htmlFor="name" className="form-label-dark">
                                        {t('editMember.name')} <span className="form-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="form-input-dark"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('editMember.enterFullName')}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="form-group-dark">
                                    <label htmlFor="relationship" className="form-label-dark">
                                        {t('editMember.relationship')} <span className="form-required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="relationship"
                                        className="form-input-dark"
                                        value={relationship}
                                        onChange={(e) => setRelationship(e.target.value)}
                                        placeholder={t('editMember.relationshipPlaceholder')}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-row-dark">
                                <div className="form-group-dark">
                                    <label htmlFor="gender" className="form-label-dark">
                                        {t('editMember.gender')}
                                    </label>
                                    <select
                                        id="gender"
                                        className="form-select-dark"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">{t('editMember.selectGender')}</option>
                                        <option value="male">{t('editMember.male')}</option>
                                        <option value="female">{t('editMember.female')}</option>
                                    </select>
                                </div>

                                <div className="form-group-dark">
                                    <label htmlFor="yearOfBirth" className="form-label-dark">
                                        {t('editMember.yearOfBirth')} <span className="form-required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="yearOfBirth"
                                        className="form-input-dark"
                                        value={yearOfBirth}
                                        onChange={(e) => setYearOfBirth(e.target.value)}
                                        placeholder={t('editMember.yearOfBirthPlaceholder')}
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            {/* Deceased Section */}
                            <div className="form-group-dark">
                                <label className="checkbox-group-dark">
                                    <input
                                        type="checkbox"
                                        checked={isDeceased}
                                        onChange={(e) => setIsDeceased(e.target.checked)}
                                        disabled={isSubmitting}
                                    />
                                    <span>{t('editMember.markAsDeceased')}</span>
                                </label>
                                <span className="form-hint-dark">{t('editMember.deceasedHint')}</span>
                            </div>

                            {isDeceased && (
                                <div className="form-group-dark">
                                    <label htmlFor="yearOfDeath" className="form-label-dark">
                                        {t('editMember.yearOfDeath')} <span className="form-required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="yearOfDeath"
                                        className="form-input-dark"
                                        value={yearOfDeath}
                                        onChange={(e) => setYearOfDeath(e.target.value)}
                                        placeholder={t('editMember.yearOfDeathPlaceholder')}
                                        min={yearOfBirth || "1900"}
                                        max={new Date().getFullYear()}
                                        required={isDeceased}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            {/* Current Photos Section */}
                            {person.photos.length > 0 && (
                                <div className="photos-section-dark">
                                    <h4 className="section-title-dark">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        {t('editMember.currentPhotos')}
                                    </h4>
                                    <div className="photos-grid-dark">
                                        {person.photos.map((photo) => (
                                            <div
                                                key={photo.url}
                                                className={`photo-card-dark ${photosToDelete.has(photo.url) ? 'marked-delete' : ''}`}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={`${person.name} - ${photo.yearTaken}`}
                                                    className="photo-image-dark"
                                                />
                                                <div className="photo-overlay-dark">
                                                    <span className="photo-year-dark">{photo.yearTaken}</span>
                                                    <button
                                                        type="button"
                                                        className={`photo-delete-btn-dark ${photosToDelete.has(photo.url) ? 'undo' : ''}`}
                                                        onClick={() => handleDeletePhoto(photo.url)}
                                                        title={photosToDelete.has(photo.url) ? t('editMember.undoDelete') : t('editMember.deletePhoto')}
                                                    >
                                                        {photosToDelete.has(photo.url) ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                                                <path d="M21 3v5h-5" />
                                                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                                                <path d="M8 16H3v5" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {photosToDelete.has(photo.url) && (
                                                    <div className="photo-delete-overlay-dark">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                        <span>{t('editMember.willBeDeleted')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {photosToDelete.size > 0 && (
                                        <div className="delete-warning-dark">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            {photosToDelete.size} photo{photosToDelete.size !== 1 ? 's' : ''} will be deleted on save
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Add New Photos Section */}
                            <div className="form-group-dark">
                                <label htmlFor="photos" className="form-label-dark">
                                    {t('editMember.addNewPhotos')}
                                </label>
                                <div className="photo-upload-row">
                                    <input
                                        type="file"
                                        id="photos"
                                        className="form-file-dark"
                                        accept="image/*,.heic"
                                        multiple
                                        onChange={handlePhotoChange}
                                        disabled={isCompressing || isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        className="btn-dark btn-dark-secondary"
                                        onClick={handlePasteButton}
                                        disabled={isCompressing || isSubmitting}
                                        title={t('editMember.pasteFromClipboard')}
                                    >
                                        📋 {t('editMember.paste')}
                                    </button>
                                </div>
                                <span className="form-hint-dark">
                                    {t('editMember.photoUploadHint')}
                                </span>

                                {/* Compression Progress */}
                                {isCompressing && (
                                    <div className="compression-progress-dark">
                                        <div className="progress-bar-dark">
                                            <div
                                                className="progress-fill-dark"
                                                style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="progress-text-dark">
                                            Compressing... {compressionProgress.current} of {compressionProgress.total}
                                        </span>
                                    </div>
                                )}

                                {/* New Photos Preview */}
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
                                                            placeholder={t('editMember.year')}
                                                            min="1900"
                                                            max={new Date().getFullYear()}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="preview-remove-btn"
                                                            onClick={() => handleRemoveNewPhoto(index)}
                                                            title={t('editMember.removePhoto')}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Danger Zone */}
                            <div className="danger-section-dark">
                                <h4>⚠️ {t('editMember.dangerZone')}</h4>
                                <p>Permanently delete this member and all their {person.photos.length} photos.</p>
                                <button
                                    type="button"
                                    className="btn-dark btn-dark-danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSubmitting || isCompressing}
                                >
                                    {t('editMember.deleteMember')}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer-dark">
                            <button
                                type="button"
                                className="btn-dark btn-dark-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="btn-dark btn-dark-primary"
                                disabled={isSubmitting || isCompressing}
                            >
                                {isSubmitting ? t('common.saving') : isCompressing ? t('common.loading') : t('common.saveChanges')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="confirm-backdrop-dark" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="confirm-modal-dark" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 className="confirm-title-dark">{t('editMember.deleteConfirm')}</h3>
                        <p className="confirm-text-dark">
                            Are you sure you want to delete <strong>"{person.name}"</strong>?
                        </p>
                        <p className="confirm-text-dark" style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                            ⚠️ This will permanently delete all {person.photos.length} photo{person.photos.length !== 1 ? 's' : ''} and cannot be undone!
                        </p>
                        <div className="confirm-actions-dark">
                            <button
                                type="button"
                                className="btn-dark btn-dark-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="btn-dark btn-dark-danger"
                                onClick={() => {
                                    onDelete(person.id);
                                    onClose();
                                }}
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
