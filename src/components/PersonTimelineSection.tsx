import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { Group, Person } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import './PersonTimelineSection.css';

interface PersonTimelineSectionProps {
    groups: Record<string, Group>;
    searchQuery?: string;
}

export const PersonTimelineSection: React.FC<PersonTimelineSectionProps> = ({ groups, searchQuery = '' }) => {
    const { t } = useLanguage();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Get all people with more than 2 photos from all groups (recursively)
    const peopleWithTimelines = useMemo(() => {
        const allPeople: Person[] = [];

        const extractPeople = (groupId: string, visited = new Set<string>()) => {
            if (visited.has(groupId)) return;
            visited.add(groupId);

            const group = groups[groupId];
            if (!group) return;

            // Add people from this group
            group.members.forEach(member => {
                allPeople.push(member);

                // Recursively get people from sub-groups
                if (member.subGroupId) {
                    extractPeople(member.subGroupId, visited);
                }
            });
        };

        // Start from all root groups
        Object.keys(groups).forEach(groupId => {
            const group = groups[groupId];
            if (!group.parentGroupId) {
                extractPeople(groupId);
            }
        });

        // Filter people with more than 2 photos
        let filteredPeople = allPeople
            .filter(person => person.photos.length > 2)
            .map(person => ({
                ...person,
                photos: [...person.photos].sort((a, b) => a.yearTaken - b.yearTaken) // Ascending order
            }));

        // Apply search filter if search query exists
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredPeople = filteredPeople.filter(person =>
                person.name.toLowerCase().includes(query)
            );
        }

        // Shuffle the array for random order
        const shuffled = [...filteredPeople];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }, [groups, searchQuery]);

    // Check scroll position to enable/disable arrows
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
    };

    // Update scroll position on mount and when timelines change
    useEffect(() => {
        checkScrollPosition();

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollPosition);
            return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
        }
    }, [peopleWithTimelines]);

    // Scroll handlers
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -720, // Scroll by ~3 timeline widths
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: 720, // Scroll by ~3 timeline widths
                behavior: 'smooth'
            });
        }
    };

    if (peopleWithTimelines.length === 0) {
        return null; // Don't show section if no people meet criteria
    }

    return (
        <section className="timeline-section">
            <div className="section-header">
                <span className="section-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M2 12h20" />
                    </svg>
                    {t('timeline.badge')}
                </span>
                <h2 className="section-title">{t('timeline.title')}</h2>
            </div>

            <div className="timeline-container">
                {/* Left Navigation Arrow */}
                <button
                    className={`timeline-nav-btn timeline-nav-left ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={scrollLeft}
                    disabled={!canScrollLeft}
                    aria-label="Scroll left"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                {/* Right Navigation Arrow */}
                <button
                    className={`timeline-nav-btn timeline-nav-right ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={scrollRight}
                    disabled={!canScrollRight}
                    aria-label="Scroll right"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>

                <div className="timeline-scroll-container" ref={scrollContainerRef}>
                    <div className="timeline-grid">
                        {peopleWithTimelines.map(person => (
                            <div key={person.id} className="person-timeline">
                                <div className="timeline-header">
                                    <h3 className="timeline-person-name">{person.name}</h3>
                                    <span className="timeline-photo-count">
                                        {person.photos.length} {t('timeline.photos')}
                                    </span>
                                </div>

                                <div className="timeline-track">
                                    {person.photos.map((photo, index) => (
                                        <div key={photo.id} className="timeline-item">
                                            <div className="timeline-photo-wrapper">
                                                <img
                                                    src={photo.url}
                                                    alt={`${person.name} - ${photo.yearTaken}`}
                                                    className="timeline-photo"
                                                    loading="lazy"
                                                />
                                                <div className="timeline-photo-overlay">
                                                    <span className="timeline-year">{photo.yearTaken}</span>
                                                </div>
                                            </div>

                                            {/* Connector line to next photo */}
                                            {index < person.photos.length - 1 && (
                                                <div className="timeline-connector" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
