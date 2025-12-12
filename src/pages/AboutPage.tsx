import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';
import heroImage from '../assets/family_connections_hero.png';
import { GroupNameInputModal } from '../components/GroupNameInputModal';
import { getFamilyByRootSlug } from '../services/firebase.service';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../contexts/LanguageContext';

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();
    const { language, setLanguage, t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleStartJourney = () => {
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (groupName: string) => {
        setIsModalOpen(false);

        // Check if the group exists
        try {
            const result = await getFamilyByRootSlug(groupName);
            if (result) {
                // Group exists, navigate to it
                navigate(`/${groupName}`);
            } else {
                // Group doesn't exist, show error modal
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Error checking group:', error);
            // On error, also show the error modal
            setShowErrorModal(true);
        }
    };

    const handleModalCancel = () => {
        setIsModalOpen(false);
    };

    const handleWatchDemo = () => {
        navigate('/alifamily', { state: { adminMode: false } });
    };

    return (
        <div className="about-page" data-theme="dark">
            {/* Language Selector - Fixed Position */}
            <div style={{
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                zIndex: 1000,
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: 'rgba(30, 30, 40, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                padding: '0.5rem'
            }}>
                <button
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: language === 'en' ? 'rgba(99, 102, 241, 0.8)' : 'transparent',
                        color: language === 'en' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => setLanguage('en' as Language)}
                >
                    EN
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)', alignSelf: 'center' }}>|</span>
                <button
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: language === 'ms' ? 'rgba(99, 102, 241, 0.8)' : 'transparent',
                        color: language === 'ms' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => setLanguage('ms' as Language)}
                >
                    BM
                </button>
            </div>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content slide-in-left">
                        <div className="badge">New Release v2.0</div>
                        <h1 className="hero-title">
                            {t('about.hero.title').split(' ').slice(0, 2).join(' ')} <br />
                            <span className="gradient-text">{t('about.hero.title').split(' ').slice(2).join(' ')}</span>
                        </h1>
                        <p className="hero-subtitle">
                            {t('about.hero.subtitle')}
                        </p>
                        <div className="hero-actions">
                            <button onClick={handleStartJourney} className="btn btn-primary btn-lg">
                                {t('about.hero.startJourney')}
                            </button>
                            <button onClick={handleWatchDemo} className="btn btn-ghost btn-lg">
                                {t('about.hero.watchDemo')}
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual slide-in-right">
                        <div className="visual-card-stack">
                            <div className="visual-card glass">
                                <img src={heroImage} alt="Family Connections" className="hero-image" />
                                <div className="card-overlay">
                                    <div className="stat-badge">
                                        <span className="stat-value">5,000+</span>
                                        <span className="stat-label">Families Connected</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hero-glow"></div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center fade-in">
                        <h2 className="section-title">{t('about.features.title')}</h2>
                        <p className="section-subtitle">{t('about.features.visualDesc')}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-lg mt-xl">
                        {/* Feature 1 */}
                        <div className="feature-card card glass scale-in" style={{ animationDelay: '0.1s' }}>
                            <div className="feature-icon">📸</div>
                            <h3>Smart Photo & Video Album</h3>
                            <p>
                                automatically organize your family's precious moments with AI-powered facial recognition
                                and chronological sorting. Experience your memories in stunning 4K clarity.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="feature-card card glass scale-in" style={{ animationDelay: '0.2s' }}>
                            <div className="feature-icon">🌳</div>
                            <h3>Interactive Family Tree</h3>
                            <p>
                                Visualize your ancestry like never before. Our dynamic tree view allows you to
                                navigate through generations seamlessly with fluid animations.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="feature-card card glass scale-in" style={{ animationDelay: '0.3s' }}>
                            <div className="feature-icon">🔒</div>
                            <h3>Military-Grade Privacy</h3>
                            <p>
                                Your family details are private. We use end-to-end encryption to ensure
                                your data stays within your family circle. Secure and safe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Widget Section */}
            <section className="widget-section gradient-bg">
                <div className="container flex items-center justify-between">
                    <div className="widget-content">
                        <h2>Experience the Flow</h2>
                        <p>
                            Seamlessly move between generations. Our intuitive interface makes
                            navigating complex family histories as easy as scrolling through your timeline.
                        </p>
                        <ul className="benefits-list">
                            <li>✨ Real-time Collaboration</li>
                            <li>📱 Cross-Platform Support</li>
                            <li>🚀 Instant Cloud Sync</li>
                        </ul>
                    </div>
                    <div className="widget-visual">
                        {/* CSS-only Widget simulating activity */}
                        <div className="activity-widget glass">
                            <div className="widget-header">
                                <div className="dot red"></div>
                                <div className="dot yellow"></div>
                                <div className="dot green"></div>
                            </div>
                            <div className="widget-body">
                                <div className="activity-item">
                                    <div className="avatar">👵</div>
                                    <div className="text">Grandma added a new photo</div>
                                </div>
                                <div className="activity-item">
                                    <div className="avatar">👶</div>
                                    <div className="text">Baby Leo's first steps uploaded</div>
                                </div>
                                <div className="activity-item">
                                    <div className="avatar">🎉</div>
                                    <div className="text">Family Reunion Event created</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="tech-section">
                <div className="container text-center">
                    <p className="tech-label">POWERED BY MODERN TECHNOLOGY</p>
                    <div className="tech-logos flex justify-center gap-xl">
                        <span className="tech-item">React 18</span>
                        <span className="tech-item">TypeScript</span>
                        <span className="tech-item">Firebase</span>
                        <span className="tech-item">Vite</span>
                        <span className="tech-item">AI Integration</span>
                    </div>
                </div>
            </section>

            <footer className="about-footer">
                <div className="container text-center">
                    <p>© 2025 FamilyLinX. Preserving Memories.</p>
                </div>
            </footer>

            {/* Group Name Input Modal */}
            <GroupNameInputModal
                isOpen={isModalOpen}
                onSubmit={handleModalSubmit}
                onCancel={handleModalCancel}
            />

            {/* Error Modal for Invalid Group Name */}
            {showErrorModal && (
                <div className="group-input-modal-overlay" onClick={() => setShowErrorModal(false)}>
                    <div className="group-input-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="group-input-header">
                            {/* No icon here - per user request */}
                            <h2 className="group-input-title" style={{ marginTop: 0 }}>{t('about.error.title')}</h2>
                            <p className="group-input-subtitle">{t('about.error.subtitle')}</p>
                        </div>

                        <div className="group-input-body">
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.75rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{
                                    fontSize: '0.9375rem',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    margin: 0,
                                    textAlign: 'center'
                                }}>
                                    💡 {t('about.error.hint')}
                                </p>
                            </div>
                        </div>

                        <div className="group-input-footer">
                            <button
                                className="group-input-button submit"
                                onClick={() => setShowErrorModal(false)}
                                style={{ flex: 'none', width: '100%' }}
                            >
                                <span>{t('about.error.tryAgain')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
