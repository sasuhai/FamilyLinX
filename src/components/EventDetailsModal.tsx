import React, { useState } from 'react';
import type { CalendarEvent } from '../types/calendar';
import './SharedModalStyles.css'; // Use shared premium dark modal styles

interface EventDetailsModalProps {
    event: CalendarEvent;
    onClose: () => void;
    onUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void;
    onDelete: (eventId: string) => void;
    isAdminMode: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    event,
    onClose,
    onUpdate,
    onDelete,
    isAdminMode
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        title: event.title,
        description: event.description || '',
        startDate: new Date(event.startDate).toISOString().split('T')[0],
        endDate: new Date(event.endDate).toISOString().split('T')[0],
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '10:00',
        allDay: event.allDay,
        category: event.category,
        location: event.location || '',
        color: event.color || '#6366f1'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updates: Partial<CalendarEvent> = {
            title: formData.title,
            description: formData.description,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            startTime: formData.allDay ? undefined : formData.startTime,
            endTime: formData.allDay ? undefined : formData.endTime,
            allDay: formData.allDay,
            category: formData.category,
            color: formData.color,
            location: formData.location
        };

        onUpdate(event.id, updates);
        setIsEditing(false);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time: string): string => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (isEditing && isAdminMode) {
        return (
            <>
                <div className="modal-backdrop-dark" onClick={onClose}>
                    <div className="modal-container-dark modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-dark">
                            <div className="modal-header-content">
                                <div className="modal-icon-box icon-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </div>
                                <div className="modal-titles">
                                    <h2 className="modal-title-dark">✏️ Edit Event</h2>
                                    <p className="modal-subtitle-dark">Update event details</p>
                                </div>
                            </div>
                            <button className="modal-close-dark" onClick={onClose} aria-label="Close">✕</button>
                        </div>

                        <div className="modal-body-dark">
                            <form onSubmit={handleSubmit} className="event-form">
                                <div className="form-group-dark">
                                    <label className="form-label-dark">Event Title *</label>
                                    <input
                                        type="text"
                                        className="form-input-dark"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group-dark">
                                    <label className="form-label-dark">Description</label>
                                    <textarea
                                        className="form-textarea-dark"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row-dark">
                                    <div className="form-group-dark">
                                        <label className="form-label-dark">Category</label>
                                        <select
                                            className="form-select-dark"
                                            value={formData.category}
                                            onChange={(e) => handleChange('category', e.target.value)}
                                        >
                                            <option value="meeting">Meeting</option>
                                            <option value="birthday">Birthday</option>
                                            <option value="anniversary">Anniversary</option>
                                            <option value="holiday">Holiday</option>
                                            <option value="reminder">Reminder</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group-dark">
                                        <label className="form-label-dark">Location</label>
                                        <input
                                            type="text"
                                            className="form-input-dark"
                                            value={formData.location}
                                            onChange={(e) => handleChange('location', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-row-dark">
                                    <div className="form-group-dark">
                                        <label className="form-label-dark">Start Date</label>
                                        <input
                                            type="date"
                                            className="form-input-dark"
                                            value={formData.startDate}
                                            onChange={(e) => handleChange('startDate', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-dark">
                                        <label className="form-label-dark">End Date</label>
                                        <input
                                            type="date"
                                            className="form-input-dark"
                                            value={formData.endDate}
                                            onChange={(e) => handleChange('endDate', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group-dark">
                                    <label className="form-checkbox-dark">
                                        <input
                                            type="checkbox"
                                            checked={formData.allDay}
                                            onChange={(e) => handleChange('allDay', e.target.checked)}
                                        />
                                        <span>All Day Event</span>
                                    </label>
                                </div>

                                {!formData.allDay && (
                                    <div className="form-row-dark">
                                        <div className="form-group-dark">
                                            <label className="form-label-dark">Start Time</label>
                                            <input
                                                type="time"
                                                className="form-input-dark"
                                                value={formData.startTime}
                                                onChange={(e) => handleChange('startTime', e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group-dark">
                                            <label className="form-label-dark">End Time</label>
                                            <input
                                                type="time"
                                                className="form-input-dark"
                                                value={formData.endTime}
                                                onChange={(e) => handleChange('endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="modal-footer-dark">
                                    <button
                                        type="button"
                                        className="btn-dark btn-dark-danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete
                                    </button>
                                    <div style={{ flex: 1 }} />
                                    <button
                                        type="button"
                                        className="btn-dark btn-dark-secondary"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-dark btn-dark-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <DeleteConfirmModal
                        event={event}
                        onConfirm={() => {
                            onDelete(event.id);
                            setShowDeleteConfirm(false);
                            onClose();
                        }}
                        onCancel={() => setShowDeleteConfirm(false)}
                    />
                )}
            </>
        );
    }

    return (
        <div className="modal-backdrop-dark" onClick={onClose}>
            <div className="modal-container-dark modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-dark">
                    <div className="modal-header-content">
                        <div className="modal-icon-box icon-green">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <div className="modal-titles">
                            <h2 className="modal-title-dark">{event.title}</h2>
                            <p className="modal-subtitle-dark">Event Details</p>
                        </div>
                    </div>
                    <button className="modal-close-dark" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="modal-body-dark">
                    <div className="event-details-compact">
                        {/* Date & Time Row */}
                        <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <div className="detail-info">
                                <span className="detail-text">
                                    {formatDate(new Date(event.startDate))}
                                    {!isSameDay(new Date(event.startDate), new Date(event.endDate)) && (
                                        <> → {formatDate(new Date(event.endDate))}</>
                                    )}
                                </span>
                                {!event.allDay && event.startTime && (
                                    <span className="detail-subtext">
                                        ⏰ {formatTime(event.startTime)}
                                        {event.endTime && <> - {formatTime(event.endTime)}</>}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="detail-item">
                            <span className="detail-icon">🏷️</span>
                            <div className="detail-info">
                                <span className={`event-category-badge category-${event.category}`}>
                                    {event.category}
                                </span>
                            </div>
                        </div>

                        {/* Location */}
                        {event.location && (
                            <div className="detail-item">
                                <span className="detail-icon">📍</span>
                                <div className="detail-info">
                                    <span className="detail-text">{event.location}</span>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {event.description && (
                            <div className="detail-item description-item">
                                <span className="detail-icon">📝</span>
                                <div className="detail-info">
                                    <p className="detail-description">{event.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer-dark">
                        <button className="btn-dark btn-dark-secondary" onClick={onClose}>
                            Close
                        </button>
                        {isAdminMode && (
                            <button className="btn-dark btn-dark-primary" onClick={() => setIsEditing(true)}>
                                Edit Event
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// Confirmation Modal Component
const DeleteConfirmModal: React.FC<{
    event: CalendarEvent;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ event, onConfirm, onCancel }) => {
    return (
        <div className="confirm-backdrop-dark" onClick={onCancel}>
            <div className="confirm-modal-dark" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </div>
                <h3 className="confirm-title-dark">Delete Event?</h3>
                <p className="confirm-text-dark">
                    Are you sure you want to delete <strong>"{event.title}"</strong>?
                </p>
                <p className="confirm-text-dark" style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                    ⚠️ This action cannot be undone.
                </p>
                <div className="confirm-actions-dark">
                    <button className="btn-dark btn-dark-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-dark btn-dark-danger" onClick={onConfirm}>
                        Delete Event
                    </button>
                </div>
            </div>
        </div>
    );
};
