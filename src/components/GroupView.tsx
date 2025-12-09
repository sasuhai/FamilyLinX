import React, { useState } from 'react';
import type { Group, Person } from '../types';
import { PersonCard } from './PersonCard';
import { PersonModal } from './PersonModal';
import { EditMemberModal } from './EditMemberModal';
import { AddMemberModal } from './AddMemberModal';
import { EditGroupModal } from './EditGroupModal';
import { useLanguage } from '../contexts/LanguageContext';
import './GroupView.css';

interface GroupViewProps {
    group: Group;
    allGroups: Record<string, Group>;
    expandedGroups: Set<string>;
    breadcrumbs: Array<{ id: string; name: string }>;
    onNavigateToBreadcrumb: (id: string) => void;
    onCreateSubGroup: (personId: string) => void;
    onToggleSubGroup: (subGroupId: string) => void;
    onUpdateMember?: (personId: string, updates: Partial<Person>, newPhotos?: File[], photoYears?: number[]) => void;
    onDeleteMember?: (personId: string) => void;
    onEditGroup?: (groupId: string, updates: { name?: string; description?: string }) => void;
    onDeleteGroup?: (groupId: string) => void;
    onAddMember?: (groupId: string, person: Person, photoFiles?: File[], photoYears?: number[]) => void;
    searchQuery: string;
    depth: number;
    isAdminMode: boolean;
    showSubGroupHeaders?: boolean; // For nested groups, controlled by parent
}

