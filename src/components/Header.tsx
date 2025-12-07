import React, { useState, useRef, useEffect } from 'react';
import { debounce } from '../utils/helpers';
import './Header.css';

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
    onCreateGroup: () => void;
    onBack?: () => void;
    canGoBack?: boolean;
    onNavigateHome?: () => void;
    isAdminMode: boolean;
    onToggleAdminMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    darkMode,
    onToggleDarkMode,
    searchQuery,
    onSearchChange,
    onExportData,
    onImportData,
    onCreateGroup,
    onBack,
    canGoBack = false,
    onNavigateHome,
    isAdminMode,
    onToggleAdminMode,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = debounce(onSearchChange, 300);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportData(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isMenuOpen && !(e.target as Element).closest('.header-menu')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <header className="app-header">
            <div className="container">
                <div className="header-content">
                    <div className="header-brand" onClick={onNavigateHome}>
                        <div className="brand-icon">👨‍👩‍👧‍👦</div>
                        <div>
                            <h1 className="brand-name">
                                <span className="gradient-text">FamilyLinX</span>
                            </h1>
                            <p className="brand-credit">@ designed by Idiahus</p>
                        </div>
                    </div>

                    <div className="header-search">
                        <div className="search-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search members..."
                                defaultValue={searchQuery}
                                onChange={(e) => debouncedSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="header-actions">
                        {canGoBack && onBack && (
                            <button
                                className="btn btn-secondary"
                                onClick={onBack}
                                title="Go back"
                            >
                                <span className="btn-text">Back</span>
                            </button>
                        )}

                        <label
                            className="admin-toggle"
                            title={isAdminMode ? "Admin mode enabled - can edit" : "Admin mode disabled - view only"}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                backgroundColor: isAdminMode ? 'var(--primary-500)' : 'var(--gray-200)',
                                color: isAdminMode ? 'white' : 'var(--gray-700)',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                userSelect: 'none',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isAdminMode}
                                onChange={onToggleAdminMode}
                                style={{ display: 'none' }}
                            />
                            <span>{isAdminMode ? '🔓' : '🔒'}</span>
                            <span className="btn-text">Admin</span>
                        </label>

                        <button
                            className="btn btn-primary"
                            onClick={onCreateGroup}
                            title="Create new group"
                        >
                            <span className="btn-text">New Group</span>
                        </button>

                        <button
                            className="icon-btn"
                            onClick={onToggleDarkMode}
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>

                        <div className="header-menu">
                            <button
                                className="icon-btn menu-trigger"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                title="Menu"
                            >
                                ⋮
                            </button>

                            {isMenuOpen && (
                                <div className="menu-dropdown fade-in">
                                    <button className="menu-item" onClick={onExportData}>
                                        Export Data
                                    </button>
                                    <button
                                        className="menu-item"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Import Data
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </header>
    );
};
