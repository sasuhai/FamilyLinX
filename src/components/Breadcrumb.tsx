import React from 'react';
import type { BreadcrumbItem } from '../types';
import './Breadcrumb.css';

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    onNavigate: (id: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
    if (items.length === 0) return null;

    return (
        <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                {items.map((item, index) => (
                    <li key={item.id} className="breadcrumb-item">
                        {index < items.length - 1 ? (
                            <>
                                <button
                                    className="breadcrumb-link"
                                    onClick={() => onNavigate(item.id)}
                                >
                                    {item.name}
                                </button>
                                <span className="breadcrumb-separator">›</span>
                            </>
                        ) : (
                            <span className="breadcrumb-current">{item.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};
