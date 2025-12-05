/**
 * Local storage utilities for persisting app data
 */

import type { AppState, Group } from '../types';

const STORAGE_KEY = 'familylinx_data';

export const saveToLocalStorage = (state: AppState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

export const loadFromLocalStorage = (): Partial<AppState> | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
    }
};

export const exportData = (groups: Record<string, Group>): void => {
    const dataStr = JSON.stringify(groups, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `familylinx_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<Record<string, Group>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                resolve(data);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
