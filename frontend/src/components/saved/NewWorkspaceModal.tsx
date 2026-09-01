import React, { useState, useEffect, useRef } from 'react';
import type { WorkspaceCategory } from '../../types/savedApi';
import { useToast } from '../../context/ToastContext';

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspace: WorkspaceCategory) => void;
  existingNames: string[];
}

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  existingNames,
}) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.warning('Please enter a workspace name.');
      return;
    }

    if (existingNames.some((n) => n.toLowerCase() === cleanName.toLowerCase())) {
      toast.warning(`A workspace named "${cleanName}" already exists.`);
      return;
    }

    const newWs: WorkspaceCategory = {
      id: `ws-${Date.now()}`,
      name: cleanName,
      description: description.trim() || 'Custom API workspace collection',
      iconTheme: 'blue',
    };

    onCreated(newWs);
    toast.success(`Workspace "${cleanName}" created successfully!`);
    handleClose();
  };

  return (
    <div className="wb-modal-backdrop" onClick={handleClose}>
      <div className="wb-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3 className="wb-modal-title">Create New Workspace</h3>
          <button
            type="button"
            className="wb-mock-btn-close"
            onClick={handleClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wb-modal-body">
            <div className="wb-form-field">
              <label className="wb-form-label">
                Workspace Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                className="wb-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Core API, User Auth, Billing Service"
                required
              />
            </div>

            <div className="wb-form-field">
              <label className="wb-form-label">Description (Optional)</label>
              <input
                type="text"
                className="wb-form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Endpoints for authentication, checkout, or billing"
              />
            </div>
          </div>

          <div className="wb-modal-footer">
            <button
              type="button"
              className="wb-btn-mock-cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wb-btn-mock-save"
              disabled={!name.trim()}
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
