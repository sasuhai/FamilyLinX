import React from 'react';
import type { Person } from '../types';
import { PhotoRotator } from './PhotoRotator';
import { getAgeDisplay } from '../utils/helpers';
import './PersonCard.css';

interface PersonCardProps {
    person: Person;
    onClick: () => void;
    onToggleSubGroup?: () => void;
    isSubGroupExpanded?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({
    person,
    onClick,
    onToggleSubGroup,
    isSubGroupExpanded = false
}) => {
    const ageDisplay = getAgeDisplay(person.yearOfBirth, person.isDeceased, person.yearOfDeath);

    return (
        <div className="person-card fade-in" onClick={onClick}>
            <div className="person-card-image">
                <PhotoRotator photos={person.photos} />
                {person.isDeceased && (
                    <div className="deceased-badge">
                        <span>🕊️</span>
                        <span>In Memory</span>
                    </div>
                )}
            </div>

            <div className="person-card-content">
                <h3 className="person-name">{person.name}</h3>

                <div className="person-details">
                    <div className="detail-item">
                        <span className="detail-icon">👤</span>
                        <span className="detail-text">{person.relationship}</span>
                    </div>

                    <div className="detail-row">
                        <div className="detail-item">
                            <span className="detail-icon">🎂</span>
                            <span className="detail-text">{ageDisplay}</span>
                        </div>

                        <div className="detail-item">
                            <span className="detail-icon">📸</span>
                            <span className="detail-text">
                                {person.photos.length} {person.photos.length === 1 ? 'photo' : 'photos'}
                            </span>
                        </div>
                    </div>
                </div>

                {person.subGroupId && onToggleSubGroup && (
                    <button
                        className={`sub-group-toggle-badge ${isSubGroupExpanded ? 'expanded' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubGroup();
                        }}
                    >
                        <span className="badge-icon">👨‍👩‍👧‍👦</span>
                        <span>{isSubGroupExpanded ? 'Hide' : 'Show'} Family</span>
                        <span className="toggle-arrow">{isSubGroupExpanded ? '▼' : '▶'}</span>
                    </button>
                )}
            </div>

            <div className="card-hover-overlay">
                <div className="hover-content">
                    <span className="hover-icon">👁️</span>
                    <span className="hover-text">View Details</span>
                </div>
            </div>
        </div>
    );
};
