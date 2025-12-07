import React, { useState } from 'react';
import { generateSlug } from '../utils/helpers';
import './EditGroupModal.css';

interface CreatePageModalProps {
    onClose: () => void;
    onSave: (page: { name: string; description?: string; slug: string }) => void;
    existingSlugs: string[];
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({ onClose, onSave, existingSlugs }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugChanged, setSlugChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    React.useEffect(() => {
        if (!slugChanged && name) {
            setSlug(generateSlug(name));
        }
    }, [name, slugChanged]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Please enter a page name.');
            return;
        }

        const finalSlug = slug.trim() || generateSlug(name.trim());

        const slugExists = existingSlugs.includes(finalSlug);
        if (slugExists) {
            setErrorMessage(`The short name "${finalSlug}" is already in use.\n\nPlease manually edit the "Short Name" field below to make it unique.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const pageData = {
                name: name.trim(),
                description: description.trim() || undefined,
                slug: finalSlug
            };

            onSave(pageData);
            onClose();
        } catch (error) {
            console.error('Error creating page:', error);
            setErrorMessage('Failed to create page. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop-dark" onClick={onClose}>
                <div className="modal-container-dark modal-md" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="modal-header-dark">
                        <div className="modal-header-content">
                            <div className="modal-icon-box">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="modal-titles">
                                <h2 className="modal-title-dark">Create New Page</h2>
                                <p className="modal-subtitle-dark">Create a new family page to organize your tree</p>
                            </div>
                        </div>
                        <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body-dark">
                            <div className="form-group-dark">
                                <label htmlFor="page-name" className="form-label-dark">
                                    Page Name <span className="form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="page-name"
                                    className="form-input-dark"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Smith Family, Johnson Reunion"
                                    required
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="page-description" className="form-label-dark">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="page-description"
                                    className="form-textarea-dark"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter a description for this page"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                                <span className="form-hint-dark">
                                    Add details about this family page, such as location or special notes.
                                </span>
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="page-slug" className="form-label-dark">
                                    Short Name <span className="form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="page-slug"
                                    className="form-input-dark"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlug(e.target.value);
                                        setSlugChanged(true);
                                    }}
                                    placeholder="url-friendly-name"
                                    disabled={isSubmitting}
                                    pattern="[a-z0-9\-]+"
                                    title="Only lowercase letters, numbers, and hyphens"
                                />
                                <span className="form-hint-dark">
                                    URL-friendly name. Only lowercase letters, numbers, and hyphens. Must be unique.
                                </span>
                                {slug && (
                                    <div className="url-preview-dark">
                                        <span>URL:</span>
                                        <code>/{slug}</code>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer-dark">
                            <button
                                type="button"
                                className="btn-dark btn-dark-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-dark btn-dark-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Page'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Error Modal */}
            {errorMessage && (
                <div className="confirm-backdrop-dark" onClick={() => setErrorMessage(null)}>
                    <div className="confirm-modal-dark" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon-dark warning">⚠️</div>
                        <h3 className="confirm-title-dark">Validation Error</h3>
                        <p className="confirm-text-dark" style={{ whiteSpace: 'pre-line' }}>
                            {errorMessage}
                        </p>
                        <div className="confirm-actions-dark">
                            <button
                                type="button"
                                className="btn-dark btn-dark-primary"
                                onClick={() => setErrorMessage(null)}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
