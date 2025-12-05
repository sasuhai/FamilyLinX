# Component Diagram - FamilyLinX

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                 │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ State:                                                         │ │
│  │  - groups: Record<string, Group>                              │ │
│  │  - currentGroupId: string | null                              │ │
│  │  - navigationHistory: string[]                                │ │
│  │  - darkMode: boolean                                          │ │
│  │  - searchQuery: string                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│       Header.tsx            │   │      GroupView.tsx          │
│ ┌─────────────────────────┐ │   │ ┌─────────────────────────┐ │
│ │ Props:                  │ │   │ │ Props:                  │ │
│ │  - darkMode             │ │   │ │  - group                │ │
│ │  - searchQuery          │ │   │ │  - breadcrumbs          │ │
│ │  - onToggleDarkMode     │ │   │ │  - searchQuery          │ │
│ │  - onSearchChange       │ │   │ │  - onNavigate...        │ │
│ │  - onExportData         │ │   │ │  - onCreateSubGroup     │ │
│ │  - onImportData         │ │   │ │  - onViewSubGroup       │ │
│ │  - onCreateGroup        │ │   │ └─────────────────────────┘ │
│ └─────────────────────────┘ │   │                             │
│                             │   │  ┌────────────────────────┐ │
│  Components:                │   │  │   Breadcrumb.tsx       │ │
│  ┌──────────────────┐       │   │  │ ┌────────────────────┐ │
│  │ Search Input     │       │   │  │ │ Props:             │ │
│  │ Dark Mode Toggle │       │   │  │ │  - items           │ │
│  │ New Group Button │       │   │  │ │  - onNavigate      │ │
│  │ Menu Dropdown    │       │   │  │ └────────────────────┘ │
│  │  - Export        │       │   │  └────────────────────────┘ │
│  │  - Import        │       │   │                             │
│  └──────────────────┘       │   │  ┌────────────────────────┐ │
└─────────────────────────────┘   │  │   PersonCard.tsx[]     │ │
                                  │  │ ┌────────────────────┐ │ │
                                  │  │ │ Props:             │ │ │
                                  │  │ │  - person          │ │ │
                                  │  │ │  - onClick         │ │ │
                                  │  │ └────────────────────┘ │ │
                                  │  │                        │ │
                                  │  │  ┌──────────────────┐ │ │
                                  │  │  │PhotoRotator.tsx  │ │ │
                                  │  │  │ ┌──────────────┐ │ │ │
                                  │  │  │ │ Props:       │ │ │ │
                                  │  │  │ │  - photos    │ │ │ │
                                  │  │  │ │  - interval  │ │ │ │
                                  │  │  │ └──────────────┘ │ │ │
                                  │  │  └──────────────────┘ │ │
                                  │  └────────────────────────┘ │
                                  │                             │
                                  │  ┌────────────────────────┐ │
                                  │  │   PersonModal.tsx      │ │
                                  │  │ ┌────────────────────┐ │ │
                                  │  │ │ Props:             │ │ │
                                  │  │ │  - person          │ │ │
                                  │  │ │  - onClose         │ │ │
                                  │  │ │  - onCreateSubGroup│ │ │
                                  │  │ │  - onViewSubGroup  │ │ │
                                  │  │ └────────────────────┘ │ │
                                  │  │                        │ │
                                  │  │ State:                 │ │
                                  │  │  - selectedPhoto       │ │
                                  │  │  - viewMode            │ │
                                  │  │                        │ │
                                  │  │ Views:                 │ │
                                  │  │  - Grid View           │ │
                                  │  │  - Timeline View       │ │
                                  │  │  - Lightbox            │ │
                                  │  └────────────────────────┘ │
                                  └─────────────────────────────┘
```

## Component Interaction Flow

### 1. Initial Render
```
App (Load from localStorage)
  ↓
Header + GroupView
  ↓
Breadcrumb + PersonCard[]
  ↓
PhotoRotator (auto-start rotation)
```

### 2. Search Flow
```
User types in Header.search
  ↓
onSearchChange (debounced 300ms)
  ↓
