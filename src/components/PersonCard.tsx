import React, { useState } from 'react';
import type { Person, Group, Photo } from '../types';
import { PhotoRotator } from './PhotoRotator';
import { getAgeDisplay } from '../utils/helpers';
import './PersonCard.css';

interface PersonCardProps {
    person: Person;
    onClick: () => void;
    onToggleSubGroup?: () => void;
    isSubGroupExpanded?: boolean;
    allGroups?: Record<string, Group>;
}

export const PersonCard: React.FC<PersonCardProps> = ({
    person,
    onClick,
    onToggleSubGroup,
    isSubGroupExpanded = false,
    allGroups
}) => {
    const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(
        person.photos.length > 0 ? person.photos[0] : null
    );

    const ageDisplay = getAgeDisplay(person.yearOfBirth, person.isDeceased, person.yearOfDeath);

    // Check if sub-group actually exists
    // If allGroups is not provided, assume sub-group exists (backward compatibility)
    // If allGroups is provided, check if the sub-group exists in it
    const subGroupExists = person.subGroupId && (!allGroups || allGroups[person.subGroupId]);

    return (
        <div className="person-card" onClick={onClick}>
            <div className="person-card-image">
                <PhotoRotator
                    photos={person.photos}
                    interval={3000}
                    gender={person.gender}
                    onPhotoChange={setCurrentPhoto}
                />
            </div>

            <div className="person-card-content">
                <h3 className="person-name">{person.name}</h3>

                <div className="person-details">
                    <div className="detail-item">
                        <span className="detail-icon">👤</span>
                        <span className="detail-text">{person.relationship}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-icon">🎂</span>
                        <span className="detail-text">{ageDisplay}</span>
                    </div>
                </div>

                {subGroupExists && onToggleSubGroup && (
                    <button
                        className={`sub-group-toggle-badge ${isSubGroupExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubGroup();
                        }}
                    >
                        <span>{isSubGroupExpanded ? 'Hide' : 'Show'} Family</span>
                    </button>
                )}
            </div>

            <div className="card-hover-overlay">
                <div className="hover-content">
                    {currentPhoto && (
                        <span className="hover-year-badge">
                            {currentPhoto.yearTaken}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
