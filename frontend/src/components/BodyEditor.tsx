import React, { useState } from 'react';
import type { BodyType } from '../types/workbench';

interface BodyEditorProps {
  bodyType: BodyType;
  body: string;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({
  bodyType,
  body,
  onBodyTypeChange,
  onBodyChange,
}) => {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onBodyChange(val);

    if (bodyType === 'json' && val.trim()) {
      try {
        JSON.parse(val);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message);
      }
    } else {
      setJsonError(null);
    }
  };

  const handleFormatJson = () => {
    if (!body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      onBodyChange(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`Cannot format: ${err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = body.substring(0, start) + '  ' + body.substring(end);
      onBodyChange(newValue);
      // Move cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="body-editor">
      {/* Type Selector Bar */}
      <div className="body-type-bar">
        <div className="body-type-options">
          <label className={`radio-label ${bodyType === 'none' ? 'active' : ''}`}>
            <input
              type="radio"
              name="bodyType"
              value="none"
              checked={bodyType === 'none'}
              onChange={() => onBodyTypeChange('none')}
            />
            none
          </label>
          <label className={`radio-label ${bodyType === 'json' ? 'active' : ''}`}>
            <input
              type="radio"
              name="bodyType"
              value="json"
              checked={bodyType === 'json'}
              onChange={() => onBodyTypeChange('json')}
            />
            JSON (application/json)
          </label>
          <label className={`radio-label ${bodyType === 'text' ? 'active' : ''}`}>
            <input
              type="radio"
              name="bodyType"
              value="text"
              checked={bodyType === 'text'}
              onChange={() => onBodyTypeChange('text')}
            />
            Raw Text
          </label>
        </div>

        {bodyType === 'json' && (
          <button type="button" className="btn-secondary-sm" onClick={handleFormatJson}>
            Beautify JSON
          </button>
        )}
      </div>

      {bodyType === 'none' ? (
        <div className="body-none-msg">
          <span>This request does not include a payload body.</span>
        </div>
      ) : (
        <div className="body-input-container">
          <textarea
            className={`body-textarea ${jsonError ? 'textarea-error' : ''}`}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            placeholder={
              bodyType === 'json'
                ? '{\n  "name": "API Workbench",\n  "version": 1.0\n}'
                : 'Enter raw payload...'
            }
            rows={12}
            spellCheck={false}
          />
          {jsonError && (
            <div className="json-error-banner">
              <span className="error-icon">⚠</span>
              <span>Invalid JSON: {jsonError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
