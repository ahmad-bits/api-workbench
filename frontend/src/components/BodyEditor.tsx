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
      setJsonError(`Cannot format JSON: ${err.message}`);
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
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="wb-body-editor-wrap">
      {/* Format & Content-Type Toolbar */}
      <div className="wb-body-toolbar">
        <div className="wb-body-type-selector">
          <button
            type="button"
            className={`wb-body-type-btn ${bodyType === 'none' ? 'active' : ''}`}
            onClick={() => onBodyTypeChange('none')}
          >
            none
          </button>
          <button
            type="button"
            className={`wb-body-type-btn ${bodyType === 'json' ? 'active' : ''}`}
            onClick={() => onBodyTypeChange('json')}
          >
            JSON
          </button>
          <button
            type="button"
            className={`wb-body-type-btn ${bodyType === 'text' ? 'active' : ''}`}
            onClick={() => onBodyTypeChange('text')}
          >
            Raw Text
          </button>
        </div>

        {bodyType === 'json' && (
          <button
            type="button"
            className="wb-btn-beautify-json"
            onClick={handleFormatJson}
            title="Format JSON payload"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Format JSON</span>
          </button>
        )}
      </div>

      {bodyType === 'none' ? (
        <div className="wb-body-empty-pane">
          <span>This request does not have a payload body.</span>
        </div>
      ) : (
        <div className="wb-body-textarea-container">
          <textarea
            className={`wb-body-textarea ${jsonError ? 'has-error' : ''}`}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            placeholder={
              bodyType === 'json'
                ? '{\n  "key": "value"\n}'
                : 'Enter raw request body...'
            }
            rows={14}
            spellCheck={false}
          />
          {jsonError && (
            <div className="wb-body-error-badge">
              <span>⚠ Invalid JSON syntax: {jsonError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
