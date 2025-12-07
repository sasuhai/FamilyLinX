import React, { useState, useEffect } from 'react';
import type { Group } from '../types';
import { generateSlug } from '../utils/helpers';
import './EditGroupModal.css';

interface EditGroupModalProps {
    group: Group;
    onClose: () => void;
    onSave: (updates: { name?: string; description?: string; slug?: string }) => void;
    onDelete: (groupId: string) => void;
    existingGroups: Record<string, Group>;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, onClose, onSave, onDelete, existingGroups }) => {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [slug, setSlug] = useState(group.slug || generateSlug(group.name));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugChanged, setSlugChanged] = useState(!!group.slug);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!slugChanged && !group.slug) {
            setSlug(generateSlug(name));
        }
    }, [name, slugChanged, group.slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Please enter a group name.');
            return;
        }

        const finalSlug = slug.trim() || generateSlug(name.trim());

        const slugExists = Object.values(existingGroups).some(g =>
            g.id !== group.id && g.slug === finalSlug
        );
        if (slugExists) {
            setErrorMessage(`The short group name "${finalSlug}" is already in use by another group.\n\nPlease manually edit the "Short Group Name" field below to make it unique.`);
            return;
        }

        setIsSubmitting(true);

        try {
            const updates = {
                name: name.trim(),
                description: description.trim() || undefined,
                slug: finalSlug
            };

            onSave(updates);
            onClose();
        } catch (error) {
            console.error('Error saving group:', error);
            setErrorMessage('Failed to save changes. Please try again.');
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
                            <div className="modal-icon-box icon-orange">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </div>
                            <div className="modal-titles">
                                <h2 className="modal-title-dark">Edit Group</h2>
                                <p className="modal-subtitle-dark">Modify group details or delete the group</p>
                            </div>
                        </div>
                        <button className="modal-close-dark" onClick={onClose} aria-label="Close">
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body-dark">
                            {/* Stats */}
                            <div className="stats-row-dark">
                                <div className="stat-item-dark">
                                    <div className="stat-value-dark">{group.members.length}</div>
                                    <div className="stat-label-dark">Members</div>
                                </div>
                            </div>

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

                            {/* Danger Zone */}
                            <div className="danger-section-dark">
                                <h4>⚠️ Danger Zone</h4>
                                <p>Permanently delete this group and all its {group.members.length} members.</p>
                                <button
                                    type="button"
                                    className="btn-dark btn-dark-danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isSubmitting}
                                >
                                    Delete Group
                                </button>
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
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="confirm-backdrop-dark" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="confirm-modal-dark" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon-dark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 className="confirm-title-dark">Delete Group?</h3>
                        <p className="confirm-text-dark">
                            Are you sure you want to delete <strong>"{group.name}"</strong>?
                        </p>
                        <p className="confirm-text-dark" style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                            ⚠️ This will permanently delete all {group.members.length} member{group.members.length !== 1 ? 's' : ''} and their photos!
                        </p>
                        <div className="confirm-actions-dark">
                            <button
                                type="button"
                                className="btn-dark btn-dark-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-dark btn-dark-danger"
                                onClick={() => {
                                    onDelete(group.id);
                                    onClose();
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
