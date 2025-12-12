/**
 * Utility functions for the application
 */

export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatYear = (year: number): string => {
    return year.toString();
};

export const calculateAge = (yearOfBirth: number, yearOfDeath?: number): number => {
    const endYear = yearOfDeath || new Date().getFullYear();
    return endYear - yearOfBirth;
};

export const getAgeDisplay = (yearOfBirth: number, isDeceased?: boolean, yearOfDeath?: number): string => {
    // Return empty string if birth year is 0 (unknown)
    if (yearOfBirth === 0) {
        return '';
    }

    const age = calculateAge(yearOfBirth, yearOfDeath);
    if (isDeceased && yearOfDeath) {
        return `${age} years (${yearOfBirth} - ${yearOfDeath})`;
    }
    return `${age} years`;
};

export const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const sortPhotosByYear = <T extends { yearTaken: number }>(photos: T[]): T[] => {
    return [...photos].sort((a, b) => a.yearTaken - b.yearTaken);
};

export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: number;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait) as unknown as number;
    };
};