export const GroupView: React.FC<GroupViewProps> = ({
    group,
    allGroups,
    expandedGroups,
    breadcrumbs,
    onNavigateToBreadcrumb,
    onCreateSubGroup,
    onToggleSubGroup,
    onUpdateMember,
    onDeleteMember,
    onEditGroup,
    onDeleteGroup,
    onAddMember,
    searchQuery,
    depth,
    isAdminMode,
    showSubGroupHeaders: propShowSubGroupHeaders,
}) => {
    const { t } = useLanguage();
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal, 0.1 = 10x zoomed out
    const [localShowSubGroupHeaders, setLocalShowSubGroupHeaders] = useState(true); // Toggle for sub-group headers

    // Use prop if provided (from parent), otherwise use local state (for main group)
    const showSubGroupHeaders = propShowSubGroupHeaders !== undefined ? propShowSubGroupHeaders : localShowSubGroupHeaders;

    // Zoom functions
    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(0.1, prev - 0.1));
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(1, prev + 0.1));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
    };

    // Find the parent person (person who has this group as their subGroupId)
    // This works whether the sub-group is nested or viewed as main page
    const parentPerson = group.parentGroupId ?
        allGroups[group.parentGroupId]?.members.find(m => m.subGroupId === group.id) :
        null;

    // Helper function to check if a group has matching members (recursively)
    const hasMatchingMembers = (groupId: string, query: string): boolean => {
        const grp = allGroups[groupId];
        if (!grp) return false;

        // Check if any member in this group matches
        const hasMatch = grp.members.some(m =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.relationship.toLowerCase().includes(query.toLowerCase())
        );

        if (hasMatch) return true;

        // Check sub-groups recursively
        return grp.members.some(m =>
            m.subGroupId && hasMatchingMembers(m.subGroupId, query)
        );
    };

    const filteredMembers = group.members
        .filter((member) => {
            // Include if member matches search
            const memberMatches =
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.relationship.toLowerCase().includes(searchQuery.toLowerCase());

            // Include if member has a sub-group with matching members
            const subGroupHasMatches = searchQuery && member.subGroupId &&
                hasMatchingMembers(member.subGroupId, searchQuery);

            return !searchQuery || memberMatches || subGroupHasMatches;
        })
        .sort((a, b) => a.yearOfBirth - b.yearOfBirth); // Sort by year of birth, oldest first

    const indentClass = depth > 0 ? `group-indent-${Math.min(depth, 3)}` : '';

    const handleEditMember = (person: Person) => {
        setSelectedPerson(null); // Close person modal
        setEditingPerson(person); // Open edit modal
    };

    const handleUpdateMember = (personId: string, updates: Partial<Person>, newPhotos?: File[], photoYears?: number[]) => {
        if (onUpdateMember) {
            onUpdateMember(personId, updates, newPhotos, photoYears);
        }
        setEditingPerson(null);
    };

    const handleAddMemberToGroup = (person: Person, photoFiles?: File[], photoYears?: number[]) => {
        if (onAddMember) {
            onAddMember(group.id, person, photoFiles, photoYears);
        }
        setIsAddingMember(false);
    };

    const handleEditGroupInfo = (updates: { name?: string; description?: string; slug?: string }) => {
        console.log('📋 GroupView handleEditGroupInfo called with:', updates);
        if (onEditGroup) {
            onEditGroup(group.id, updates);
        }
        setIsEditingGroup(false);
    };

    return (
        <div className={`group-view-container ${indentClass}`}>
            <div className={`group-view ${depth > 0 ? 'sub-group' : ''}`}>
                {/* Show header for main group (depth 0) OR for sub-groups when showSubGroupHeaders is true */}
                {(depth === 0 || showSubGroupHeaders) && (
                    <div className="group-header fade-in">
                        {/* Back button for sub-groups on new page */}
                        {depth === 0 && group.parentGroupId && onNavigateToBreadcrumb && (
                            <button
                                className="back-button"
                                onClick={() => onNavigateToBreadcrumb(group.parentGroupId!)}
                                title="Go back to parent group"
                            >
                                <span className="back-icon">←</span>
                                <span className="back-text">{t('group.back')}</span>
                            </button>
                        )}

                        {/* Show parent photo only on new page (depth 0) for sub-groups */}
                        {depth === 0 && parentPerson && parentPerson.photos.length > 0 && (() => {
                            // Get the latest photo based on yearTaken
                            const latestPhoto = [...parentPerson.photos].sort((a, b) => b.yearTaken - a.yearTaken)[0];
                            return (
                                <div className="parent-photo-container">
                                    <img
                                        src={latestPhoto.url}
                                        alt={parentPerson.name}
                                        className="parent-photo-img"
                                    />
                                </div>
                            );
                        })()}

                        {/* Show group header content for sub-groups (depth > 0) OR when on new page with parent (depth 0 with parentGroupId) */}
                        {(depth > 0 || (depth === 0 && group.parentGroupId)) && (
                            <div className="group-header-content">
                                {depth > 0 && (
                                    <div className="sub-group-indicator">
                                        <span className="indicator-icon">↳</span>
                                        <span className="indicator-label">{t('group.subGroup')}</span>
                                    </div>
                                )}
                                <h1 className="group-title">
                                    {group.name}
                                </h1>
                                {group.description && (
                                    <p className="group-description" style={{ whiteSpace: 'pre-wrap' }}>{group.description}</p>
                                )}
                            </div>
                        )}
                        <div className="group-stats">
                            <div className="stat-item">
                                <span className="stat-value">{group.members.length}</span>
                                <span className="stat-label">{t('group.members')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {group.members.reduce((sum, m) => sum + m.photos.length, 0)}
                                </span>
                                <span className="stat-label">{t('group.photos')}</span>
                            </div>
                        </div>
                        <div className="group-actions">
                            {/* Zoom Controls */}
                            <div className="zoom-controls">
                                <button
                                    className="zoom-btn"
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= 0.1}
                                    title="Zoom out (see more members)"
                                >
                                    <span className="zoom-icon">🔍−</span>
                                </button>
                                <button
                                    className="zoom-btn zoom-reset"
                                    onClick={handleResetZoom}
                                    title={`Reset zoom (currently ${Math.round(zoomLevel * 100)}%)`}
                                >
                                    <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                                </button>
                                <button
                                    className="zoom-btn"
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= 1}
                                    title="Zoom in (see larger)"
                                >
                                    <span className="zoom-icon">🔍+</span>
                                </button>
                            </div>

                            {/* Sub-group Headers Toggle - Only show on main group (depth 0) */}
                            {depth === 0 && (
                                <button
                                    className="btn btn-outline toggle-headers-btn"
                                    onClick={() => setLocalShowSubGroupHeaders(!localShowSubGroupHeaders)}
                                    title={localShowSubGroupHeaders ? "Hide sub-group headers" : "Show sub-group headers"}
                                >
                                    <span className="toggle-icon">{localShowSubGroupHeaders ? '📋' : '📋'}</span>
                                    <span className="btn-text">{localShowSubGroupHeaders ? 'Hide Headers' : 'Show Headers'}</span>
                                </button>
                            )}

                            {isAdminMode && (
                                <>
                                    {onAddMember && (
                                        <button className="btn btn-primary" onClick={() => setIsAddingMember(true)}>
                                            {t('group.addMember')}
                                        </button>
                                    )}
                                    {onEditGroup && (
                                        <button className="btn btn-secondary" onClick={() => setIsEditingGroup(true)}>
                                            {t('group.editGroup')}
                                        </button>
                                    )}
                                </>
                            )}
                            {depth > 0 && (
                                <button
                                    className="btn btn-secondary open-page-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log('Open Page clicked for group:', group.id);
                                        onNavigateToBreadcrumb(group.id);
                                    }}
                                    title="Open this group in a new page"
                                >
                                    <span className="btn-text">{t('group.openPage')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {searchQuery && (
                    <div className="search-results-info">
                        {t('group.found')} {filteredMembers.length} {filteredMembers.length === 1 ? t('group.member') : t('group.members_plural')}
                    </div>
                )}

                {filteredMembers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>{t('group.noMembersFound')}</h3>
                        <p>
                            {searchQuery
                                ? t('group.tryAdjustingSearch')
                                : t('group.addMembersToStart')}
                        </p>
                    </div>
                ) : (
                    <div
                        className="members-grid-wrapper"
                        style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'top left',
                            width: `${100 / zoomLevel}%`
                        }}
                    >
                        <div className="members-grid">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="member-with-subgroup">
                                    <PersonCard
                                        person={member}
                                        onClick={() => setSelectedPerson(member)}
                                        onToggleSubGroup={member.subGroupId ? () => onToggleSubGroup(member.subGroupId!) : undefined}
                                        isSubGroupExpanded={member.subGroupId ? expandedGroups.has(member.subGroupId) : false}
                                        allGroups={allGroups}
                                    />

                                    {/* Render sub-group inline if expanded */}
                                    {member.subGroupId && expandedGroups.has(member.subGroupId) && allGroups[member.subGroupId] && (
                                        <div className="sub-group-container slide-in-right">
                                            <GroupView
                                                group={allGroups[member.subGroupId]}
                                                allGroups={allGroups}
                                                expandedGroups={expandedGroups}
                                                breadcrumbs={breadcrumbs}
                                                onNavigateToBreadcrumb={onNavigateToBreadcrumb}
                                                onCreateSubGroup={onCreateSubGroup}
                                                onToggleSubGroup={onToggleSubGroup}
                                                onUpdateMember={onUpdateMember}
                                                onDeleteMember={onDeleteMember}
                                                onEditGroup={onEditGroup}
                                                onDeleteGroup={onDeleteGroup}
                                                onAddMember={onAddMember}
                                                searchQuery={searchQuery}
                                                depth={depth + 1}
                                                isAdminMode={isAdminMode}
                                                showSubGroupHeaders={showSubGroupHeaders}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedPerson && (
                    <PersonModal
                        person={selectedPerson}
                        onClose={() => setSelectedPerson(null)}
                        onCreateSubGroup={() => {
                            onCreateSubGroup(selectedPerson.id);
                            setSelectedPerson(null);
                        }}
                        onViewSubGroup={
                            selectedPerson.subGroupId
                                ? () => {
                                    onToggleSubGroup(selectedPerson.subGroupId!);
                                    setSelectedPerson(null);
                                }
                                : undefined
                        }
                        onEdit={() => handleEditMember(selectedPerson)}
                        allGroups={allGroups}
                        isAdminMode={isAdminMode}
                    />
                )}

                {editingPerson && (
                    <EditMemberModal
                        person={editingPerson}
                        onClose={() => setEditingPerson(null)}
                        onUpdate={handleUpdateMember}
                        onDelete={(personId) => {
                            if (onDeleteMember) {
                                onDeleteMember(personId);
                                setEditingPerson(null);
                            }
                        }}
                    />
                )}

                {isAddingMember && (
                    <AddMemberModal
                        onClose={() => setIsAddingMember(false)}
                        onAdd={handleAddMemberToGroup}
                    />
                )}

                {isEditingGroup && (
                    <EditGroupModal
                        group={group}
                        onClose={() => setIsEditingGroup(false)}
                        onSave={handleEditGroupInfo}
                        onDelete={(groupId) => {
                            if (onDeleteGroup) {
                                onDeleteGroup(groupId);
                                setIsEditingGroup(false);
                            }
                        }}
                        existingGroups={allGroups}
                    />
                )}
            </div>
        </div>
    );
};
