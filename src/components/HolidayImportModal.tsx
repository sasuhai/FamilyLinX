import React, { useState } from 'react';
import type { CalendarEvent } from '../types/calendar';
import { useLanguage } from '../contexts/LanguageContext';
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
    const { t } = useLanguage();
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
        <div className="modal-backdrop-dark" onClick={onClose}>
            <div className="modal-container-dark modal-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
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
                            <h2 className="modal-title-dark">{t('holiday.title')}</h2>
                            <p className="modal-subtitle-dark">{t('holiday.subtitle')}</p>
                        </div>
                    </div>
                    <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body-dark" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="form-group-dark">
                        <label htmlFor="country-select" className="form-label-dark">
                            {t('holiday.selectCountry')} <span className="form-required">*</span>
                        </label>
                        <select
                            id="country-select"
                            className="form-input-dark"
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

                    <div className="form-group-dark">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label className="form-label-dark" style={{ marginBottom: 0 }}>
                                {t('holiday.selectHolidays')} ({selectedHolidays.size} {t('holiday.of')} {holidays.length} {t('holiday.selected')})
                            </label>
                            <button
                                type="button"
                                className="btn-dark btn-dark-secondary"
                                onClick={handleSelectAll}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                {selectedHolidays.size === holidays.length ? t('holiday.deselectAll') : t('holiday.selectAll')}
                            </button>
                        </div>

                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--surface-color)'
                        }}>
                            {holidays.map(holiday => (
                                <div
                                    key={holiday.name}
                                    onClick={() => handleToggleHoliday(holiday.name)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        backgroundColor: selectedHolidays.has(holiday.name) ? 'var(--primary-50)' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selectedHolidays.has(holiday.name)) {
                                            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selectedHolidays.has(holiday.name)) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedHolidays.has(holiday.name)}
                                        onChange={() => handleToggleHoliday(holiday.name)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            width: '1.25rem',
                                            height: '1.25rem',
                                            cursor: 'pointer',
                                            accentColor: 'var(--primary-500)'
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: '600',
                                            color: 'rgba(255, 255, 255, 0.95)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {holiday.name}
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: 'rgba(255, 255, 255, 0.6)'
                                        }}>
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
                </div>

                {/* Footer */}
                <div className="modal-footer-dark">
                    <button
                        type="button"
                        className="btn-dark btn-dark-secondary"
                        onClick={onClose}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-dark btn-dark-primary"
                        onClick={handleImport}
                        disabled={selectedHolidays.size === 0}
                    >
                        {t('holiday.import')} {selectedHolidays.size} {selectedHolidays.size !== 1 ? t('holiday.holidays') : t('holiday.holiday')}
                    </button>
                </div>
            </div>
        </div>
    );
};
