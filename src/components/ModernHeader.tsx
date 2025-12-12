import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../contexts/LanguageContext';
import './ModernHeader.css';

interface ModernHeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onNavigateHome?: () => void;
    familyName: string;
    isAdminMode: boolean;
    onToggleAdminMode: () => void;
    onCreateNewPage: () => void;
    onManageAlbums: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
    darkMode,
    onToggleDarkMode,
    onNavigateHome,
    familyName,
    isAdminMode,
    onToggleAdminMode,
    onCreateNewPage,
    onManageAlbums,
}) => {
    const navigate = useNavigate();
    const { language, setLanguage, t } = useLanguage();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Close settings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCalendarClick = () => {
        // Get the current root slug from the URL
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const rootSlug = pathParts[0] || 'otai';
        navigate(`/${rootSlug}/calendar`);
        setIsMobileMenuOpen(false);
    };

    const handleAlbumsClick = () => {
        // Get the current root slug from the URL
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const rootSlug = pathParts[0] || 'otai';
        navigate(`/${rootSlug}/albums`);
        setIsMobileMenuOpen(false);
    };

    const handleAdminClick = () => {
        navigate('/admin');
        setIsSettingsOpen(false);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="modern-header">
            <div className="modern-header-container">
                {/* Logo/Brand */}
                <div className="modern-header-brand" onClick={onNavigateHome}>
                    <div className="brand-logo">👨‍👩‍👧‍👦</div>
                    <div className="brand-info">
                        <h1 className="brand-title">FamilyLinX</h1>
                        <p className="brand-subtitle">@ designed by Idiahus</p>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="modern-header-nav">
                    <button className="nav-item" onClick={handleCalendarClick}>
                        {t('header.calendar')}
                    </button>
                    <button className="nav-item" onClick={handleAlbumsClick}>
                        {t('header.albums')}
                    </button>
                    <button className="nav-item" onClick={() => { navigate('/about'); setIsMobileMenuOpen(false); }}>
                        {t('header.about')}
                    </button>

                    {/* Settings Dropdown */}
                    <div className="nav-dropdown" ref={settingsRef}>
                        <button
                            className="nav-item"
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        >
                            {t('header.settings')}
                            <span className={`dropdown-arrow ${isSettingsOpen ? 'open' : ''}`}>▼</span>
                        </button>

                        {isSettingsOpen && (
                            <div className="dropdown-menu fade-in">
                                <button className="dropdown-item" onClick={onCreateNewPage}>
                                    {t('header.createNewPage')}
                                </button>
                                <button className="dropdown-item" onClick={handleAdminClick}>
                                    {t('header.adminDashboard')}
                                </button>
                                <button className="dropdown-item" onClick={onManageAlbums}>
                                    {t('header.editAlbums')}
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Right Actions */}
                <div className="modern-header-actions">
                    {/* Language Selector */}
                    <div className="language-selector">
                        <button
                            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                            onClick={() => setLanguage('en' as Language)}
                            title="English"
                        >
                            EN
                        </button>
                        <span className="lang-divider">|</span>
                        <button
                            className={`lang-btn ${language === 'ms' ? 'active' : ''}`}
                            onClick={() => setLanguage('ms' as Language)}
                            title="Bahasa Malaysia"
                        >
                            BM
                        </button>
                    </div>

                    {/* Group Title */}
                    {familyName && (
                        <div className="group-title-badge">
                            {familyName}
                        </div>
                    )}

                    {/* Admin Toggle */}
                    <button
                        className={`admin-toggle-btn ${isAdminMode ? 'active' : ''}`}
                        onClick={onToggleAdminMode}
                        title={isAdminMode ? 'Admin mode enabled' : 'Admin mode disabled'}
                    >
                        <span className="toggle-icon">{isAdminMode ? '🔓' : '🔒'}</span>
                        <span className="toggle-text">{t('header.admin')}</span>
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        className="icon-btn"
                        onClick={onToggleDarkMode}
                        title={darkMode ? 'Light mode' : 'Dark mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="hamburger-icon">
                            {isMobileMenuOpen ? '✕' : '☰'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="mobile-menu fade-in">
                    <button className="mobile-menu-item" onClick={handleCalendarClick}>
                        {t('header.calendar')}
                    </button>
                    <button className="mobile-menu-item" onClick={handleAlbumsClick}>
                        {t('header.albums')}
                    </button>
                    <button className="mobile-menu-item" onClick={() => { navigate('/about'); setIsMobileMenuOpen(false); }}>
                        {t('header.about')}
                    </button>
                    <div className="mobile-menu-divider"></div>
                    <button className="mobile-menu-item" onClick={onCreateNewPage}>
                        {t('header.createNewPage')}
                    </button>
                    <button className="mobile-menu-item" onClick={handleAdminClick}>
                        {t('header.adminDashboard')}
                    </button>
                    <button className="mobile-menu-item" onClick={onManageAlbums}>
                        {t('header.editAlbums')}
                    </button>
                </div>
            )}
        </header>
    );
};
