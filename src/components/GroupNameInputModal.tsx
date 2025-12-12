import React, { useState } from 'react';
import './GroupNameInputModal.css';
import { useLanguage } from '../contexts/LanguageContext';

interface GroupNameInputModalProps {
    isOpen: boolean;
    onSubmit: (groupName: string) => void;
    onCancel: () => void;
}

export const GroupNameInputModal: React.FC<GroupNameInputModalProps> = ({
    isOpen,
    onSubmit,
    onCancel
}) => {
    const [groupName, setGroupName] = useState('');
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (groupName.trim()) {
            onSubmit(groupName.trim());
            setGroupName('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && groupName.trim()) {
            handleSubmit();
        }
    };

    return (
        <div className="group-input-modal-overlay" onClick={onCancel}>
            <div className="group-input-modal" onClick={(e) => e.stopPropagation()}>
                <div className="group-input-header">
                    {/* Removed rocket icon per user request */}
                    <h2 className="group-input-title" style={{ marginTop: 0 }}>{t('about.modal.title')}</h2>
                    <p className="group-input-subtitle">{t('about.modal.subtitle')}</p>
                </div>

                <div className="group-input-body">
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t('about.modal.placeholder')}
                            className="group-name-input"
                            autoFocus
                        />
                        <div className="input-underline"></div>
                    </div>
                    <p className="input-hint">
                        {t('about.modal.hint')}
                    </p>
                </div>

                <div className="group-input-footer">
                    <button
                        className="group-input-button cancel"
                        onClick={onCancel}
                    >
                        {t('about.modal.cancel')}
                    </button>
                    <button
                        className={`group-input-button submit ${!groupName.trim() ? 'disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={!groupName.trim()}
                    >
                        <span>{t('about.modal.continue')}</span>
                        <span className="button-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
