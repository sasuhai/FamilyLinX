# System Architecture - FamilyLinX

## Overview

FamilyLinX is a client-side React application built with TypeScript and Vite. It follows a component-based architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              React Application                  │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────────┐ │    │
│  │  │         App Component (Root)             │ │    │
│  │  │  - State Management                      │ │    │
│  │  │  - Navigation Logic                      │ │    │
│  │  │  - Data Persistence                      │ │    │
│  │  └──────────────────────────────────────────┘ │    │
│  │                      │                         │    │
│  │         ┌────────────┴────────────┐           │    │
│  │         ▼                         ▼           │    │
│  │  ┌─────────────┐          ┌─────────────┐    │    │
│  │  │   Header    │          │  GroupView  │    │    │
│  │  │ Component   │          │  Component  │    │    │
│  │  └─────────────┘          └─────────────┘    │    │
│  │         │                         │           │    │
│  │         │                ┌────────┴────────┐ │    │
│  │         │                ▼                 ▼ │    │
│  │         │         ┌────────────┐  ┌──────────┐    │
│  │         │         │ PersonCard │  │Breadcrumb│    │
│  │         │         └────────────┘  └──────────┘    │
│  │         │                │                    │    │
│  │         │                ▼                    │    │
│  │         │         ┌────────────┐             │    │
│  │         │         │PhotoRotator│             │    │
│  │         │         └────────────┘             │    │
│  │         │                                    │    │
│  │         └────────────────────────────────────┘    │
│  │                                                    │
│  └────────────────────────────────────────────────────┘
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Utilities & Services                  │    │
│  │  - Storage (localStorage)                      │    │
│  │  - Helpers (ID generation, formatting)         │    │
│  │  - Type Definitions                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  localStorage    │
                │  (Browser API)   │
                └──────────────────┘
```

## Component Architecture

### 1. App Component (Root)
**Responsibility**: Application state and orchestration

**State Management**:
- `groups`: All group data
- `currentGroupId`: Active group
- `navigationHistory`: Breadcrumb trail
- `darkMode`: Theme preference
- `searchQuery`: Search filter

**Key Functions**:
- `handleCreateGroup()`: Create new groups
- `handleCreateSubGroup()`: Create hierarchical sub-groups
- `handleViewSubGroup()`: Navigate to sub-groups
- `handleNavigateToBreadcrumb()`: Navigate via breadcrumbs
- `handleExportData()`: Export to JSON
- `handleImportData()`: Import from JSON

### 2. Header Component
**Responsibility**: Top navigation and controls

**Features**:
- Search bar with debounced input
- Dark mode toggle
- New group creation
- Import/Export menu

**Props**:
```typescript
{
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onCreateGroup: () => void;
}
```

### 3. GroupView Component
**Responsibility**: Display group members

**Features**:
- Member grid layout
- Search filtering
- Empty states
- Statistics display

**Props**:
```typescript
{
  group: Group;
  breadcrumbs: BreadcrumbItem[];
  onNavigateToBreadcrumb: (id: string) => void;
  onCreateSubGroup: (personId: string) => void;
  onViewSubGroup: (subGroupId: string) => void;
  searchQuery: string;
}
```

### 4. PersonCard Component
**Responsibility**: Display individual person

**Features**:
- Photo rotation
- Person details
- Sub-group indicator
- Hover effects

**Props**:
```typescript
{
  person: Person;
  onClick: () => void;
}
```

### 5. PersonModal Component
**Responsibility**: Detailed person view

**Features**:
- Grid/Timeline view toggle
- Photo gallery
- Lightbox for full-screen
- Sub-group management

**Props**:
```typescript
{
  person: Person;
  onClose: () => void;
  onCreateSubGroup: () => void;
  onViewSubGroup?: () => void;
}
```

### 6. PhotoRotator Component
**Responsibility**: Automatic photo slideshow

**Features**:
- Auto-rotation with configurable interval
- Manual navigation
- Year display
- Smooth transitions

**Props**:
```typescript
{
  photos: Photo[];
  interval?: number;
  className?: string;
}
```

### 7. Breadcrumb Component
**Responsibility**: Hierarchical navigation

**Features**:
- Clickable navigation path
- Current location highlight
- Responsive design

**Props**:
```typescript
{
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}
```

## Data Flow

### 1. User Interaction Flow
```
User Action
    ↓
Event Handler (Component)
    ↓
State Update (App Component)
    ↓
localStorage Save (Auto)
    ↓
Re-render (React)
    ↓
UI Update (with animations)
```

### 2. Navigation Flow
```
Click Person Card
    ↓
Open PersonModal
    ↓
Click "Create Sub-Group"
    ↓
Create New Group
    ↓
