import React, { useState } from 'react';
import type { CalendarEvent } from '../types/calendar';
import './AddEventModal.css';

interface AddEventModalProps {
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
    initialDate?: Date;
    initialTime?: string; // Format: "HH:MM"
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, onSave, initialDate, initialTime }) => {
    // Calculate end time (1 hour after start time)
    const getEndTime = (startTime: string): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHour = hours + 1;
        return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const defaultStartTime = initialTime || '09:00';
    const defaultEndTime = getEndTime(defaultStartTime);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        allDay: false,
        category: 'meeting' as CalendarEvent['category'],
        location: '',
        color: '#6366f1'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert('Please enter an event title');
            return;
        }

        const event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
            title: formData.title,
            description: formData.description,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            startTime: formData.allDay ? undefined : formData.startTime,
            endTime: formData.allDay ? undefined : formData.endTime,
            allDay: formData.allDay,
            category: formData.category,
            color: formData.color,
            location: formData.location,
            attendees: [],
            createdBy: 'current_user'
        };

        onSave(event);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="modal-backdrop-dark" onClick={onClose}>
            <div className="modal-container-dark modal-md" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header-dark">
                    <div className="modal-header-content">
                        <div className="modal-icon-box icon-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                                <line x1="12" y1="14" x2="12" y2="18" />
                                <line x1="10" y1="16" x2="14" y2="16" />
                            </svg>
                        </div>
                        <div className="modal-titles">
                            <h2 className="modal-title-dark">Add New Event</h2>
                            <p className="modal-subtitle-dark">Create a new event on your calendar</p>
                        </div>
                    </div>
                    <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body-dark">
                        {/* Basic Information */}
                        <div className="form-section-title-dark">Basic Information</div>

                        <div className="form-group-dark">
                            <label className="form-label-dark">Event Title <span className="form-required">*</span></label>
                            <input
                                type="text"
                                className="form-input-dark"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Enter event title"
                                required
                            />
                        </div>

                        <div className="form-group-dark">
                            <label className="form-label-dark">Description</label>
                            <textarea
                                className="form-textarea-dark"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Enter event description (optional)"
                                rows={2}
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
                                    placeholder="Event location (optional)"
                                />
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="form-section-title-dark" style={{ marginTop: '1rem' }}>Date & Time</div>

                        <div className="form-row-dark">
                            <div className="form-group-dark">
                                <label className="form-label-dark">Start Date <span className="form-required">*</span></label>
                                <input
                                    type="date"
                                    className="form-input-dark"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group-dark">
                                <label className="form-label-dark">End Date <span className="form-required">*</span></label>
                                <input
                                    type="date"
                                    className="form-input-dark"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group-dark checkbox-group">
                            <label className="checkbox-label-dark">
                                <input
                                    type="checkbox"
                                    checked={formData.allDay}
                                    onChange={(e) => handleChange('allDay', e.target.checked)}
                                    className="checkbox-input-dark"
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
                    </div>

                    {/* Footer */}
                    <div className="modal-footer-dark">
                        <button type="button" className="btn-dark btn-dark-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-dark btn-dark-primary">
                            Save Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
