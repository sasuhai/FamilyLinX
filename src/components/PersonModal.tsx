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
    const age = calculateAge(person.yearOfBirth);

    // Check if sub-group actually exists
    const subGroupExists = person.subGroupId && allGroups && allGroups[person.subGroupId];

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop fade-in" onClick={handleBackdropClick}>
            <div className="person-modal scale-in">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <div className="modal-header">
                    <div className="header-content">
                        <h2 className="modal-title">{person.name}</h2>
                        <div className="header-details">
                            <span className="detail-badge">
                                <span className="badge-icon">👤</span>
                                {person.relationship}
                            </span>
                            <span className="detail-badge">
                                <span className="badge-icon">🎂</span>
                                Born {person.yearOfBirth} ({age} years)
                            </span>
                            <span className="detail-badge">
                                <span className="badge-icon">📸</span>
                                {person.photos.length} {person.photos.length === 1 ? 'photo' : 'photos'}
                            </span>
                        </div>
                    </div>

                    {isAdminMode && (
                        <div className="header-actions">
                            {onEdit && (
                                <button className="btn btn-secondary" onClick={onEdit}>
                                    Edit Member
                                </button>
                            )}
                            {subGroupExists && onViewSubGroup ? (
                                <button className="btn btn-primary" onClick={onViewSubGroup}>
                                    View Sub-Group
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={onCreateSubGroup}>
                                    Create Sub-Group
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-body">
                    <div className="view-mode-toggle">
                        <button
                            className={`toggle - btn ${viewMode === 'grid' ? 'active' : ''} `}
                            onClick={() => setViewMode('grid')}
                        >
                            <span>🔲</span>
                            Grid View
                        </button>
                        <button
                            className={`toggle - btn ${viewMode === 'timeline' ? 'active' : ''} `}
                            onClick={() => setViewMode('timeline')}
                        >
                            <span>📅</span>
                            Timeline View
                        </button>
                    </div>

                    {viewMode === 'grid' ? (
                        <div className="photo-grid">
                            {sortedPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="photo-grid-item"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img src={photo.url} alt={`Photo from ${photo.yearTaken} `} />
                                    <div className="photo-grid-overlay">
                                        <span className="photo-year-badge">{photo.yearTaken}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="photo-timeline">
                            {sortedPhotos.map((photo, index) => (
                                <div key={photo.id} className="timeline-item slide-in-right" style={{ animationDelay: `${index * 0.1} s` }}>
                                    <div className="timeline-marker">
                                        <div className="marker-dot"></div>
                                        {index < sortedPhotos.length - 1 && <div className="marker-line"></div>}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-year">{photo.yearTaken}</div>
                                        <div className="timeline-photo" onClick={() => setSelectedPhoto(photo)}>
                                            <img src={photo.url} alt={`Photo from ${photo.yearTaken} `} />
                                            {photo.caption && <p className="timeline-caption">{photo.caption}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedPhoto && (
                    <div className="photo-lightbox fade-in" onClick={() => setSelectedPhoto(null)}>
                        <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
                                ✕
                            </button>
                            <img src={selectedPhoto.url} alt={`Photo from ${selectedPhoto.yearTaken} `} />
                            <div className="lightbox-info">
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
