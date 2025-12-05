import React, { useState } from 'react';
import type { Group, Person } from '../types';
import { PersonCard } from './PersonCard';
import { PersonModal } from './PersonModal';
import { EditMemberModal } from './EditMemberModal';
import { AddMemberModal } from './AddMemberModal';
import { EditGroupModal } from './EditGroupModal';
import { Breadcrumb } from './Breadcrumb';
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
    onEditGroup?: (groupId: string, updates: { name?: string; description?: string }) => void;
    onAddMember?: (groupId: string, person: Person, photoFiles?: File[], photoYears?: number[]) => void;
    searchQuery: string;
    depth: number;
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
    onEditGroup,
    onAddMember,
    searchQuery,
    depth,
}) => {
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isEditingGroup, setIsEditingGroup] = useState(false);

    const filteredMembers = group.members
        .filter((member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.relationship.toLowerCase().includes(searchQuery.toLowerCase())
        )
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
            {depth === 0 && <Breadcrumb items={breadcrumbs} onNavigate={onNavigateToBreadcrumb} />}

            <div className={`group-view ${depth > 0 ? 'sub-group' : ''}`}>
                <div className="group-header fade-in">
                    <div className="group-header-content">
                        {depth > 0 && (
                            <div className="sub-group-indicator">
                                <span className="indicator-icon">↳</span>
                                <span className="indicator-label">Sub-Group</span>
                            </div>
                        )}
                        <h1 className={`group-title ${depth === 0 ? 'gradient-text' : ''}`}>
                            {group.name}
                        </h1>
                        {group.description && (
                            <p className="group-description">{group.description}</p>
                        )}
                    </div>
                    <div className="group-stats">
                        <div className="stat-item">
                            <span className="stat-value">{group.members.length}</span>
                            <span className="stat-label">Members</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                {group.members.reduce((sum, m) => sum + m.photos.length, 0)}
                            </span>
                            <span className="stat-label">Photos</span>
                        </div>
                    </div>
                    {(onEditGroup || onAddMember) && (
                        <div className="group-actions">
                            {onAddMember && (
                                <button className="btn btn-primary" onClick={() => setIsAddingMember(true)}>
                                    <span>➕</span>
                                    Add Member
                                </button>
                            )}
                            {onEditGroup && (
                                <button className="btn btn-secondary" onClick={() => setIsEditingGroup(true)}>
                                    <span>✏️</span>
                                    Edit Group
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {searchQuery && depth === 0 && (
                    <div className="search-results-info">
                        Found {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                    </div>
                )}

                {filteredMembers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>No members found</h3>
                        <p>
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Add members to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="members-grid">
                        {filteredMembers.map((member) => (
                            <div key={member.id} className="member-with-subgroup">
                                <PersonCard
                                    person={member}
                                    onClick={() => setSelectedPerson(member)}
                                    onToggleSubGroup={member.subGroupId ? () => onToggleSubGroup(member.subGroupId!) : undefined}
                                    isSubGroupExpanded={member.subGroupId ? expandedGroups.has(member.subGroupId) : false}
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
                                            onEditGroup={onEditGroup}
                                            onAddMember={onAddMember}
                                            searchQuery=""
                                            depth={depth + 1}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
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
                    />
                )}

                {editingPerson && (
                    <EditMemberModal
                        person={editingPerson}
                        onClose={() => setEditingPerson(null)}
                        onUpdate={handleUpdateMember}
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
                    />
                )}
            </div>
        </div>
    );
};
