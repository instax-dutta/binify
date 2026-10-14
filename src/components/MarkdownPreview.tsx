'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

import CodeBlock from './CodeBlock';

/**
 * Rendered markdown. Pulled in via next/dynamic so the unified/remark/rehype
 * stack only downloads when someone actually opens a preview.
 */
function MarkdownPreview({ content }: { content: string }) {
    return (
        <div
            className="prose max-w-none p-6 text-ink overflow-x-auto"
            style={{
                // Tailwind typography reads these; pointing them at the paper
                // palette is what keeps prose legible on vellum.
                '--tw-prose-body': 'rgba(43, 36, 26, 0.9)',
                '--tw-prose-headings': '#2b241a',
                '--tw-prose-lead': '#4f4637',
                '--tw-prose-links': '#7a2e2a',
                '--tw-prose-bold': '#2b241a',
                '--tw-prose-counters': '#7a2e2a',
                '--tw-prose-bullets': '#7a2e2a',
                '--tw-prose-hr': 'rgba(43, 36, 26, 0.25)',
                '--tw-prose-quotes': '#4f4637',
                '--tw-prose-quote-borders': 'rgba(122, 46, 42, 0.4)',
                '--tw-prose-code': '#2b241a',
                '--tw-prose-pre-code': '#2b241a',
                '--tw-prose-pre-bg': 'transparent',
                '--tw-prose-th-borders': 'rgba(43, 36, 26, 0.2)',
                '--tw-prose-td-borders': 'rgba(43, 36, 26, 0.15)',
            } as React.CSSProperties}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (match) {
                            return (
                                <CodeBlock
                                    variant="panel"
                                    language={match[1]}
                                    code={String(children).replace(/\n$/, '')}
                                />
                            );
                        }
                        return (
                            <code
                                  className={cn('px-1.5 py-0.5 font-mono text-xs', className)}
                                  style={{ background: 'rgba(43,36,26,.08)', color: '#7a2e2a' }}
                              >
                                {children}
                            </code>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-8" style={{ background: 'rgba(43,36,26,.03)', border: '1px solid rgba(43,36,26,.15)' }}>
                                <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead({ children }) {
                        return <thead style={{ background: 'rgba(43,36,26,.05)' }}>{children}</thead>;
                    },
                    th({ children }) {
                        return (
                            <th className="px-5 py-3 text-left text-[0.625rem] font-bold uppercase tracking-[0.1em]" style={{ color: 'rgba(43,36,26,.7)', borderBottom: '1px solid rgba(43,36,26,.2)' }}>
                                {children}
                            </th>
                        );
                    },
                    td({ children }) {
                        return (
                            <td className="px-5 py-3 text-sm" style={{ color: 'rgba(43,36,26,.85)', borderBottom: '1px solid rgba(43,36,26,.15)' }}>
                                {children}
                            </td>
                        );
                    },
                    tr({ children }) {
                        return (
                            <tr>
                                {children}
                            </tr>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default memo(MarkdownPreview);
