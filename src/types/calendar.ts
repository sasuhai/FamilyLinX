/**
 * Calendar event types for FamilyLinX
 */

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    allDay: boolean;
    category: 'meeting' | 'birthday' | 'anniversary' | 'holiday' | 'reminder' | 'other';
    color?: string;
    location?: string;
    attendees?: string[]; // Person IDs
    createdBy: string; // Person ID or user identifier
    createdAt: number;
    updatedAt: number;
    isRecurring?: boolean;
    recurrenceRule?: string; // For future recurring events
}

export interface Holiday {
    id: string;
    name: string;
    date: Date;
    country: string;
    type: 'public' | 'observance' | 'religious';
}

export interface CalendarFilter {
    categories: string[];
    showHolidays: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
