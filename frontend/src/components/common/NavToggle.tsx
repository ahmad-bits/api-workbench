import React from 'react';
import { useWorkbench } from '../../context/WorkbenchContext';

interface NavToggleProps {
  className?: string;
}

/**
 * Three-line hamburger / menu toggle button that smoothly collapses and expands
 * the left navigation sidebar in the API Workbench layout.
 */
export const NavToggle: React.FC<NavToggleProps> = ({ className = '' }) => {
  const { isSidebarCollapsed, toggleSidebar } = useWorkbench();

  return (
    <button
      type="button"
      className={`wb-nav-toggle-btn ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${className}`.trim()}
      onClick={toggleSidebar}
      aria-label={isSidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
      aria-expanded={!isSidebarCollapsed}
      title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="wb-hamburger-svg"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
};
