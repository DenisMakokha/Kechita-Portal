import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact'
];

const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32', '36'];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
  '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
  '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
];

export default function RichTextEditor({ value, onChange, placeholder = 'Write your message...', height = '300px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedSize, setSelectedSize] = useState('14');

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setShowLinkDialog(false);
      setLinkUrl('');
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const changeFontFamily = (font: string) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const changeFontSize = (size: string) => {
    setSelectedSize(size);
    execCommand('fontSize', '7');
    // Wrap selected text in span with custom size
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      range.surroundContents(span);
    }
  };

  const changeTextColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const changeBackgroundColor = (color: string) => {
    execCommand('backColor', color);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Font Family */}
        <select
          value={selectedFont}
          onChange={(e) => changeFontFamily(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          title="Font"
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={selectedSize}
          onChange={(e) => changeFontSize(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-16"
          title="Font Size"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className="p-2 hover:bg-gray-200 rounded line-through"
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Color */}
        <div className="relative group">
          <button
            type="button"
            className="p-2 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Text Color"
          >
            <span>A</span>
            <div className="w-4 h-1 bg-red-500"></div>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 hidden group-hover:block z-10">
            <div className="grid grid-cols-10 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => changeTextColor(color)}
                  className="w-5 h-5 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="relative group">
          <button
            type="button"
            className="p-2 hover:bg-gray-200 rounded"
            title="Background Color"
          >
            🎨
          </button>
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 hidden group-hover:block z-10">
            <div className="grid grid-cols-10 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => changeBackgroundColor(color)}
                  className="w-5 h-5 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Align Left"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Align Center"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Align Right"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyFull')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Justify"
        >
          ≡
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          1.
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Indent */}
        <button
          type="button"
          onClick={() => execCommand('indent')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Indent"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => execCommand('outdent')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Outdent"
        >
          ←
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Link & Image */}
        <button
          type="button"
          onClick={() => setShowLinkDialog(true)}
          className="p-2 hover:bg-gray-200 rounded"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 hover:bg-gray-200 rounded"
          title="Insert Image"
        >
          🖼️
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Format */}
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="p-2 hover:bg-gray-200 rounded text-xs"
          title="Remove Formatting"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Quote"
        >
          "
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertHorizontalRule')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Horizontal Line"
        >
          ―
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="p-2 hover:bg-gray-200 rounded"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 outline-none overflow-y-auto"
        style={{ minHeight: height, maxHeight: height }}
        data-placeholder={placeholder}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          display: block;
        }
        [contenteditable]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
