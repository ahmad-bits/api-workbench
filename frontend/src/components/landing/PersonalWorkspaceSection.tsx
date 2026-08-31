import React, { useState } from 'react';

interface PersonalWorkspaceSectionProps {
  onCreateWorkspaceClick?: () => void;
}

export const PersonalWorkspaceSection: React.FC<PersonalWorkspaceSectionProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const workspaces = [
    {
      id: 'ecommerce',
      title: 'E-Commerce Core API',
      description: 'Production endpoints for checkout and inventory',
      endpointsCount: 18,
      updated: 'Updated 2h ago',
      iconTheme: 'purple',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },
    {
      id: 'usermgmt',
      title: 'User Management v2',
      description: 'New auth flows and RBAC implementation',
      endpointsCount: 12,
      updated: 'Updated 1d ago',
      iconTheme: 'emerald',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
    },
    {
      id: 'payment',
      title: 'Payment Gateway Integration',
      description: 'Stripe webhooks and charge creators',
      endpointsCount: 6,
      updated: 'Updated 3d ago',
      iconTheme: 'amber',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
  ];

  const filtered = workspaces.filter(
    (w) =>
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="wb-personal-workspace-section" id="personal-workspace">
      <div className="wb-centered-section-container">
        {/* Header */}
        <div className="wb-centered-header-box">
          <h2 className="wb-centered-heading">Your Personal Workspace</h2>
          <p className="wb-centered-subtitle">
            Organize all your APIs, environments, and collections in one clean, shareable dashboard.
          </p>
        </div>

        {/* Outer Workspace Card Frame */}
        <div className="wb-workspace-frame-card">
          {/* Top Search & Actions Bar */}
          <div className="wb-workspace-top-bar">
            <div className="wb-workspace-search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="wb-workspace-search-input"
              />
            </div>

            {/* + New Workspace is demonstration only */}
            <button
              type="button"
              className="wb-btn-primary-pill compact wb-btn-demo-only"
              disabled
              aria-disabled="true"
              tabIndex={-1}
            >
              + New Workspace
            </button>
          </div>

          {/* Cards Grid */}
          <div className="wb-workspaces-cards-grid">
            {filtered.map((item) => (
              <div key={item.id} className="wb-workspace-item-card">
                <div className={`wb-workspace-item-icon ${item.iconTheme}`}>
                  {item.icon}
                </div>

                <div className="wb-workspace-item-body">
                  <h4 className="wb-workspace-item-title">{item.title}</h4>
                  <p className="wb-workspace-item-desc">{item.description}</p>
                </div>

                <div className="wb-workspace-item-footer">
                  <span className="wb-ws-count">{item.endpointsCount} Endpoints</span>
                  <span className="wb-ws-updated">{item.updated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
