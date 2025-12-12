import React, { useState } from 'react';
import type { Person, Photo, Group } from '../types';
import { sortPhotosByYear, calculateAge } from '../utils/helpers';
import './PersonModal.css';

interface PersonModalProps {
    person: Person;
    onClose: () => void;
    onCreateSubGroup: () => void;
    onViewSubGroup?: () => void;
    onEdit?: () => void;
    allGroups?: Record<string, Group>;
    isAdminMode: boolean;
}

export const PersonModal: React.FC<PersonModalProps> = ({
    person,
    onClose,
    onCreateSubGroup,
    onViewSubGroup,
    onEdit,
    allGroups,
    isAdminMode,
}) => {
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    const sortedPhotos = sortPhotosByYear(person.photos);
    const age = calculateAge(person.yearOfBirth, person.yearOfDeath);

    // Check if sub-group actually exists
    const subGroupExists = person.subGroupId && allGroups && allGroups[person.subGroupId];

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop-dark" onClick={handleBackdropClick}>
            <div className="modal-container-dark modal-lg person-modal-dark">
                {/* Header */}
                <div className="modal-header-dark person-header-dark">
                    <div className="person-header-content">
                        <h2 className="person-name-dark">{person.name}</h2>
                        <div className="person-badges-dark">
                            <span className="person-badge-dark badge-relationship">
                                {person.relationship}
                            </span>
                            {person.yearOfBirth !== 0 && (
                                <span className="person-badge-dark badge-birth">
                                    {person.yearOfBirth} ({age} yrs)
                                </span>
                            )}
                            <span className="person-badge-dark badge-photos">
                                {person.photos.length}
                            </span>
                            {person.isDeceased && (
                                <span className="person-badge-dark badge-deceased">
                                    Deceased {person.yearOfDeath ? `(${person.yearOfDeath})` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Action Buttons */}
                {isAdminMode && (
                    <div className="person-actions-bar">
                        {onEdit && (
                            <button className="btn-dark btn-dark-secondary btn-compact" onClick={onEdit}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                                Edit
                            </button>
                        )}
                        {subGroupExists && onViewSubGroup ? (
                            <button className="btn-dark btn-dark-primary btn-compact" onClick={onViewSubGroup}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                View Family
                            </button>
                        ) : (
                            <button className="btn-dark btn-dark-primary btn-compact" onClick={onCreateSubGroup}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="17" y1="11" x2="23" y2="11" />
                                </svg>
                                Create Family
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="modal-body-dark person-body-dark">
                    {/* View Toggle */}
                    <div className="view-toggle-dark">
                        <button
                            className={`toggle-btn-dark ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Grid
                        </button>
                        <button
                            className={`toggle-btn-dark ${viewMode === 'timeline' ? 'active' : ''}`}
                            onClick={() => setViewMode('timeline')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="20" x2="12" y2="10" />
                                <line x1="18" y1="20" x2="18" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="16" />
                            </svg>
                            Timeline
                        </button>
                    </div>

                    {sortedPhotos.length === 0 ? (
                        <div className="no-photos-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <p>No photos yet</p>
                            <span>Add photos to see them here</span>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="photo-grid-dark">
                            {sortedPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="photo-grid-item-dark"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img src={photo.url} alt={`Photo from ${photo.yearTaken}`} />
                                    <div className="photo-overlay-dark">
                                        <span className="photo-year-dark">{photo.yearTaken}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="photo-timeline-dark">
                            {sortedPhotos.map((photo, index) => (
                                <div key={photo.id} className="timeline-item-dark">
                                    <div className="timeline-marker-dark">
                                        <div className="marker-dot-dark"></div>
                                        {index < sortedPhotos.length - 1 && <div className="marker-line-dark"></div>}
                                    </div>
                                    <div className="timeline-content-dark">
                                        <div className="timeline-year-dark">{photo.yearTaken}</div>
                                        <div className="timeline-photo-dark" onClick={() => setSelectedPhoto(photo)}>
                                            <img src={photo.url} alt={`Photo from ${photo.yearTaken}`} />
                                            {photo.caption && <p className="timeline-caption-dark">{photo.caption}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lightbox */}
                {selectedPhoto && (
                    <div className="lightbox-dark" onClick={() => setSelectedPhoto(null)}>
                        <div className="lightbox-content-dark" onClick={(e) => e.stopPropagation()}>
                            <button className="lightbox-close-dark" onClick={() => setSelectedPhoto(null)}>
                                ✕
                            </button>
                            <img src={selectedPhoto.url} alt={`Photo from ${selectedPhoto.yearTaken}`} />
                            <div className="lightbox-info-dark">
                                <h3>{selectedPhoto.yearTaken}</h3>
                                {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
