'use client';

import dynamic from 'next/dynamic';

import CodeBlock, { resolveLanguage } from './CodeBlock';

const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
    ssr: false,
    loading: () => <div className="p-6 text-xs text-white/50">Loading preview…</div>,
});

const PLAIN =
    'p-6 text-sm font-mono text-white/60 whitespace-pre-wrap break-words leading-relaxed';

interface ContentCanvasProps {
    content: string;
    language?: string;
    /** Always render the plain <pre> path, ignoring the language. */
    forceRaw?: boolean;
    emptyPreview?: string;
    showLineNumbers?: boolean;
}

/**
 * Renders paste content in the richest form the language allows:
 * markdown -> highlighted code -> plain text.
 *
 * The markdown path is code-split, so the unified/remark/rehype stack is
 * fetched only when a markdown paste is actually rendered.
 */
export default function ContentCanvas({
    content,
    language,
    forceRaw = false,
    emptyPreview,
    showLineNumbers = true,
}: ContentCanvasProps) {
    if (forceRaw) {
        return <pre className={PLAIN}>{content}</pre>;
    }

    if (language === 'markdown') {
        return <MarkdownPreview content={content || emptyPreview || ''} />;
    }

    if (resolveLanguage(language) === null) {
        return <pre className={PLAIN}>{content || emptyPreview || ''}</pre>;
    }

    return (
        <CodeBlock
            code={content || emptyPreview || ''}
            language={language}
            showLineNumbers={showLineNumbers}
        />
    );
}
