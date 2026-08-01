import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Eye,
  Pencil,
} from 'lucide-react';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type ToolAction = {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix?: string;
  placeholder: string;
  block?: boolean;
};

const tools: ToolAction[] = [
  { icon: Bold, label: 'Tebal', prefix: '**', suffix: '**', placeholder: 'teks tebal' },
  { icon: Italic, label: 'Miring', prefix: '*', suffix: '*', placeholder: 'teks miring' },
  { icon: Heading2, label: 'Judul H2', prefix: '## ', placeholder: 'Judul Bagian', block: true },
  { icon: Heading3, label: 'Judul H3', prefix: '### ', placeholder: 'Sub Judul', block: true },
  { icon: List, label: 'Daftar', prefix: '- ', placeholder: 'item daftar', block: true },
  { icon: ListOrdered, label: 'Daftar Bernomor', prefix: '1. ', placeholder: 'item daftar', block: true },
  { icon: Quote, label: 'Kutipan', prefix: '> ', placeholder: 'kutipan', block: true },
  { icon: Code, label: 'Kode', prefix: '`', suffix: '`', placeholder: 'kode' },
  { icon: LinkIcon, label: 'Tautan', prefix: '[', suffix: '](https://)', placeholder: 'teks tautan' },
  { icon: ImageIcon, label: 'Gambar', prefix: '![', suffix: '](https://)', placeholder: 'alt gambar' },
  { icon: Minus, label: 'Garis Pemisah', prefix: '\n---\n', placeholder: '', block: true },
];

// Markdown collapses repeated blank lines, so empty paragraphs the writer
// created with Enter would vanish in the preview. Insert a zero-width space
// paragraph for every extra blank line so the preview matches the editor.
const ZWSP = '&#8203;';

const normalizeForPreview = (text: string) => {
  const withEmptyParagraphs = text.replace(/\n{3,}/g, (match) => {
    const extra = match.length - 2;
    return '\n\n' + `${ZWSP}\n\n`.repeat(extra);
  });

  // Keep trailing empty paragraphs visible while typing
  const trailing = withEmptyParagraphs.match(/\n{2,}$/);
  if (trailing) {
    return withEmptyParagraphs.replace(/\n{2,}$/, '\n\n' + ZWSP);
  }
  return withEmptyParagraphs;
};

const MarkdownEditor = ({

  id,
  value,
  onChange,
  placeholder,
  rows = 14,
}: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const applyTool = (tool: ToolAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const suffix = tool.suffix ?? '';

    let insert = '';

    if (tool.prefix === '\n---\n') {
      insert = tool.prefix;
    } else if (tool.block) {
      const needsNewline = start > 0 && value[start - 1] !== '\n';
      insert = `${needsNewline ? '\n' : ''}${tool.prefix}${selected || tool.placeholder}`;
    } else {
      insert = `${tool.prefix}${selected || tool.placeholder}${suffix}`;
    }

    const newValue = value.slice(0, start) + insert + value.slice(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      if (!selected && tool.placeholder) {
        const phStart = newValue.indexOf(tool.placeholder, start);
        if (phStart !== -1) {
          textarea.setSelectionRange(phStart, phStart + tool.placeholder.length);
          return;
        }
      }
      const pos = start + insert.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  // Enter creates a real new paragraph (blank line) so it renders correctly
  // regardless of markdown soft-break settings elsewhere.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Keep default single-newline behaviour inside lists, quotes and code blocks
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLine = value.slice(lineStart, start);
    const isStructuredLine = /^\s*(?:[-*+]\s|\d+\.\s|>\s?|\|)/.test(currentLine);
    const codeFences = (value.slice(0, start).match(/^```/gm) || []).length;
    const inCodeBlock = codeFences % 2 === 1;
    if (isStructuredLine || inCodeBlock) return;

    e.preventDefault();

    // Avoid stacking more than one blank line
    const before = value.slice(0, start);
    const insert = /\n\s*\n\s*$/.test(before) ? '\n' : '\n\n';
    const newValue = before + insert + value.slice(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + insert.length;
      textarea.setSelectionRange(pos, pos);
    });
  };


  return (
    <div className="rounded-lg border border-input bg-background overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            onClick={() => applyTool(tool)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <tool.icon size={16} />
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'write' ? 'secondary' : 'ghost'}
            className="h-8 gap-1.5 px-2.5"
            onClick={() => setMode('write')}
          >
            <Pencil size={14} />
            Tulis
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'preview' ? 'secondary' : 'ghost'}
            className="h-8 gap-1.5 px-2.5"
            onClick={() => setMode('preview')}
          >
            <Eye size={14} />
            Pratinjau
          </Button>
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-y bg-transparent px-3 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
        />
      ) : (
        <div className="px-4 py-4 min-h-[12rem]">
          {value.trim() ? (
            <div
              className="prose prose-invert max-w-none article-content text-base sm:text-lg
                prose-headings:text-foreground prose-headings:font-display prose-headings:leading-snug prose-headings:tracking-tight
                prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:font-bold
                prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-semibold
                prose-p:text-muted-foreground prose-p:my-6
                prose-ul:my-6 prose-ol:my-6 prose-ul:space-y-2 prose-ol:space-y-2
                prose-li:text-muted-foreground prose-li:my-0 prose-li:pl-1
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:my-8 prose-blockquote:py-1
                prose-hr:border-border prose-hr:my-10
                prose-img:my-8 prose-img:rounded-lg"
              style={{ ['--article-line-height' as string]: '1.8' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada konten untuk dipratinjau.</p>
          )}
        </div>
      )}

    </div>
  );
};

export default MarkdownEditor;
