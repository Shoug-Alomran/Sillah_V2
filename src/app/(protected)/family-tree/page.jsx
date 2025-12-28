'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  X,
} from 'lucide-react';

export default function FamilyTreePage() {
  // Placeholder data — later we connect to SQLite
  const [members] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="family-tree-page">
      <div className="family-tree-container">

        {/* Header */}
        <div className="family-tree-header">
          <div className="header-content">
            <h1 className="family-tree-title">
              <Users className="title-icon" />
              Family Tree
            </h1>
            <p className="family-tree-subtitle">
              Build your hereditary family tree and track health patterns
            </p>
          </div>

          <button
            className="add-member-btn"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="btn-icon" />
            Add Member
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search family members..."
            className="search-input"
          />
        </div>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3 className="empty-title">No Family Members Yet</h3>
            <p className="empty-text">
              Start building your family tree by adding your first member.
            </p>
            <button
              className="empty-action-btn"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="empty-action-icon" />
              Add Member
            </button>
          </div>
        ) : (
          <div className="members-grid">
            {members.map((member) => (
              <div key={member.id} className="member-card">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-details">{member.relationship}</p>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">

              {/* Modal Header */}
              <div className="modal-header">
                <h2 className="modal-title">Add Family Member</h2>
                <button
                  className="modal-close"
                  onClick={() => setModalOpen(false)}
                >
                  <X />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body">
                <p className="modal-placeholder">
                  Form coming soon — after we finish all pages.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
