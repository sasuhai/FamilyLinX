import React, { useState } from 'react';
import { generateSlug } from '../utils/helpers';
import type { Group } from '../types';
import './EditGroupModal.css';

interface AddGroupModalProps {
    onClose: () => void;
    onSave: (group: { name: string; description?: string; slug: string }) => void;
    existingGroups: Record<string, Group>;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ onClose, onSave, existingGroups }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugChanged, setSlugChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Auto-generate slug from name if not manually changed
    React.useEffect(() => {
        if (!slugChanged && name) {
            setSlug(generateSlug(name));
        }
    }, [name, slugChanged]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Please enter a group name.');
            return;
        }

        const finalSlug = slug.trim() || generateSlug(name.trim());

        // Check if slug already exists in the same root parent
        const slugExists = Object.values(existingGroups).some(g => g.slug === finalSlug);
        if (slugExists) {
            setErrorMessage(`The short group name "${finalSlug}" is already in use.\n\nPlease manually edit the "Short Group Name" field below to make it unique.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const groupData = {
                name: name.trim(),
                description: description.trim() || undefined,
                slug: finalSlug
            };

            onSave(groupData);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            setErrorMessage('Failed to create group. Please try again.');
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
                            <div className="modal-icon-box icon-purple">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className="modal-titles">
                                <h2 className="modal-title-dark">Add New Group</h2>
                                <p className="modal-subtitle-dark">Create a new sub-group in your family tree</p>
                            </div>
                        </div>
                        <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="modal-form-scrollable">
                        <div className="modal-body-dark">
                            <div className="form-group-dark">
                                <label htmlFor="group-name" className="form-label-dark">
                                    Group Name <span className="form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="group-name"
                                    className="form-input-dark"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter group name"
                                    required
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="group-description" className="form-label-dark">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="group-description"
                                    className="form-textarea-dark"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter a description for this group"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                                <span className="form-hint-dark">
                                    Add details about this group, such as location or special notes.
                                </span>
                            </div>

                            <div className="form-group-dark">
                                <label htmlFor="group-slug" className="form-label-dark">
                                    Short Group Name
                                </label>
                                <input
                                    type="text"
                                    id="group-slug"
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
                                    URL-friendly name. Only lowercase letters, numbers, and hyphens allowed.
                                </span>
                                {slug && (
                                    <div className="url-preview-dark">
                                        <span>URL Path:</span>
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
                                {isSubmitting ? 'Creating...' : 'Create Group'}
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
