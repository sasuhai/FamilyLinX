/**
 * Core data models for FamilyLinX
 */

export interface Photo {
  id: string;
  url: string;
  yearTaken: number;
  caption?: string;
}

export interface Person {
  id: string;
  name: string;
  relationship: string;
  gender?: 'male' | 'female';
  yearOfBirth: number;
  isDeceased?: boolean;
  yearOfDeath?: number;
  photos: Photo[];
  subGroupId?: string; // Reference to a sub-group if exists
}

export interface Group {
  id: string;
  name: string;
  slug?: string; // URL-friendly short name for the group
  description?: string;
  members: Person[];
  parentGroupId?: string; // For hierarchical navigation
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  groups: Record<string, Group>;
  currentGroupId: string | null;
  navigationHistory: string[]; // Stack for breadcrumb navigation
  darkMode: boolean;
  searchQuery: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}
