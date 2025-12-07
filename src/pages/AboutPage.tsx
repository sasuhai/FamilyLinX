import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';
import heroImage from '../assets/family_connections_hero.png'; // We will need to move the image here

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="about-page" data-theme="dark">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content slide-in-left">
                        <div className="badge">New Release v2.0</div>
                        <h1 className="hero-title">
                            Preserve Your <br />
                            <span className="gradient-text">Legacy Forever.</span>
                        </h1>
                        <p className="hero-subtitle">
                            FamilyLinX is the modern way to connect generations, share memories,
                            and build your digital family heritage with stunning photo and video experiences.
                        </p>
                        <div className="hero-actions">
                            <button onClick={() => navigate('/')} className="btn btn-primary btn-lg">
                                Start Your Journey
                            </button>
                            <button className="btn btn-ghost btn-lg">
                                Watch Demo
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
                        <h2 className="section-title">Why FamilyLinX?</h2>
                        <p className="section-subtitle">Everything you need to keep your family close.</p>
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
        </div>
    );
};
