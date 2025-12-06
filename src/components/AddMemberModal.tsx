import React, { useState } from 'react';
import { generateId } from '../utils/helpers';
import { compressImages, validateImageFile, formatFileSize } from '../utils/imageCompression';
import type { Person } from '../types';
import './AddMemberModal.css';

interface AddMemberModalProps {
    onClose: () => void;
    onAdd: (person: Person, photoFiles?: File[], photoYears?: number[]) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onAdd }) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !relationship || !yearOfBirth) {
            alert('Please fill in all required fields');
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
        <div className="modal-backdrop fade-in" onClick={handleBackdropClick}>
            <div className="add-member-modal scale-in">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <div className="modal-header">
                    <h2 className="modal-title">Add New Member</h2>
                    <p className="modal-subtitle">Fill in the details to add a new member to this group</p>
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
                        <label htmlFor="gender" className="form-label">
                            Gender
                        </label>
                        <select
                            id="gender"
                            className="form-input"
                            value={gender}
                            onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
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

                    <div className="form-group">
                        <label htmlFor="photos" className="form-label">
                            Photos (optional)
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
                            Photos larger than 1MB will be automatically compressed. HEIC images supported.
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
                            <p className="preview-label">{photoFiles.length} photo(s) selected</p>
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
                            {isSubmitting ? 'Adding...' : isCompressing ? 'Processing...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
