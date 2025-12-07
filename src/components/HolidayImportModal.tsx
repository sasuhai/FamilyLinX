import React, { useState } from 'react';
import type { CalendarEvent } from '../types/calendar';
import './AddEventModal.css';

interface HolidayImportModalProps {
    onClose: () => void;
    onImport: (holidays: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

// Popular countries and their holidays for 2025
const HOLIDAY_DATA: Record<string, Array<{ name: string; date: string; type: string }>> = {
    'United States': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Martin Luther King Jr. Day', date: '2025-01-20', type: 'public' },
        { name: "Presidents' Day", date: '2025-02-17', type: 'public' },
        { name: 'Memorial Day', date: '2025-05-26', type: 'public' },
        { name: 'Independence Day', date: '2025-07-04', type: 'public' },
        { name: 'Labor Day', date: '2025-09-01', type: 'public' },
        { name: 'Columbus Day', date: '2025-10-13', type: 'public' },
        { name: 'Veterans Day', date: '2025-11-11', type: 'public' },
        { name: 'Thanksgiving', date: '2025-11-27', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' }
    ],
    'United Kingdom': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Good Friday', date: '2025-04-18', type: 'public' },
        { name: 'Easter Monday', date: '2025-04-21', type: 'public' },
        { name: 'Early May Bank Holiday', date: '2025-05-05', type: 'public' },
        { name: 'Spring Bank Holiday', date: '2025-05-26', type: 'public' },
        { name: 'Summer Bank Holiday', date: '2025-08-25', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' },
        { name: 'Boxing Day', date: '2025-12-26', type: 'public' }
    ],
    'Canada': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Family Day', date: '2025-02-17', type: 'public' },
        { name: 'Good Friday', date: '2025-04-18', type: 'public' },
        { name: 'Victoria Day', date: '2025-05-19', type: 'public' },
        { name: 'Canada Day', date: '2025-07-01', type: 'public' },
        { name: 'Civic Holiday', date: '2025-08-04', type: 'public' },
        { name: 'Labour Day', date: '2025-09-01', type: 'public' },
        { name: 'Thanksgiving', date: '2025-10-13', type: 'public' },
        { name: 'Remembrance Day', date: '2025-11-11', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' },
        { name: 'Boxing Day', date: '2025-12-26', type: 'public' }
    ],
    'Australia': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Australia Day', date: '2025-01-26', type: 'public' },
        { name: 'Good Friday', date: '2025-04-18', type: 'public' },
        { name: 'Easter Saturday', date: '2025-04-19', type: 'public' },
        { name: 'Easter Monday', date: '2025-04-21', type: 'public' },
        { name: 'Anzac Day', date: '2025-04-25', type: 'public' },
        { name: "Queen's Birthday", date: '2025-06-09', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' },
        { name: 'Boxing Day', date: '2025-12-26', type: 'public' }
    ],
    'Singapore': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Chinese New Year', date: '2025-01-29', type: 'public' },
        { name: 'Chinese New Year (2nd day)', date: '2025-01-30', type: 'public' },
        { name: 'Good Friday', date: '2025-04-18', type: 'public' },
        { name: 'Labour Day', date: '2025-05-01', type: 'public' },
        { name: 'Vesak Day', date: '2025-05-12', type: 'public' },
        { name: 'Hari Raya Puasa', date: '2025-03-31', type: 'public' },
        { name: 'Hari Raya Haji', date: '2025-06-07', type: 'public' },
        { name: 'National Day', date: '2025-08-09', type: 'public' },
        { name: 'Deepavali', date: '2025-10-20', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' }
    ],
    'Malaysia': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Federal Territory Day', date: '2025-02-01', type: 'public' },
        { name: 'Chinese New Year', date: '2025-01-29', type: 'public' },
        { name: 'Chinese New Year (2nd day)', date: '2025-01-30', type: 'public' },
        { name: 'Labour Day', date: '2025-05-01', type: 'public' },
        { name: 'Wesak Day', date: '2025-05-12', type: 'public' },
        { name: "King's Birthday", date: '2025-06-07', type: 'public' },
        { name: 'Hari Raya Aidilfitri', date: '2025-03-31', type: 'public' },
        { name: 'Hari Raya Aidilfitri (2nd day)', date: '2025-04-01', type: 'public' },
        { name: 'Merdeka Day', date: '2025-08-31', type: 'public' },
        { name: 'Malaysia Day', date: '2025-09-16', type: 'public' },
        { name: 'Deepavali', date: '2025-10-20', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' }
    ],
    'India': [
        { name: "New Year's Day", date: '2025-01-01', type: 'public' },
        { name: 'Republic Day', date: '2025-01-26', type: 'public' },
        { name: 'Holi', date: '2025-03-14', type: 'public' },
        { name: 'Good Friday', date: '2025-04-18', type: 'public' },
        { name: 'Independence Day', date: '2025-08-15', type: 'public' },
        { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'public' },
        { name: 'Dussehra', date: '2025-10-02', type: 'public' },
        { name: 'Diwali', date: '2025-10-20', type: 'public' },
        { name: 'Christmas Day', date: '2025-12-25', type: 'public' }
    ]
};

export const HolidayImportModal: React.FC<HolidayImportModalProps> = ({ onClose, onImport }) => {
    const [selectedCountry, setSelectedCountry] = useState<string>('United States');
    const [selectedHolidays, setSelectedHolidays] = useState<Set<string>>(new Set());

    const countries = Object.keys(HOLIDAY_DATA);
    const holidays = HOLIDAY_DATA[selectedCountry] || [];

    const handleToggleHoliday = (holidayName: string) => {
        const newSelected = new Set(selectedHolidays);
        if (newSelected.has(holidayName)) {
            newSelected.delete(holidayName);
        } else {
            newSelected.add(holidayName);
        }
        setSelectedHolidays(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedHolidays.size === holidays.length) {
            setSelectedHolidays(new Set());
        } else {
            setSelectedHolidays(new Set(holidays.map(h => h.name)));
        }
    };

    const handleImport = () => {
        const holidayEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = holidays
            .filter(h => selectedHolidays.has(h.name))
            .map(holiday => ({
                title: holiday.name,
                description: `${selectedCountry} public holiday`,
                startDate: new Date(holiday.date),
                endDate: new Date(holiday.date),
                allDay: true,
                category: 'holiday' as const,
                createdBy: 'system',
                color: '#10b981'
            }));

        onImport(holidayEvents);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Import Holidays</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="event-form">
                    <div className="form-group">
                        <label className="form-label">Select Country</label>
                        <select
                            className="form-select"
                            value={selectedCountry}
                            onChange={(e) => {
                                setSelectedCountry(e.target.value);
                                setSelectedHolidays(new Set());
                            }}
                        >
                            {countries.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <div className="holiday-header">
                            <label className="form-label">
                                Select Holidays ({selectedHolidays.size} of {holidays.length} selected)
                            </label>
                            <button
                                type="button"
                                className="btn-secondary holiday-select-all-btn"
                                onClick={handleSelectAll}
                            >
                                {selectedHolidays.size === holidays.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="holiday-list-container">
                            {holidays.map(holiday => (
                                <div
                                    key={holiday.name}
                                    className={`holiday-item ${selectedHolidays.has(holiday.name) ? 'selected' : ''}`}
                                    onClick={() => handleToggleHoliday(holiday.name)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedHolidays.has(holiday.name)}
                                        onChange={() => handleToggleHoliday(holiday.name)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="holiday-item-content">
                                        <div className="holiday-item-name">
                                            {holiday.name}
                                        </div>
                                        <div className="holiday-item-date">
                                            {new Date(holiday.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-save"
                            onClick={handleImport}
                            disabled={selectedHolidays.size === 0}
                            style={{
                                opacity: selectedHolidays.size === 0 ? 0.5 : 1,
                                cursor: selectedHolidays.size === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Import {selectedHolidays.size} Holiday{selectedHolidays.size !== 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
