import React, { useMemo, useEffect, useRef, useState } from 'react';
import type { Group, Person } from '../types';
import './HeroSection.css';

interface HeroSectionProps {
    group: Group;
    allGroups: Record<string, Group>;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ group, allGroups, searchQuery: parentSearchQuery, onSearchChange }) => {
    const marqueeRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const scrollPositionRef = useRef<number>(0);
    const isPausedRef = useRef<boolean>(false);

    // Use parent's search query if provided, otherwise use local state
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const searchQuery = parentSearchQuery !== undefined ? parentSearchQuery : localSearchQuery;

    // Helper to update search query - calls parent if available, otherwise updates local state
    const updateSearchQuery = (query: string) => {
        if (onSearchChange) {
            onSearchChange(query);
        } else {
            setLocalSearchQuery(query);
        }
    };

    // Year filter (local only - for photos)
    const [yearFilter, setYearFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Collect all photos from the group and its sub-groups recursively
    const allPhotos = useMemo(() => {
        const photos: Array<{
            url: string;
            name: string;
            yearTaken: number;
            yearOfBirth: number;
        }> = [];

        const collectPhotos = (groupId: string) => {
            const grp = allGroups[groupId];
            if (!grp) return;

            // Add photos from members in this group
            grp.members.forEach((member: Person) => {
                member.photos.forEach((photo) => {
                    photos.push({
                        url: photo.url,
                        name: member.name,
                        yearTaken: photo.yearTaken,
                        yearOfBirth: member.yearOfBirth,
                    });
                });

                // Recursively collect from sub-groups
                if (member.subGroupId) {
                    collectPhotos(member.subGroupId);
                }
            });
        };

        collectPhotos(group.id);
        return photos;
    }, [group.id, allGroups]);

    // Get unique years for filter dropdown
    const availableYears = useMemo(() => {
        const years = [...new Set(allPhotos.map(p => p.yearTaken))].sort((a, b) => b - a);
        return years;
    }, [allPhotos]);

    // Filtered photos based on search and filters
    const filteredPhotos = useMemo(() => {
        let filtered = allPhotos;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(photo =>
                photo.name.toLowerCase().includes(query) ||
                photo.yearTaken.toString().includes(query) ||
                photo.yearOfBirth.toString().includes(query)
            );
        }

        if (yearFilter) {
            filtered = filtered.filter(photo => photo.yearTaken.toString() === yearFilter);
        }

        return filtered;
    }, [allPhotos, searchQuery, yearFilter]);

    // Photos for marquee (shuffled and duplicated)
    const marqueePhotos = useMemo(() => {
        const photos = [...filteredPhotos].sort(() => Math.random() - 0.5);
        const minPhotos = 20;
        if (photos.length === 0) return [];

        while (photos.length < minPhotos && filteredPhotos.length > 0) {
            photos.push(...filteredPhotos.sort(() => Math.random() - 0.5));
        }

        return photos.slice(0, Math.max(photos.length, minPhotos));
    }, [filteredPhotos]);

    // Calculate total members recursively
    const totalMembers = useMemo(() => {
        let count = 0;

        const countMembers = (groupId: string) => {
            const grp = allGroups[groupId];
            if (!grp) return;

            count += grp.members.length;

            grp.members.forEach((member: Person) => {
                if (member.subGroupId) {
                    countMembers(member.subGroupId);
                }
            });
        };

        countMembers(group.id);
        return count;
    }, [group.id, allGroups]);

    // Smooth infinite scroll animation
    useEffect(() => {
        if (!marqueeRef.current || marqueePhotos.length === 0) return;

        const marqueeTrack = marqueeRef.current;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isPausedRef.current && marqueeTrack) {
                scrollPositionRef.current += scrollSpeed;

                // Get the width of one set of photos (including gap)
                const firstChild = marqueeTrack.firstElementChild as HTMLElement;
                if (firstChild) {
                    const itemWidth = firstChild.offsetWidth;
                    const gap = 16; // var(--spacing-md) = 1rem = 16px
                    const singleSetWidth = (itemWidth + gap) * marqueePhotos.length;

                    // Reset position when we've scrolled one full set
                    if (scrollPositionRef.current >= singleSetWidth) {
                        scrollPositionRef.current = 0;
                    }

                    marqueeTrack.style.transform = `translateX(-${scrollPositionRef.current}px)`;
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [marqueePhotos.length]);

    // Reset scroll position when filters change
    useEffect(() => {
        scrollPositionRef.current = 0;
        if (marqueeRef.current) {
            marqueeRef.current.style.transform = 'translateX(0px)';
        }
    }, [searchQuery, yearFilter]);

    const clearFilters = () => {
        updateSearchQuery('');
        setYearFilter('');
    };

    const hasActiveFilters = searchQuery || yearFilter;

    return (
        <section className="hero-section">
            <div className="hero-container">
                <div className="hero-content">
                    <h1 className="hero-title gradient-text fade-in">
                        {group.name}
                    </h1>

                    {group.description && (
                        <p className="hero-description fade-in">
                            {group.description}
                        </p>
                    )}

                    <div className="hero-stats fade-in">
                        <div className="hero-stat-item">
                            <span className="hero-stat-value">{totalMembers}</span>
                            <span className="hero-stat-label">Family Members</span>
                        </div>
                        <div className="hero-stat-divider"></div>
                        <div className="hero-stat-item">
                            <span className="hero-stat-value">{allPhotos.length}</span>
                            <span className="hero-stat-label">Memories</span>
                        </div>
                    </div>
                </div>

                {allPhotos.length > 0 && (
                    <>
                        <div className="photo-marquee-container">
                            <div className="photo-marquee">
                                <div
                                    ref={marqueeRef}
                                    className="photo-marquee-track"
                                    onMouseEnter={() => { isPausedRef.current = true; }}
                                    onMouseLeave={() => { isPausedRef.current = false; }}
                                >
                                    {marqueePhotos.length > 0 ? (
                                        <>
                                            {/* First set */}
                                            {marqueePhotos.map((photo, index) => (
                                                <div key={`photo-1-${index}`} className="photo-marquee-item">
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.name}
                                                        loading="lazy"
                                                    />
                                                    <div className="photo-overlay">
                                                        <span className="photo-name">{photo.name}</span>
                                                        <span className="photo-year-badge">{photo.yearTaken}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Second set - for seamless loop */}
                                            {marqueePhotos.map((photo, index) => (
                                                <div key={`photo-2-${index}`} className="photo-marquee-item">
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.name}
                                                        loading="lazy"
                                                    />
                                                    <div className="photo-overlay">
                                                        <span className="photo-name">{photo.name}</span>
                                                        <span className="photo-year-badge">{photo.yearTaken}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="no-results-message">
                                            No photos match your filters
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="photo-filter-section">
                            <div className="filter-toggle-row">
                                <button
                                    className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    Search & Filter Photos
                                    {hasActiveFilters && <span className="filter-active-dot" />}
                                </button>
                                {hasActiveFilters && (
                                    <span className="filter-result-count">
                                        {filteredPhotos.length} of {allPhotos.length} photos
                                    </span>
                                )}
                            </div>

                            {showFilters && (
                                <div className="filter-controls">
                                    <div className="filter-search-box">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="m21 21-4.35-4.35" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search by name, year, or age..."
                                            value={searchQuery}
                                            onChange={(e) => updateSearchQuery(e.target.value)}
                                            className="filter-search-input"
                                        />
                                        {searchQuery && (
                                            <button
                                                className="filter-clear-btn"
                                                onClick={() => updateSearchQuery('')}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    <div className="filter-select-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <select
                                            value={yearFilter}
                                            onChange={(e) => setYearFilter(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="">All Years</option>
                                            {availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {hasActiveFilters && (
                                        <button
                                            className="filter-clear-all-btn"
                                            onClick={clearFilters}
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};
