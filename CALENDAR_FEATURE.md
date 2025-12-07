# Calendar Feature Documentation

## Overview
The Calendar feature provides a comprehensive team/group-specific calendar management system with a beautiful, modern interface. Each team has its own isolated calendar that doesn't share events with other groups.

## Features

### 📅 **Weekly Calendar View**
- Full weekly calendar with hourly time slots (24-hour view)
- Drag-and-drop event placement (visual positioning)
- Color-coded events by category
- Responsive design that adapts to mobile devices

### 🗓️ **Mini Monthly Calendar**
- Compact monthly overview in the sidebar
- Visual indicators for days with events
- Quick navigation between months
- Click any date to jump to that week

### ⏰ **Upcoming Events**
- Sidebar widget showing next 30 days of events
- Quick preview of event details
- Click to view full event information
- Category badges for easy identification

### ➕ **Event Management** (Admin Mode)
- **Add Events**: Create new calendar entries with:
  - Title and description
  - Start/end dates and times
  - All-day event option
  - Category selection (Meeting, Birthday, Anniversary, Holiday, Reminder, Other)
  - Location information
  - Custom color coding

- **Edit Events**: Modify existing events
- **Delete Events**: Remove events with confirmation
- **View Details**: See complete event information

### 🌍 **Holiday Import**
Import public holidays for multiple countries:
- **United States** - 10 major holidays
- **United Kingdom** - 8 bank holidays
- **Canada** - 11 statutory holidays
- **Australia** - 9 public holidays
- **Singapore** - 11 public holidays
- **Malaysia** - 13 public holidays
- **India** - 9 major holidays

Features:
- Select/deselect individual holidays
- Bulk import with "Select All" option
- Holidays automatically marked as all-day events
- Green color coding for easy identification

### 🎨 **Category System**
Events are color-coded by category:
- **Meeting** - Blue gradient
- **Birthday** - Pink gradient
- **Anniversary** - Orange gradient
- **Holiday** - Green gradient
- **Reminder** - Purple gradient
- **Other** - Gray gradient

### 🔍 **Filtering**
- Filter events by category
- Show/hide specific event types
- Real-time filtering without page reload

### 🌓 **Dark Mode Support**
- Full dark mode compatibility
- Automatic theme switching
- Optimized colors for both light and dark themes

## Technical Implementation

### File Structure
```
src/
├── pages/
│   ├── CalendarPage.tsx       # Main calendar component
│   └── CalendarPage.css       # Calendar styling
├── components/
│   ├── AddEventModal.tsx      # Event creation modal
│   ├── EventDetailsModal.tsx  # Event viewing/editing modal
│   ├── HolidayImportModal.tsx # Holiday import interface
│   └── AddEventModal.css      # Modal styling
├── services/
│   └── calendar.service.ts    # Firebase calendar operations
└── types/
    └── calendar.ts            # Calendar type definitions
```

### Data Model

#### CalendarEvent
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;      // HH:MM format
  endTime?: string;        // HH:MM format
  allDay: boolean;
  category: 'meeting' | 'birthday' | 'anniversary' | 'holiday' | 'reminder' | 'other';
  color?: string;
  location?: string;
  attendees?: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

### Firebase Structure
```
families/
  └── {familyId}/
      └── calendar/
          └── {eventId}/
              ├── title
              ├── description
              ├── startDate (Timestamp)
              ├── endDate (Timestamp)
              ├── startTime
              ├── endTime
              ├── allDay
              ├── category
              ├── color
              ├── location
              ├── createdBy
              ├── createdAt (Timestamp)
              └── updatedAt (Timestamp)
```

## Usage

### Accessing the Calendar
1. Navigate to any team page (e.g., `/otai`)
2. Click "Calendar" in the header navigation
3. You'll be redirected to `/{teamSlug}/calendar`

### Creating an Event
1. Enable Admin Mode (lock icon in header)
2. Click "➕ Add Event" button
3. Fill in event details:
   - Event title (required)
   - Description (optional)
   - Category
   - Location
   - Start/end dates
   - Time (or mark as all-day)
4. Click "Save Event"

### Importing Holidays
1. Enable Admin Mode
2. Click "🌍 Import Holidays"
3. Select your country from the dropdown
4. Check the holidays you want to import
5. Click "Import X Holidays"

### Viewing Event Details
- Click any event in the calendar or upcoming events list
- View full event information
- Edit or delete (if in Admin Mode)

### Navigation
- **Weekly View**:
  - Click "‹ Previous" / "Next ›" to navigate weeks
  - Click "Today" to jump to current week
  
- **Mini Calendar**:
  - Click "‹" / "›" to navigate months
  - Click any date to view that week

## Responsive Design

### Desktop (>1200px)
- Full sidebar with mini calendar and upcoming events
- 7-day weekly view
- All features visible

### Tablet (768px - 1200px)
- Condensed sidebar
- 7-day weekly view
- Optimized spacing

### Mobile (<768px)
- Stacked layout (calendar on top, sidebar below)
- 3-day weekly view for better readability
- Touch-optimized controls
- Collapsible sections

## Security & Permissions

### Admin Mode Required For:
- Creating events
- Editing events
- Deleting events
- Importing holidays

### View-Only Mode:
- View calendar
- See event details
- Navigate dates
- Filter events

## Future Enhancements (Potential)
- [ ] Recurring events
- [ ] Event reminders/notifications
- [ ] Attendee management
- [ ] Event export (iCal format)
- [ ] Multi-day event spanning
- [ ] Drag-and-drop event rescheduling
- [ ] Event search functionality
- [ ] Calendar sharing/permissions
- [ ] Integration with birthdays from member profiles
- [ ] Event comments/notes

## Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes
- Events are cached locally after initial load
- Real-time updates when events are modified
- Optimized rendering for large event lists
- Lazy loading for upcoming events

## Troubleshooting

### Events not showing
1. Check if you're viewing the correct team's calendar
2. Verify the date range filter
3. Check category filter settings
4. Ensure events exist in the database

### Can't create events
1. Verify Admin Mode is enabled
2. Check Firebase permissions
3. Ensure all required fields are filled

### Import holidays not working
1. Verify Admin Mode is enabled
2. Check internet connection
3. Ensure at least one holiday is selected
