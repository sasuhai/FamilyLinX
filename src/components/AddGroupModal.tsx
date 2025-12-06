import React, { useState } from 'react';
import { generateSlug } from '../utils/helpers';
import './EditGroupModal.css'; // Reuse the same styles

interface AddGroupModalProps {
    onClose: () => void;
    onSave: (group: { name: string; description?: string; slug: string }) => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugChanged, setSlugChanged] = useState(false);

    // Auto-generate slug from name if not manually changed
    React.useEffect(() => {
        if (!slugChanged && name) {
            setSlug(generateSlug(name));
        }
    }, [name, slugChanged]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('Please enter a group name');
            return;
        }

        setIsSubmitting(true);

        try {
            const groupData = {
                name: name.trim(),
                description: description.trim() || undefined,
                slug: slug.trim() || generateSlug(name.trim())
            };

            onSave(groupData);
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create group. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container edit-group-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>➕ Add Group</h2>
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
                                autoFocus
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
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