Update Person with subGroupId
    ↓
Navigate to Sub-Group
    ↓
Update navigationHistory
    ↓
Render New GroupView
```

### 3. Data Persistence Flow
```
State Change
    ↓
useEffect Trigger
    ↓
saveToLocalStorage()
    ↓
JSON.stringify(state)
    ↓
localStorage.setItem()
```

## State Management Strategy

### Current: Local State + localStorage
- **Pros**: Simple, no dependencies, works offline
- **Cons**: Single-user, no sync, limited to ~5-10MB

### Future: Cloud Backend Options

#### Option 1: Firebase
```typescript
// Firestore structure
/groups/{groupId}
  - name, description, createdAt, updatedAt
  /members/{personId}
    - name, relationship, yearOfBirth
    /photos/{photoId}
      - url, yearTaken, caption
```

#### Option 2: Supabase
```sql
-- PostgreSQL schema
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE persons (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  name TEXT NOT NULL,
  relationship TEXT,
  year_of_birth INTEGER,
  sub_group_id UUID REFERENCES groups(id)
);

CREATE TABLE photos (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id),
  url TEXT NOT NULL,
  year_taken INTEGER,
  caption TEXT
);
```

## Performance Considerations

### Current Optimizations
1. **Lazy Loading**: Images load on-demand
2. **Debounced Search**: 300ms delay to reduce re-renders
3. **CSS Transitions**: Hardware-accelerated animations
4. **Code Splitting**: Vite's automatic chunking

### Scaling Strategies

#### For 100+ Members per Group
```typescript
// Implement virtualization
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={4}
  rowCount={Math.ceil(members.length / 4)}
  columnWidth={300}
  rowHeight={400}
  height={800}
  width={1200}
>
  {({ columnIndex, rowIndex, style }) => (
    <PersonCard person={members[rowIndex * 4 + columnIndex]} />
  )}
</FixedSizeGrid>
```

#### For 1000+ Photos
```typescript
// Implement pagination
const PHOTOS_PER_PAGE = 20;
const [page, setPage] = useState(1);
const paginatedPhotos = photos.slice(
  (page - 1) * PHOTOS_PER_PAGE,
  page * PHOTOS_PER_PAGE
);
```

## Security Considerations

### Current (Client-Side Only)
- ✅ No server = No server vulnerabilities
- ✅ Data stays local
- ⚠️ No authentication
- ⚠️ No encryption

### Future (With Backend)
1. **Authentication**: OAuth 2.0 (Google, GitHub)
2. **Authorization**: Row-level security
3. **Data Encryption**: At rest and in transit
4. **Input Validation**: Server-side validation
5. **Rate Limiting**: Prevent abuse
6. **CORS**: Proper origin restrictions

## Deployment Architecture

### Static Hosting (Current)
```
Netlify/Vercel/GitHub Pages
    ↓
CDN (Global Distribution)
    ↓
User's Browser
    ↓
localStorage (Data)
```

### Full-Stack (Future)
```
Frontend (Vercel)          Backend (Firebase/Supabase)
    ↓                              ↓
CDN                           Database
    ↓                              ↓
User's Browser  ←──────────→  API Gateway
                  (HTTPS)
```

## Technology Decisions

### Why React?
- Component reusability
- Large ecosystem
- Excellent TypeScript support
- Virtual DOM performance

### Why TypeScript?
- Type safety
- Better IDE support
- Catch errors early
- Self-documenting code

### Why Vite?
- Fast HMR (Hot Module Replacement)
- Modern build tool
- Optimized production builds
- Great developer experience

### Why CSS (not Tailwind)?
- Full control over design
- Better performance (no unused CSS)
- Custom design system
- Easier theming

## Future Architecture Enhancements

### 1. Progressive Web App (PWA)
```typescript
// service-worker.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('familylinx-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/index.js',
        '/assets/index.css'
      ]);
    })
  );
});
```

### 2. Real-Time Sync
```typescript
// Using Supabase real-time
const subscription = supabase
  .from('groups')
  .on('*', (payload) => {
    console.log('Change received!', payload);
    updateLocalState(payload.new);
  })
  .subscribe();
```

### 3. Offline-First
```typescript
// IndexedDB for offline storage
import { openDB } from 'idb';

const db = await openDB('familylinx', 1, {
  upgrade(db) {
    db.createObjectStore('groups');
    db.createObjectStore('photos');
  }
});
```

## Conclusion

The current architecture is optimized for:
- ✅ Rapid development
- ✅ Simple deployment
- ✅ Offline functionality
- ✅ Great performance

Future enhancements will focus on:
- 🔄 Multi-user collaboration
- ☁️ Cloud storage
- 📱 Mobile apps (React Native)
- 🔐 Advanced security
