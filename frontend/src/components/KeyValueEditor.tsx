import React from 'react';
import type { KeyValuePair } from '../types/workbench';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  emptyMessage?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  keyPlaceholder = 'Parameter name',
  valuePlaceholder = 'Parameter value',
  addLabel = 'Add Row',
  emptyMessage = 'No entries configured.',
}) => {
  const handleItemChange = (id: string, field: 'key' | 'value' | 'enabled', value: any) => {
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
      id: `kv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
    <div className="wb-kv-container">
      <div className="wb-kv-toolbar">
        <div className="wb-kv-toolbar-left">
          <button type="button" className="wb-kv-btn-add" onClick={handleAddItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{addLabel}</span>
          </button>
        </div>
        <div className="wb-kv-toolbar-right">
          {items.length > 0 && (
            <button type="button" className="wb-kv-btn-clear" onClick={handleClearAll}>
              Clear All ({items.length})
            </button>
          )}
        </div>
      </div>

      <div className="wb-kv-table-wrap">
        <table className="wb-kv-grid">
          <thead>
            <tr>
              <th className="th-check" title="Toggle active status">
                <span className="wb-th-check-label">✓</span>
              </th>
              <th className="th-key">{keyLabel}</th>
              <th className="th-val">{valueLabel}</th>
              <th className="th-del"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="wb-kv-empty-cell">
                  <div className="wb-kv-empty-content">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span>{emptyMessage}</span>
                    <button type="button" className="wb-kv-empty-add-btn" onClick={handleAddItem}>
                      + {addLabel}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={!item.enabled ? 'row-disabled' : ''}>
                  <td className="td-check">
                    <label className="wb-checkbox-label">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => handleItemChange(item.id, 'enabled', e.target.checked)}
                        className="wb-checkbox"
                        title={item.enabled ? 'Disable item' : 'Enable item'}
                      />
                    </label>
                  </td>

                  <td className="td-key">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
                      placeholder={keyPlaceholder}
                      className="wb-table-input key-input"
                      spellCheck={false}
                      autoFocus={index === items.length - 1 && item.key === ''}
                    />
                  </td>

                  <td className="td-val">
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
                      placeholder={valuePlaceholder}
                      className="wb-table-input val-input"
                      spellCheck={false}
                    />
                  </td>

                  <td className="td-del">
                    <button
                      type="button"
                      className="wb-btn-row-del"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove entry"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
