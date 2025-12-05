import React, { useState, useEffect } from 'react';
import type { Photo } from '../types';
import { sortPhotosByYear } from '../utils/helpers';
import './PhotoRotator.css';

interface PhotoRotatorProps {
    photos: Photo[];
    interval?: number; // milliseconds
    className?: string;
}

export const PhotoRotator: React.FC<PhotoRotatorProps> = ({
    photos,
    interval = 3000,
    className = '',
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showingLayer, setShowingLayer] = useState<'A' | 'B'>('A');
    const [layerAIndex, setLayerAIndex] = useState(0);
    const [layerBIndex, setLayerBIndex] = useState(0);

    const sortedPhotos = sortPhotosByYear(photos);

    // Preload all images
    useEffect(() => {
        sortedPhotos.forEach(photo => {
            const img = new Image();
            img.src = photo.url;
        });
    }, [sortedPhotos]);

    useEffect(() => {
        if (sortedPhotos.length <= 1) return;

        const timer = setInterval(() => {
            const nextIndex = (currentIndex + 1) % sortedPhotos.length;

            // Update the hidden layer with next photo
            if (showingLayer === 'A') {
                setLayerBIndex(nextIndex);
            } else {
                setLayerAIndex(nextIndex);
            }

            // Small delay to ensure image is loaded, then switch layers
            setTimeout(() => {
                setShowingLayer(prev => prev === 'A' ? 'B' : 'A');
                setCurrentIndex(nextIndex);
            }, 50);
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, sortedPhotos.length, interval, showingLayer]);

    const handleIndicatorClick = (index: number) => {
        if (index === currentIndex) return;

        // Update the hidden layer
        if (showingLayer === 'A') {
            setLayerBIndex(index);
        } else {
            setLayerAIndex(index);
        }

        // Switch layers
        setTimeout(() => {
            setShowingLayer(prev => prev === 'A' ? 'B' : 'A');
            setCurrentIndex(index);
        }, 50);
    };

    if (sortedPhotos.length === 0) {
        return (
            <div className={`photo-rotator-placeholder ${className}`}>
                <div className="placeholder-icon">📷</div>
                <p>No photos available</p>
            </div>
        );
    }

    const photoA = sortedPhotos[layerAIndex];
    const photoB = sortedPhotos[layerBIndex];

    return (
        <div className={`photo-rotator ${className}`}>
            {/* Layer A */}
            <div className={`photo-layer ${showingLayer === 'A' ? 'active' : 'hidden'}`}>
                <img
                    src={photoA.url}
                    alt={photoA.caption || `Photo from ${photoA.yearTaken}`}
                    className="photo-image"
                />
                <div className="photo-overlay">
                    <div className="photo-year">{photoA.yearTaken}</div>
                    {photoA.caption && (
                        <div className="photo-caption">{photoA.caption}</div>
                    )}
                </div>
            </div>

            {/* Layer B */}
            <div className={`photo-layer ${showingLayer === 'B' ? 'active' : 'hidden'}`}>
                <img
                    src={photoB.url}
                    alt={photoB.caption || `Photo from ${photoB.yearTaken}`}
                    className="photo-image"
                />
                <div className="photo-overlay">
                    <div className="photo-year">{photoB.yearTaken}</div>
                    {photoB.caption && (
                        <div className="photo-caption">{photoB.caption}</div>
                    )}
                </div>
            </div>

            {sortedPhotos.length > 1 && (
                <div className="photo-indicators">
                    {sortedPhotos.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => handleIndicatorClick(index)}
                            aria-label={`Go to photo ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
