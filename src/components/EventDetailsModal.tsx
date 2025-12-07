import React, { useState } from 'react';
import type { CalendarEvent } from '../types/calendar';
import './AddEventModal.css';

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
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">✏️ Edit Event</h2>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className="event-form">
                        <div className="form-group">
                            <label className="form-label">Event Title *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
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

                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.allDay}
                                    onChange={(e) => handleChange('allDay', e.target.checked)}
                                />
                                <span>All Day Event</span>
                            </label>
                        </div>

                        {!formData.allDay && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={formData.startTime}
                                        onChange={(e) => handleChange('startTime', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">End Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={formData.endTime}
                                        onChange={(e) => handleChange('endTime', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-delete"
                                onClick={() => onDelete(event.id)}
                            >
                                Delete
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn-save">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{event.title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="event-details">
                    <div className="event-detail-row">
                        <div className="event-detail-icon">📅</div>
                        <div className="event-detail-content">
                            <div className="event-detail-label">Date</div>
                            <div className="event-detail-value">
                                {formatDate(new Date(event.startDate))}
                                {!isSameDay(new Date(event.startDate), new Date(event.endDate)) && (
                                    <> - {formatDate(new Date(event.endDate))}</>
                                )}
                            </div>
                        </div>
                    </div>

                    {!event.allDay && event.startTime && (
                        <div className="event-detail-row">
                            <div className="event-detail-icon">⏰</div>
                            <div className="event-detail-content">
                                <div className="event-detail-label">Time</div>
                                <div className="event-detail-value">
                                    {formatTime(event.startTime)}
                                    {event.endTime && <> - {formatTime(event.endTime)}</>}
                                </div>
                            </div>
                        </div>
                    )}

                    {event.location && (
                        <div className="event-detail-row">
                            <div className="event-detail-icon">📍</div>
                            <div className="event-detail-content">
                                <div className="event-detail-label">Location</div>
                                <div className="event-detail-value">{event.location}</div>
                            </div>
                        </div>
                    )}

                    <div className="event-detail-row">
                        <div className="event-detail-icon">🏷️</div>
                        <div className="event-detail-content">
                            <div className="event-detail-label">Category</div>
                            <div className="event-detail-value">
                                <span className={`event-category-badge category-${event.category}`}>
                                    {event.category}
                                </span>
                            </div>
                        </div>
                    </div>

                    {event.description && (
                        <div className="event-detail-row">
                            <div className="event-detail-icon">📝</div>
                            <div className="event-detail-content">
                                <div className="event-detail-label">Description</div>
                                <div className="event-detail-value">{event.description}</div>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Close
                        </button>
                        {isAdminMode && (
                            <button className="btn-save" onClick={() => setIsEditing(true)}>
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