App updates searchQuery state
  ↓
GroupView filters members
  ↓
PersonCard[] re-renders (filtered)
```

### 3. Person Click Flow
```
User clicks PersonCard
  ↓
PersonCard.onClick()
  ↓
GroupView sets selectedPerson
  ↓
PersonModal renders
  ↓
Display photos in grid/timeline
```

### 4. Sub-Group Creation Flow
```
User clicks "Create Sub-Group" in PersonModal
  ↓
PersonModal.onCreateSubGroup()
  ↓
GroupView.onCreateSubGroup(personId)
  ↓
App.handleCreateSubGroup(personId)
  ↓
Create new Group
  ↓
Update Person.subGroupId
  ↓
Save to localStorage
  ↓
Re-render (person now has sub-group badge)
```

### 5. Navigation Flow
```
User clicks "View Sub-Group"
  ↓
PersonModal.onViewSubGroup()
  ↓
GroupView.onViewSubGroup(subGroupId)
  ↓
App.handleViewSubGroup(subGroupId)
  ↓
Update currentGroupId
  ↓
Add to navigationHistory
  ↓
GroupView re-renders with new group
  ↓
Breadcrumb updates
```

### 6. Breadcrumb Navigation Flow
```
User clicks breadcrumb item
  ↓
Breadcrumb.onNavigate(groupId)
  ↓
GroupView.onNavigateToBreadcrumb(groupId)
  ↓
App.handleNavigateToBreadcrumb(groupId)
  ↓
Update currentGroupId
  ↓
Trim navigationHistory
  ↓
GroupView re-renders
```

## Component Responsibilities Matrix

| Component | Display | State | Events | Data Transform |
|-----------|---------|-------|--------|----------------|
| **App** | Layout | ✅ Global | ✅ All handlers | ✅ CRUD operations |
| **Header** | Navigation | ❌ | ✅ User input | ❌ |
| **GroupView** | Group layout | ✅ Modal state | ✅ Person selection | ✅ Search filter |
| **PersonCard** | Person info | ❌ | ✅ Click | ❌ |
| **PersonModal** | Detail view | ✅ View mode | ✅ Photo selection | ❌ |
| **PhotoRotator** | Slideshow | ✅ Current index | ✅ Navigation | ✅ Sort by year |
| **Breadcrumb** | Navigation | ❌ | ✅ Click | ❌ |

## Props Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      App State                          │
│  {                                                      │
│    groups: {...},                                       │
│    currentGroupId: "abc123",                            │
│    navigationHistory: ["abc123", "def456"],             │
│    darkMode: false,                                     │
│    searchQuery: "john"                                  │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────────┐
│ Header Props     │            │ GroupView Props      │
│ ────────────     │            │ ────────────────     │
│ darkMode         │            │ group                │
│ searchQuery      │            │ breadcrumbs          │
│ onToggleDarkMode │            │ searchQuery          │
│ onSearchChange   │            │ onNavigate...        │
│ onExportData     │            │ onCreateSubGroup     │
│ onImportData     │            │ onViewSubGroup       │
│ onCreateGroup    │            └──────────────────────┘
└──────────────────┘                       │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                    ┌──────────────────┐    ┌──────────────────┐
                    │ Breadcrumb Props │    │ PersonCard Props │
                    │ ──────────────── │    │ ──────────────── │
                    │ items            │    │ person           │
                    │ onNavigate       │    │ onClick          │
                    └──────────────────┘    └──────────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │PhotoRotator Props│
                                            │ ──────────────── │
                                            │ photos           │
                                            │ interval         │
                                            └──────────────────┘
```

## Event Bubbling Pattern

```
PhotoRotator (click indicator)
  ↓ (handled internally)
PhotoRotator updates currentIndex

PersonCard (click card)
  ↓ (bubble up)
GroupView.setSelectedPerson()
  ↓ (render)
PersonModal (open)

PersonModal (click "Create Sub-Group")
  ↓ (bubble up)
GroupView.onCreateSubGroup()
  ↓ (bubble up)
App.handleCreateSubGroup()
  ↓ (state update)
Re-render entire tree
```

