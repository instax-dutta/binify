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
            className="prose prose-invert max-w-none p-6 text-white/80 overflow-x-auto"
            style={{ '--tw-prose-pre-bg': 'transparent' } as React.CSSProperties}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match) {
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
                                className={cn(
                                    'bg-white/10 px-1.5 py-0.5 rounded text-[#539df5] font-mono text-xs',
                                    className
                                )}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-8 bg-white/[0.02] rounded-lg border border-white/5">
                                <table className="min-w-full divide-y divide-white/5">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead({ children }) {
                        return <thead className="bg-white/[0.03]">{children}</thead>;
                    },
                    th({ children }) {
                        return (
                            <th className="px-5 py-3 text-left text-[0.625rem] font-bold uppercase tracking-[0.1em] text-white/40 border-b border-white/5">
                                {children}
                            </th>
                        );
                    },
                    td({ children }) {
                        return (
                            <td className="px-5 py-3 text-sm border-b border-white/5 text-white/60">
                                {children}
                            </td>
                        );
                    },
                    tr({ children }) {
                        return (
                            <tr className="hover:bg-white/[0.01] transition-colors">
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
