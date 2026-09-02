import React from 'react';

interface BodyEditorProps {
  body: string;
  onBodyChange: (body: string) => void;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({
  body,
  onBodyChange,
}) => {
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
      <textarea
        className="wb-body-textarea-clean"
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter request body (JSON)..."
        rows={15}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};
