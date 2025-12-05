import React, { useState, useEffect } from 'react';
import type { Group } from '../types';
import { generateSlug } from '../utils/helpers';
import './EditGroupModal.css';

interface EditGroupModalProps {
    group: Group;
    onClose: () => void;
    onSave: (updates: { name?: string; description?: string; slug?: string }) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, onClose, onSave }) => {
    console.log('📂 EditGroupModal opened with group:', group);
    console.log('📂 group.slug:', group.slug);

    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [slug, setSlug] = useState(group.slug || generateSlug(group.name));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugChanged, setSlugChanged] = useState(!!group.slug); // If group has slug, consider it "changed"

    // Auto-generate slug from name ONLY if user hasn't manually set it and group doesn't have a saved slug
    useEffect(() => {
        if (!slugChanged && !group.slug) {
            setSlug(generateSlug(name));
        }
    }, [name, slugChanged, group.slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('🚀 handleSubmit called');

        if (!name.trim()) {
            alert('Please enter a group name');
            return;
        }

        setIsSubmitting(true);

        try {
            const updates = {
                name: name.trim(),
                description: description.trim() || undefined,
                slug: slug.trim() || generateSlug(name.trim())
            };

            console.log('📝 Saving group updates:', updates);
            console.log('📞 Calling onSave...');

            onSave(updates);

            console.log('✅ Modal: onSave called, closing...');
            onClose();
        } catch (error) {
            console.error('Error saving group:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log('EditGroupModal rendering for group:', group.name);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container edit-group-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✏️ Edit Group</h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-section">
                        <h3>Group Information</h3>

                        <div className="form-group">
                            <label htmlFor="group-name">
                                Group Name <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="group-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter group name"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="group-description">
                                Description (Optional)
                            </label>
                            <textarea
                                id="group-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter a description for this group"
                                rows={4}
                                disabled={isSubmitting}
                            />
                            <small className="form-hint">
                                Add details about this group, such as location, time period, or special notes.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="group-slug">
                                Short Group Name
                            </label>
                            <input
                                type="text"
                                id="group-slug"
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
                            <small className="form-hint">
                                Short, URL-friendly name for this group. Only lowercase letters, numbers, and hyphens allowed.
                            </small>
                            {slug && (
                                <div className="url-preview">
                                    <strong>URL Path:</strong>
                                    <code>/{slug}</code>
                                </div>
                            )}
                            {slug !== (group.slug || generateSlug(group.name)) && (
                                <div className="url-warning">
                                    ℹ️ <strong>Note:</strong> The short name will be saved and can be used for sharing and organizing groups.
                                    URL routing based on short names will be available in a future update.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
