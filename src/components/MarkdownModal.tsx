import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Copy, Check, FileText, Eye, Code } from 'lucide-react';

interface MarkdownModalProps {
  source: { path: string; content: string } | null;
  onClose: () => void;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({ source, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  if (!source) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(source.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Markdown Source File Inspector
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
                {source.path}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setViewMode('rendered')}
                style={{
                  background: viewMode === 'rendered' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'rendered' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: viewMode === 'rendered' ? 600 : 400,
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: viewMode === 'rendered' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Eye size={12} /> Rendered
              </button>
              <button
                onClick={() => setViewMode('raw')}
                style={{
                  background: viewMode === 'raw' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'raw' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: viewMode === 'raw' ? 600 : 400,
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: viewMode === 'raw' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Code size={12} /> Raw
              </button>
            </div>

            <button
              onClick={handleCopyPath}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Path'}
            </button>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            This item is driven by its Markdown document. Edit or add files in <code>{source.path.split('/')[0]}/{source.path.split('/')[1]}</code>.
          </p>

          {viewMode === 'rendered' ? (
            <div className="markdown-body" style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{source.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="code-preview">{source.content || `# Content file: ${source.path}`}</div>
          )}
        </div>
      </div>
    </div>
  );
};
