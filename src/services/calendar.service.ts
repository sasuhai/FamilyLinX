/**
 * Firebase service for managing calendar events
 */

import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CalendarEvent } from '../types/calendar';

// Collection names
const FAMILIES_COLLECTION = 'families';
const CALENDAR_COLLECTION = 'calendar';

/**
 * Convert Firestore Timestamp to Date
 */
const timestampToDate = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }
    return new Date();
};

/**
 * Convert Date to Firestore Timestamp
 */
const dateToTimestamp = (date: Date): Timestamp => {
    return Timestamp.fromDate(date);
};

/**
 * Get all calendar events for a family/group
 */
export const getCalendarEvents = async (familyId: string): Promise<CalendarEvent[]> => {
    const eventsRef = collection(db, FAMILIES_COLLECTION, familyId, CALENDAR_COLLECTION);
    const eventsSnap = await getDocs(eventsRef);

    const events: CalendarEvent[] = [];
    eventsSnap.forEach((doc) => {
        const data = doc.data();
        events.push({
            ...data,
            id: doc.id,
            startDate: timestampToDate(data.startDate),
            endDate: timestampToDate(data.endDate),
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now()
        } as CalendarEvent);
    });

    return events;
};

/**
 * Get events for a specific date range
 */
export const getEventsByDateRange = async (
    familyId: string,
    startDate: Date,
    endDate: Date
): Promise<CalendarEvent[]> => {
    const eventsRef = collection(db, FAMILIES_COLLECTION, familyId, CALENDAR_COLLECTION);
    const q = query(
        eventsRef,
        where('startDate', '>=', dateToTimestamp(startDate)),
        where('startDate', '<=', dateToTimestamp(endDate)),
        orderBy('startDate', 'asc')
    );

    const eventsSnap = await getDocs(q);
    const events: CalendarEvent[] = [];

    eventsSnap.forEach((doc) => {
        const data = doc.data();
        events.push({
            ...data,
            id: doc.id,
            startDate: timestampToDate(data.startDate),
            endDate: timestampToDate(data.endDate),
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            updatedAt: (data.updatedAt as Timestamp)?.toMillis() || Date.now()
        } as CalendarEvent);
    });

    return events;
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (
    familyId: string,
    event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    const eventId = `event_${Date.now()}`;
    const eventRef = doc(db, FAMILIES_COLLECTION, familyId, CALENDAR_COLLECTION, eventId);

    const eventData: any = {
        ...event,
        id: eventId,
        startDate: dateToTimestamp(event.startDate),
        endDate: dateToTimestamp(event.endDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // Remove undefined fields (like startTime/endTime for all-day events)
    Object.keys(eventData).forEach(key => {
        if (eventData[key] === undefined) {
            delete eventData[key];
        }
    });

    await setDoc(eventRef, eventData);
    return eventId;
};


/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (
    familyId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
): Promise<void> => {
    const eventRef = doc(db, FAMILIES_COLLECTION, familyId, CALENDAR_COLLECTION, eventId);

    const dataToUpdate: any = {
        updatedAt: serverTimestamp()
    };

    // Only include defined fields in the update
    Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
            if (key === 'startDate' || key === 'endDate') {
                dataToUpdate[key] = dateToTimestamp(value);
            } else {
                dataToUpdate[key] = value;
            }
        }
    });

    await updateDoc(eventRef, dataToUpdate);
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (familyId: string, eventId: string): Promise<void> => {
    const eventRef = doc(db, FAMILIES_COLLECTION, familyId, CALENDAR_COLLECTION, eventId);
    await deleteDoc(eventRef);
};

/**
 * Get upcoming events (next 30 days)
 */
export const getUpcomingEvents = async (familyId: string, days: number = 30): Promise<CalendarEvent[]> => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return getEventsByDateRange(familyId, now, futureDate);
};
