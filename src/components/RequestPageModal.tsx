import React, { useState } from 'react';
import './RequestPageModal.css';

interface RequestPageModalProps {
    onClose: () => void;
    onSubmit: (request: { name: string; description: string; email: string }) => void;
}

export const RequestPageModal: React.FC<RequestPageModalProps> = ({ onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; description?: string; email?: string }>({});

    const validateForm = () => {
        const newErrors: { name?: string; description?: string; email?: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Page name is required';
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit({ name, description, email });
            onClose();
        }
    };

    return (
        <div className="modal-backdrop fade-in" onClick={onClose}>
            <div className="modal-container request-page-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">➕</div>
                    <div>
                        <h2 className="modal-title">Request New Page</h2>
                        <p className="modal-subtitle">Submit a request to create a new family page</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="pageName" className="form-label">
                            Page Name <span className="required">*</span>
                        </label>
                        <input
                            id="pageName"
                            type="text"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="e.g., Smith Family, Johnson Reunion"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            Description <span className="required">*</span>
                        </label>
                        <textarea
                            id="description"
                            className={`form-textarea ${errors.description ? 'error' : ''}`}
                            placeholder="Describe the purpose of this page and what content it should include..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {errors.description && <span className="error-message">{errors.description}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Your Email <span className="required">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                        <span className="form-hint">We'll contact you when your page is ready</span>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