## Styling Architecture

```
┌─────────────────────────────────────────┐
│         index.css (Design System)       │
│  - CSS Custom Properties (--primary-*)  │
│  - Global Styles (*, body, html)        │
│  - Utility Classes (.btn, .card, etc)   │
│  - Animations (@keyframes)              │
└─────────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    ▼                           ▼
┌─────────────┐         ┌─────────────┐
│ Header.css  │         │GroupView.css│
│ (Scoped)    │         │  (Scoped)   │
└─────────────┘         └─────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐      ┌──────────────┐
            │PersonCard.css│      │PersonModal.css│
            │   (Scoped)   │      │   (Scoped)   │
            └──────────────┘      └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │PhotoRotator  │
            │    .css      │
            │  (Scoped)    │
            └──────────────┘
```

## Type Dependencies

```typescript
// types/index.ts
export interface Photo { ... }
export interface Person {
  photos: Photo[];  // depends on Photo
  ...
}
export interface Group {
  members: Person[];  // depends on Person
  ...
}
export interface AppState {
  groups: Record<string, Group>;  // depends on Group
  ...
}

// Component imports
App.tsx           → AppState, Group, Photo, BreadcrumbItem
GroupView.tsx     → Group, Person
PersonCard.tsx    → Person
PersonModal.tsx   → Person, Photo
PhotoRotator.tsx  → Photo
Breadcrumb.tsx    → BreadcrumbItem
```

## Utility Dependencies

```
components/
  ├── Header.tsx → utils/helpers (debounce)
  ├── PersonCard.tsx → utils/helpers (calculateAge)
  ├── PhotoRotator.tsx → utils/helpers (sortPhotosByYear)
  └── PersonModal.tsx → utils/helpers (sortPhotosByYear, calculateAge)

App.tsx →
  ├── utils/helpers (generateId)
  └── utils/storage (save, load, export, import)
```

## Render Optimization Strategy

### Current Optimizations
1. **Component Memoization** (Future)
```typescript
export const PersonCard = React.memo(({ person, onClick }) => {
  // Only re-render if person or onClick changes
});
```

2. **Callback Memoization** (Future)
```typescript
const handleClick = useCallback(() => {
  setSelectedPerson(person);
}, [person]);
```

3. **Computed Values** (Future)
```typescript
const filteredMembers = useMemo(() => {
  return members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [members, searchQuery]);
```

### Performance Metrics Target
- **Initial Load**: < 1s
- **Navigation**: < 100ms
- **Search**: < 50ms (debounced)
- **Photo Rotation**: 60fps
- **Modal Open**: < 200ms

## Testing Strategy

### Unit Tests (Future)
```typescript
// PhotoRotator.test.tsx
describe('PhotoRotator', () => {
  it('rotates photos automatically', () => {
    // Test auto-rotation
  });
  
  it('allows manual navigation', () => {
    // Test click indicators
  });
});
```

### Integration Tests (Future)
```typescript
// GroupView.test.tsx
describe('GroupView', () => {
  it('filters members by search query', () => {
    // Test search functionality
  });
  
  it('opens person modal on card click', () => {
    // Test modal interaction
  });
});
```

### E2E Tests (Future)
```typescript
// e2e/navigation.spec.ts
describe('Navigation', () => {
  it('navigates through sub-groups', () => {
    // Test full navigation flow
  });
});
```

## Accessibility Considerations

### ARIA Labels
```typescript
// Breadcrumb
<nav aria-label="Breadcrumb">

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

// Buttons
<button aria-label="Close modal">
```

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for photo navigation

### Screen Reader Support
- Semantic HTML (nav, main, header, footer)
- Alt text for images
- ARIA live regions for dynamic content

## Conclusion

This component architecture provides:
- ✅ Clear separation of concerns
- ✅ Unidirectional data flow
- ✅ Reusable components
- ✅ Type safety
- ✅ Scalable structure
- ✅ Easy to test
- ✅ Maintainable codebase
