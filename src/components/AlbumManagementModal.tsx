import React, { useState } from 'react';
import './AlbumManagementModal.css';

export interface Album {
    id: string;
    title: string;
    description: string;
    url: string;
    type: 'photo' | 'video';
    albumDate?: string; // Format: "YYYY-MM" (e.g., "2024-06")
    createdAt: number;
}

interface AlbumManagementModalProps {
    onClose: () => void;
    albums: Album[];
    onAddAlbum: (album: Omit<Album, 'id' | 'createdAt'>) => void;
    onUpdateAlbum: (id: string, album: Partial<Album>) => void;
    onDeleteAlbum: (id: string) => void;
}

export const AlbumManagementModal: React.FC<AlbumManagementModalProps> = ({
    onClose,
    albums,
    onAddAlbum,
    onUpdateAlbum,
    onDeleteAlbum,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        type: 'photo' as 'photo' | 'video',
        albumDate: '',
    });
    const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

    const resetForm = () => {
        setFormData({ title: '', description: '', url: '', type: 'photo', albumDate: '' });
        setErrors({});
        setIsAdding(false);
        setEditingId(null);
    };

    const validateForm = () => {
        const newErrors: { title?: string; url?: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.url.trim()) {
            newErrors.url = 'URL is required';
        } else if (!/^https?:\/\/.+/.test(formData.url)) {
            newErrors.url = 'Please enter a valid URL (starting with http:// or https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            if (editingId) {
                onUpdateAlbum(editingId, formData);
            } else {
                onAddAlbum(formData);
            }
            resetForm();
        }
    };

    const handleEdit = (album: Album) => {
        setFormData({
            title: album.title,
            description: album.description,
            url: album.url,
            type: album.type,
            albumDate: album.albumDate || '',
        });
        setEditingId(album.id);
        setIsAdding(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) {
            onDeleteAlbum(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmId(null);
    };

    const albumToDelete = deleteConfirmId ? albums.find(a => a.id === deleteConfirmId) : null;

    return (
        <>
            <div className="album-modal-backdrop" onClick={onClose}>
                <div className="album-modal-container" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="album-modal-header">
                        <div className="album-modal-header-content">
                            <div className="album-modal-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="m21 15-5-5L5 21" />
                                </svg>
                            </div>
                            <div className="album-modal-titles">
                                <h2 className="album-modal-title">Manage Albums</h2>
                                <p className="album-modal-subtitle">Add, edit, or remove video and photo album links</p>
                            </div>
                        </div>
                        <button className="album-modal-close" onClick={onClose} aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="album-modal-body">
                        {/* Add/Edit Form */}
                        {isAdding ? (
                            <form className="album-form" onSubmit={handleSubmit}>
                                <div className="album-form-header">
                                    <h3 className="album-form-title">
                                        {editingId ? '✏️ Edit Album' : '➕ Add New Album'}
                                    </h3>
                                </div>

                                <div className="album-form-grid">
                                    <div className="album-form-group album-form-group-title">
                                        <label htmlFor="albumTitle" className="album-form-label">
                                            Title <span className="album-form-required">*</span>
                                        </label>
                                        <input
                                            id="albumTitle"
                                            type="text"
                                            className={`album-form-input ${errors.title ? 'has-error' : ''}`}
                                            placeholder="e.g., Summer Vacation 2024"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                        {errors.title && <span className="album-form-error">{errors.title}</span>}
                                    </div>

                                    <div className="album-form-group album-form-group-type">
                                        <label htmlFor="albumType" className="album-form-label">Type</label>
                                        <select
                                            id="albumType"
                                            className="album-form-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'photo' | 'video' })}
                                        >
                                            <option value="photo">📸 Photo Album</option>
                                            <option value="video">🎥 Video</option>
                                        </select>
                                    </div>

                                    <div className="album-form-group album-form-group-date">
                                        <label htmlFor="albumDate" className="album-form-label">Album Date</label>
                                        <input
                                            id="albumDate"
                                            type="month"
                                            className="album-form-input"
                                            value={formData.albumDate}
                                            onChange={(e) => setFormData({ ...formData, albumDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="album-form-group">
                                    <label htmlFor="albumDescription" className="album-form-label">
                                        Description
                                    </label>
                                    <textarea
                                        id="albumDescription"
                                        className="album-form-textarea"
                                        placeholder="Brief description of the album..."
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="album-form-group">
                                    <label htmlFor="albumUrl" className="album-form-label">
                                        URL <span className="album-form-required">*</span>
                                    </label>
                                    <input
                                        id="albumUrl"
                                        type="url"
                                        className={`album-form-input ${errors.url ? 'has-error' : ''}`}
                                        placeholder="https://photos.google.com/... or https://youtube.com/..."
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    />
                                    {errors.url && <span className="album-form-error">{errors.url}</span>}
                                    <span className="album-form-hint">
                                        Supports YouTube, Google Photos, OneDrive, and more
                                    </span>
                                </div>

                                <div className="album-form-actions">
                                    <button type="button" className="album-btn album-btn-secondary" onClick={resetForm}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="album-btn album-btn-primary">
                                        {editingId ? 'Update Album' : 'Add Album'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button className="album-add-btn" onClick={() => setIsAdding(true)}>
                                <span className="album-add-btn-icon">➕</span>
                                <span className="album-add-btn-text">Add New Album</span>
                            </button>
                        )}

                        {/* Albums List */}
                        {albums.length > 0 && (
                            <div className="album-list-section">
                                <h3 className="album-list-title">
                                    Existing Albums
                                    <span className="album-list-count">{albums.length}</span>
                                </h3>
                                <div className="album-list-grid">
                                    {albums.map((album) => (
                                        <div key={album.id} className={`album-list-card ${album.type}`}>
                                            <div className="album-list-card-header">
                                                <span className="album-list-card-icon">
                                                    {album.type === 'photo' ? '📸' : '🎥'}
                                                </span>
                                                <div className="album-list-card-info">
                                                    <h4 className="album-list-card-title">{album.title}</h4>
                                                    {album.albumDate && (
                                                        <span className="album-list-card-date">
                                                            {new Date(album.albumDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {album.description && (
                                                <p className="album-list-card-desc">{album.description}</p>
                                            )}
                                            <div className="album-list-card-footer">
                                                <a
                                                    href={album.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="album-list-card-link"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                        <polyline points="15 3 21 3 21 9" />
                                                        <line x1="10" y1="14" x2="21" y2="3" />
                                                    </svg>
                                                    Open
                                                </a>
                                                <div className="album-list-card-actions">
                                                    <button
                                                        className="album-action-btn edit"
                                                        onClick={() => handleEdit(album)}
                                                        title="Edit album"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="album-action-btn delete"
                                                        onClick={() => handleDeleteClick(album.id)}
                                                        title="Delete album"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            <line x1="10" y1="11" x2="10" y2="17" />
                                                            <line x1="14" y1="11" x2="14" y2="17" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {albums.length === 0 && !isAdding && (
                            <div className="album-empty-state">
                                <div className="album-empty-icon">📁</div>
                                <h3 className="album-empty-title">No Albums Yet</h3>
                                <p className="album-empty-text">Click "Add New Album" to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="album-confirm-backdrop" onClick={handleDeleteCancel}>
                    <div className="album-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="album-confirm-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 className="album-confirm-title">Delete Album?</h3>
                        <p className="album-confirm-text">
                            Are you sure you want to delete <strong>"{albumToDelete?.title}"</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="album-confirm-actions">
                            <button className="album-btn album-btn-secondary" onClick={handleDeleteCancel}>
                                Cancel
                            </button>
                            <button className="album-btn album-btn-danger" onClick={handleDeleteConfirm}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
