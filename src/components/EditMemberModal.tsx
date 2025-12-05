import React, { useState } from 'react';
import { compressImages, validateImageFile, formatFileSize } from '../utils/imageCompression';
import type { Person } from '../types';
import './EditMemberModal.css';

interface EditMemberModalProps {
    person: Person;
    onClose: () => void;
    onUpdate: (personId: string, updates: Partial<Person>, newPhotos?: File[], photoYears?: number[]) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ person, onClose, onUpdate }) => {
    const [name, setName] = useState(person.name);
    const [relationship, setRelationship] = useState(person.relationship);
    const [yearOfBirth, setYearOfBirth] = useState(person.yearOfBirth.toString());
    const [isDeceased, setIsDeceased] = useState(person.isDeceased || false);
    const [yearOfDeath, setYearOfDeath] = useState(person.yearOfDeath?.toString() || '');
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoYears, setPhotoYears] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
    const [photosToDelete, setPhotosToDelete] = useState<Set<string>>(new Set());

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

    const handleDeletePhoto = (photoUrl: string) => {
        const newSet = new Set(photosToDelete);
        if (newSet.has(photoUrl)) {
            newSet.delete(photoUrl);
        } else {
            newSet.add(photoUrl);
        }
        setPhotosToDelete(newSet);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !relationship || !yearOfBirth) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const updates: Partial<Person> = {
                name,
                relationship,
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

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop fade-in" onClick={handleBackdropClick}>
            <div className="edit-member-modal scale-in">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <div className="modal-header">
                    <h2 className="modal-title">Edit Member</h2>
                    <p className="modal-subtitle">Update member details and manage photos</p>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="relationship" className="form-label">
                            Relationship <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="relationship"
                            className="form-input"
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            placeholder="e.g., Father, Mother, Son, Friend"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="yearOfBirth" className="form-label">
                            Year of Birth <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="yearOfBirth"
                            className="form-input"
                            value={yearOfBirth}
                            onChange={(e) => setYearOfBirth(e.target.value)}
                            placeholder="e.g., 1990"
                            min="1900"
                            max={new Date().getFullYear()}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label checkbox-label">
                            <input
                                type="checkbox"
                                checked={isDeceased}
                                onChange={(e) => setIsDeceased(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span>Deceased</span>
                        </label>
                        <small className="form-hint">Check if this person has passed away</small>
                    </div>

                    {isDeceased && (
                        <div className="form-group">
                            <label htmlFor="yearOfDeath" className="form-label">
                                Year of Death <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="yearOfDeath"
                                className="form-input"
                                value={yearOfDeath}
                                onChange={(e) => setYearOfDeath(e.target.value)}
                                placeholder="e.g., 2020"
                                min={yearOfBirth || "1900"}
                                max={new Date().getFullYear()}
                                required={isDeceased}
                            />
                        </div>
                    )}

                    {/* Existing Photos */}
                    {person.photos.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Current Photos</label>
                            <div className="existing-photos-grid">
                                {person.photos.map((photo) => (
                                    <div
                                        key={photo.url}
                                        className={`existing-photo-item ${photosToDelete.has(photo.url) ? 'marked-delete' : ''}`}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`${person.name} - ${photo.yearTaken}`}
                                            className="existing-photo-image"
                                        />
                                        <div className="existing-photo-info">
                                            <span className="photo-year-badge">{photo.yearTaken}</span>
                                            <button
                                                type="button"
                                                className="btn-delete-photo"
                                                onClick={() => handleDeletePhoto(photo.url)}
                                                title={photosToDelete.has(photo.url) ? 'Undo delete' : 'Delete photo'}
                                            >
                                                {photosToDelete.has(photo.url) ? '↶' : '🗑️'}
                                            </button>
                                        </div>
                                        {photosToDelete.has(photo.url) && (
                                            <div className="delete-overlay">Will be deleted</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {photosToDelete.size > 0 && (
                                <p className="delete-warning">
                                    ⚠️ {photosToDelete.size} photo(s) will be deleted
                                </p>
                            )}
                        </div>
                    )}

                    {/* Add New Photos */}
                    <div className="form-group">
                        <label htmlFor="photos" className="form-label">
                            Add New Photos
                        </label>
                        <input
                            type="file"
                            id="photos"
                            className="form-input-file"
                            accept="image/*,.heic"
                            multiple
                            onChange={handlePhotoChange}
                            disabled={isCompressing}
                        />
                        <p className="form-help">
                            Add more photos. HEIC images supported. Auto-compressed to ≤ 1MB.
                        </p>
                    </div>

                    {isCompressing && (
                        <div className="compression-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                                />
                            </div>
                            <p className="progress-text">
                                Compressing images... {compressionProgress.current} of {compressionProgress.total}
                            </p>
                        </div>
                    )}

                    {photoFiles.length > 0 && !isCompressing && (
                        <div className="photo-preview">
                            <p className="preview-label">{photoFiles.length} new photo(s) to add</p>
                            <div className="preview-grid">
                                {photoFiles.map((file, index) => (
                                    <div key={index} className="preview-item">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index + 1}`}
                                            className="preview-image"
                                        />
                                        <div className="preview-info">
                                            <span className="preview-size">{formatFileSize(file.size)}</span>
                                            <input
                                                type="number"
                                                className="preview-year"
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

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || isCompressing}>
                            {isSubmitting ? 'Saving...' : isCompressing ? 'Processing...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
