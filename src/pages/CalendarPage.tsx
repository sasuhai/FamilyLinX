import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernHeader } from '../components/ModernHeader';
import { AddEventModal } from '../components/AddEventModal';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { HolidayImportModal } from '../components/HolidayImportModal';
import {
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getUpcomingEvents
} from '../services/calendar.service';
import { getFamilyByRootSlug } from '../services/firebase.service';
import type { CalendarEvent } from '../types/calendar';
import './CalendarPage.css';

export const CalendarPage: React.FC = () => {
    const { rootSlug } = useParams<{ rootSlug: string }>();
    const navigate = useNavigate();

    // State
    const [familyId, setFamilyId] = useState<string | null>(null);
    const [familyName, setFamilyName] = useState('');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
    const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(new Date());
    const [darkMode, setDarkMode] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [showHolidayImport, setShowHolidayImport] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Load family data
    useEffect(() => {
        const loadFamilyData = async () => {
            if (!rootSlug) return;

            setIsLoading(true);
            try {
                const familyData = await getFamilyByRootSlug(rootSlug);
                if (familyData) {
                    setFamilyId(familyData.familyId);
                    setFamilyName(familyData.family.name);
                }
            } catch (error) {
                console.error('Error loading family data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFamilyData();
    }, [rootSlug]);

    // Load calendar events
    useEffect(() => {
        const loadEvents = async () => {
            if (!familyId) return;

            try {
                const allEvents = await getCalendarEvents(familyId);
                setEvents(allEvents);

                const upcoming = await getUpcomingEvents(familyId, 30);
                setUpcomingEvents(upcoming);
            } catch (error) {
                console.error('Error loading events:', error);
            }
        };

        loadEvents();
    }, [familyId]);

    // Dark mode
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Helper functions
    function getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    function getWeekDays(weekStart: Date): Date[] {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatTime(time: string): string {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    function isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    function isToday(date: Date): boolean {
        return isSameDay(date, new Date());
    }

    // Event handlers
    const handleNavigateHome = () => {
        navigate(`/${rootSlug}`);
    };

    const handlePreviousWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newWeekStart);
    };

    const handleNextWeek = () => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newWeekStart);
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentWeekStart(getWeekStart(today));
        setSelectedDate(today);
    };

    const handlePreviousMonth = () => {
        const newMonth = new Date(miniCalendarMonth);
        newMonth.setMonth(miniCalendarMonth.getMonth() - 1);
        setMiniCalendarMonth(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = new Date(miniCalendarMonth);
        newMonth.setMonth(miniCalendarMonth.getMonth() + 1);
        setMiniCalendarMonth(newMonth);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setCurrentWeekStart(getWeekStart(date));
    };

    const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!familyId) return;

        try {
            await createCalendarEvent(familyId, eventData);
            const allEvents = await getCalendarEvents(familyId);
            setEvents(allEvents);
            const upcoming = await getUpcomingEvents(familyId, 30);
            setUpcomingEvents(upcoming);
            setShowAddEvent(false);
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    };

    const handleUpdateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
        if (!familyId) return;

        try {
            await updateCalendarEvent(familyId, eventId, updates);
            const allEvents = await getCalendarEvents(familyId);
            setEvents(allEvents);
            const upcoming = await getUpcomingEvents(familyId, 30);
            setUpcomingEvents(upcoming);
            setShowEventDetails(false);
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!familyId) return;

        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await deleteCalendarEvent(familyId, eventId);
            const allEvents = await getCalendarEvents(familyId);
            setEvents(allEvents);
            const upcoming = await getUpcomingEvents(familyId, 30);
            setUpcomingEvents(upcoming);
            setShowEventDetails(false);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setShowEventDetails(true);
    };

    const handleImportHolidays = async (holidays: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => {
        if (!familyId) return;

        try {
            for (const holiday of holidays) {
                await createCalendarEvent(familyId, holiday);
            }
            const allEvents = await getCalendarEvents(familyId);
            setEvents(allEvents);
            const upcoming = await getUpcomingEvents(familyId, 30);
            setUpcomingEvents(upcoming);
            setShowHolidayImport(false);
        } catch (error) {
            console.error('Error importing holidays:', error);
            alert('Failed to import holidays. Please try again.');
        }
    };

    // Get events for a specific day
    const getEventsForDay = (date: Date): CalendarEvent[] => {
        return events.filter(event => {
            const eventDate = new Date(event.startDate);
            return isSameDay(eventDate, date);
        }).filter(event => {
            if (categoryFilter === 'all') return true;
            return event.category === categoryFilter;
        });
    };

    // Get event count for a specific date
    const getEventCountForDate = (date: Date): number => {
        return events.filter(event => {
            const eventDate = new Date(event.startDate);
            return isSameDay(eventDate, date);
        }).length;
    };

    // Render mini calendar
    const renderMiniCalendar = () => {
        const year = miniCalendarMonth.getFullYear();
        const month = miniCalendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
            days.push(prevMonthDate);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        // Add days from next month to complete the grid
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push(new Date(year, month + 1, i));
        }

        return (
            <div className="mini-calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="mini-calendar-day-header">{day}</div>
                ))}
                {days.map((date, index) => {
                    if (!date) return <div key={index} className="mini-calendar-day" />;

                    const isCurrentMonth = date.getMonth() === month;
                    const isTodayDate = isToday(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const eventCount = getEventCountForDate(date);
                    const hasEvents = eventCount > 0;

                    return (
                        <div
                            key={index}
                            className={`mini-calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
                            data-event-count={eventCount}
                            onClick={() => handleDateClick(date)}
                        >
                            {date.getDate()}
                            {hasEvents && eventCount > 1 && (
                                <div className="event-dots">
                                    {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                                        <span key={i} className="event-dot" />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render weekly calendar
    const renderWeeklyCalendar = () => {
        const weekDays = getWeekDays(currentWeekStart);
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="weekly-grid">
                {/* Time column */}
                <div className="time-column">
                    <div className="day-header" style={{ visibility: 'hidden' }}>Time</div>
                    {hours.map(hour => (
                        <div key={hour} className="time-slot">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                    const dayEvents = getEventsForDay(day);
                    const isTodayDate = isToday(day);

                    return (
                        <div key={dayIndex} className="day-column">
                            <div className={`day-header ${isTodayDate ? 'today' : ''}`}>
                                <div className="day-header-date">
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="day-header-day">{day.getDate()}</div>
                            </div>
                            <div className="day-slots">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="hour-slot"
                                        onClick={() => {
                                            setSelectedDate(day);
                                            setShowAddEvent(true);
                                        }}
                                    />
                                ))}
                                {/* Render events */}
                                {dayEvents.map(event => {
                                    const startTime = event.startTime || '09:00';
                                    const endTime = event.endTime || '10:00';
                                    const [startHour, startMinute] = startTime.split(':').map(Number);
                                    const [endHour, endMinute] = endTime.split(':').map(Number);

                                    const top = (startHour * 60 + startMinute) / 60 * 48;
                                    const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60 * 48;

                                    return (
                                        <div
                                            key={event.id}
                                            className={`calendar-event event-${event.category}`}
                                            style={{
                                                top: `${top}px`,
                                                height: `${Math.max(height, 24)}px`
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEventClick(event);
                                            }}
                                        >
                                            <div className="calendar-event-title">{event.title}</div>
                                            <div className="calendar-event-time">
                                                {formatTime(startTime)} - {formatTime(endTime)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (isLoading) {
        return <div className="calendar-page">Loading...</div>;
    }

    return (
        <div className="calendar-page">
            <ModernHeader
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                onNavigateHome={handleNavigateHome}
                familyName={familyName}
                isAdminMode={isAdminMode}
                onToggleAdminMode={() => setIsAdminMode(!isAdminMode)}
                onCreateNewPage={() => { }}
                onManageAlbums={() => { }}
            />

            <div className="calendar-container">
                <div className="calendar-header">
                    <h1 className="calendar-title">
                        {familyName} Calendar
                    </h1>
                    <p className="calendar-subtitle">
                        Manage your team's schedule and upcoming events
                    </p>
                </div>

                <div className="calendar-controls">
                    <div className="control-group">
                        <label className="control-label">Filter:</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Events</option>
                            <option value="meeting">Meetings</option>
                            <option value="birthday">Birthdays</option>
                            <option value="anniversary">Anniversaries</option>
                            <option value="holiday">Holidays</option>
                            <option value="reminder">Reminders</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {isAdminMode && (
                        <>
                            <button className="btn-primary" onClick={() => setShowAddEvent(true)}>
                                ➕ Add Event
                            </button>
                            <button className="btn-secondary" onClick={() => setShowHolidayImport(true)}>
                                🌍 Import Holidays
                            </button>
                        </>
                    )}
                </div>

                <div className="calendar-main">
                    {/* Sidebar */}
                    <div className="calendar-sidebar">
                        {/* Mini Calendar */}
                        <div className="sidebar-section">
                            <h3 className="sidebar-section-title">Calendar</h3>
                            <div className="mini-calendar">
                                <div className="mini-calendar-header">
                                    <div className="mini-calendar-month">
                                        {miniCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="mini-calendar-nav">
                                        <button onClick={handlePreviousMonth}>‹</button>
                                        <button onClick={handleNextMonth}>›</button>
                                    </div>
                                </div>
                                {renderMiniCalendar()}
                            </div>
                        </div>

                        {/* Upcoming Events */}
                        <div className="sidebar-section">
                            <h3 className="sidebar-section-title">Upcoming Events</h3>
                            {upcomingEvents.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📭</div>
                                    <div className="empty-state-text">No upcoming events</div>
                                </div>
                            ) : (
                                <div className="upcoming-events-list">
                                    {upcomingEvents.slice(0, 10).map(event => (
                                        <div
                                            key={event.id}
                                            className="upcoming-event-item"
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="upcoming-event-date">
                                                {formatDate(new Date(event.startDate))}
                                            </div>
                                            <div className="upcoming-event-title">{event.title}</div>
                                            {event.startTime && (
                                                <div className="upcoming-event-time">
                                                    {formatTime(event.startTime)}
                                                </div>
                                            )}
                                            <span className={`upcoming-event-category category-${event.category}`}>
                                                {event.category}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Calendar */}
                    <div className="weekly-calendar">
                        <div className="weekly-header">
                            <h2 className="weekly-title">
                                Week of {formatDate(currentWeekStart)}
                            </h2>
                            <div className="weekly-nav">
                                <button onClick={handlePreviousWeek}>‹ Previous</button>
                                <button onClick={handleToday}>Today</button>
                                <button onClick={handleNextWeek}>Next ›</button>
                            </div>
                        </div>
                        {renderWeeklyCalendar()}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddEvent && (
                <AddEventModal
                    onClose={() => setShowAddEvent(false)}
                    onSave={handleAddEvent}
                    initialDate={selectedDate}
                />
            )}

            {showEventDetails && selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setShowEventDetails(false)}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                    isAdminMode={isAdminMode}
                />
            )}

            {showHolidayImport && (
                <HolidayImportModal
                    onClose={() => setShowHolidayImport(false)}
                    onImport={handleImportHolidays}
                />
            )}
        </div>
    );
};
