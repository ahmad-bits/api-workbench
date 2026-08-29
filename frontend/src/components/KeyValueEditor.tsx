import React from 'react';
import type { KeyValuePair } from '../types/workbench';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  title?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  title,
}) => {
  const handleItemChange = (id: string, field: keyof KeyValuePair, value: any) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  const handleAddItem = () => {
    const newItem: KeyValuePair = {
      id: `kv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      key: '',
      value: '',
      enabled: true,
    };
    onChange([...items, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="kv-editor">
      <div className="kv-header">
        <span className="kv-title">{title || 'Parameters'}</span>
        <div className="kv-actions">
          {items.length > 0 && (
            <button type="button" className="btn-text-danger" onClick={handleClearAll}>
              Clear All
            </button>
          )}
          <button type="button" className="btn-secondary-sm" onClick={handleAddItem}>
            + Add Row
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="kv-empty">
          <span>No parameters configured.</span>
          <button type="button" className="btn-link" onClick={handleAddItem}>
            Click here to add one
          </button>
        </div>
      ) : (
        <div className="kv-table-container">
          <table className="kv-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}></th>
                <th>Key</th>
                <th>Value</th>
                <th style={{ width: '45px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={!item.enabled ? 'row-disabled' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => handleItemChange(item.id, 'enabled', e.target.checked)}
                      className="kv-checkbox"
                      title={item.enabled ? 'Disable parameter' : 'Enable parameter'}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.key}
                      placeholder={keyPlaceholder}
                      onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
                      className="kv-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.value}
                      placeholder={valuePlaceholder}
                      onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
                      className="kv-input"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove row"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
