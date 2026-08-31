import React from 'react';
import type { KeyValuePair } from '../types/workbench';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  descPlaceholder?: string;
  title?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  descPlaceholder = 'Description',
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
      id: `kv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key: '',
      value: '',
      description: '',
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
            <span>Add Row</span>
          </button>
        </div>
        <div className="wb-kv-toolbar-right">
          {items.length > 0 && (
            <button type="button" className="wb-kv-btn-clear" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="wb-kv-table-wrap">
        <table className="wb-kv-grid">
          <thead>
            <tr>
              <th className="th-check"></th>
              <th className="th-key">Key</th>
              <th className="th-val">Value</th>
              <th className="th-desc">Description</th>
              <th className="th-del"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="wb-kv-empty-cell">
                  <span>No entries configured.</span>
                  <button type="button" className="wb-kv-empty-add-btn" onClick={handleAddItem}>
                    + Add first row
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={!item.enabled ? 'row-disabled' : ''}>
                  <td className="td-check">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => handleItemChange(item.id, 'enabled', e.target.checked)}
                      className="wb-checkbox"
                      title={item.enabled ? 'Disable' : 'Enable'}
                    />
                  </td>
                  <td className="td-key">
                    <input
                      type="text"
                      value={item.key}
                      placeholder={keyPlaceholder}
                      onChange={(e) => handleItemChange(item.id, 'key', e.target.value)}
                      className="wb-table-input key-input"
                      spellCheck={false}
                    />
                  </td>
                  <td className="td-val">
                    <input
                      type="text"
                      value={item.value}
                      placeholder={valuePlaceholder}
                      onChange={(e) => handleItemChange(item.id, 'value', e.target.value)}
                      className="wb-table-input val-input"
                      spellCheck={false}
                    />
                  </td>
                  <td className="td-desc">
                    <input
                      type="text"
                      value={item.description || ''}
                      placeholder={descPlaceholder}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="wb-table-input desc-input"
                      spellCheck={false}
                    />
                  </td>
                  <td className="td-del">
                    <button
                      type="button"
                      className="wb-btn-row-del"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove row"
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
