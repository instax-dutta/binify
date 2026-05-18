'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import {
    Copy,
    Download,
    Flame,
    Clock,
    Eye,
    Terminal,
    CheckCircle2,
    FileText,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logging';

interface PasteViewerProps {
    content: string;
    language?: string;
    title?: string;
    createdAt: number;
    expiresAt?: number;
    viewCount: number;
    maxViews?: number;
    willBurn: boolean;
}

export default function PasteViewer({
    content,
    language = 'plaintext',
    title,
    createdAt,
    expiresAt,
    viewCount,
    maxViews,
    willBurn,
}: PasteViewerProps) {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!expiresAt) return;

        const updateTimeLeft = () => {
            const now = Date.now();
            const diff = expiresAt - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) setTimeLeft(`${days}d ${hours}h`);
            else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
            else if (minutes > 0) setTimeLeft(`${minutes}m ${seconds}s`);
            else setTimeLeft(`${seconds}s`);
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            logger.error('Failed to copy:', err);
        }
    };

    const downloadPaste = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt` : 'binify_paste.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto space-y-5 pb-16"
        >
            {/* Burn Warning */}
            {willBurn && (
                <div className="bg-[#f3727f]/5 border border-[#f3727f]/15 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f3727f]/15 flex items-center justify-center shrink-0">
                            <Flame size={14} className="text-[#f3727f] animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white uppercase tracking-[0.05em]">Burn after reading</p>
                            <p className="text-xs text-[#b3b3b3]">This content will self-destruct after this session.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Meta Header */}
            <div className="bg-[#181818] rounded-lg p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                    <div className="space-y-3">
                        <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#1ed760] flex items-center gap-2">
                            <Terminal size={12} />
                            PAYLOAD
                        </div>
                        <h1 className="title-lg text-white break-words max-w-2xl">
                            {title || 'Untitled'}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-[#b3b3b3] bg-white/[0.03] px-2.5 py-1 rounded-[9999px]">
                                <Clock size={11} />
                                {new Date(createdAt).toLocaleDateString()}
                            </span>
                            {expiresAt && (
                                <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-[#b3b3b3] bg-white/[0.03] px-2.5 py-1 rounded-[9999px]">
                                    <CheckCircle2 size={11} className="text-[#ffa42b]" />
                                    {timeLeft}
                                </span>
                            )}
                            {maxViews && (
                                <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-[#b3b3b3] bg-white/[0.03] px-2.5 py-1 rounded-[9999px]">
                                    <Eye size={11} />
                                    {viewCount} / {maxViews}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                            className="btn-spotify-secondary text-[0.625rem] tracking-[0.05em] h-9"
                        >
                            {viewMode === 'formatted' ? 'RAW' : 'FORMATTED'}
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className={cn("btn-spotify-secondary text-[0.625rem] tracking-[0.05em] h-9", copied && "!text-[#1ed760]")}
                        >
                            {copied ? (
                                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> COPIED</span>
                            ) : (
                                <span className="flex items-center gap-1.5"><Copy size={12} /> COPY</span>
                            )}
                        </button>
                        <button onClick={downloadPaste} className="btn-spotify-secondary h-9 px-3">
                            <Download size={14} />
                        </button>
                    </div>
                </div>

                {language && language !== 'plaintext' && (
                    <div className="flex items-center gap-3">
                        <span className="text-[0.5rem] font-bold uppercase tracking-[0.15em] text-white/20">LANG</span>
                        <span className="badge-spotify bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20">
                            {language}
                        </span>
                    </div>
                )}

                <div className="flex justify-end">
                    <a href="/revoke" className="text-[0.5rem] font-bold text-white/10 hover:text-[#ffa42b]/60 transition-colors uppercase tracking-[0.15em] flex items-center gap-1">
                        <AlertTriangle size={8} />
                        Revoke
                    </a>
                </div>
            </div>

            {/* Content Canvas */}
            <div className="bg-[#181818] rounded-lg overflow-hidden border border-white/5">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1f1f1f] border-b border-white/5">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f3727f]/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffa42b]/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1ed760]/60" />
                    </div>
                    <span className="text-[0.625rem] font-bold text-white/10 uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <FileText size={11} />
                        OUTPUT
                    </span>
                </div>

                <div
                    className="p-0 overflow-y-auto overflow-x-auto selection:bg-[#1ed760]/20 custom-scrollbar h-[650px]"
                    data-lenis-prevent="true"
                >
                    {viewMode === 'raw' ? (
                        <pre className="p-6 text-sm font-mono text-white/60 whitespace-pre-wrap break-words leading-relaxed">
                            {content}
                        </pre>
                    ) : language === 'markdown' ? (
                        <div className="prose prose-invert max-w-none p-6 text-white/80 overflow-x-auto"
                            style={{ '--tw-prose-pre-bg': 'transparent' } as React.CSSProperties}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeSanitize]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    padding: '1.5rem',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-[#539df5] font-mono text-xs", className)} {...props}>
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
                                        return <th className="px-5 py-3 text-left text-[0.625rem] font-bold uppercase tracking-[0.1em] text-white/40 border-b border-white/5">{children}</th>;
                                    },
                                    td({ children }) {
                                        return <td className="px-5 py-3 text-sm border-b border-white/5 text-white/60">{children}</td>;
                                    },
                                    tr({ children }) {
                                        return <tr className="hover:bg-white/[0.01] transition-colors">{children}</tr>;
                                    },
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : language && language !== 'plaintext' ? (
                        <SyntaxHighlighter
                            language={language.toLowerCase()}
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                padding: '1.5rem',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                lineHeight: '1.7',
                            }}
                            showLineNumbers
                            lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: 'rgba(255,255,255,0.05)', textAlign: 'right' }}
                        >
                            {content}
                        </SyntaxHighlighter>
                    ) : (
                        <pre className="p-6 text-sm font-mono text-white/60 whitespace-pre-wrap break-words leading-relaxed">
                            {content}
                        </pre>
                    )}
                </div>
            </div>

            <div className="pt-6 text-center">
                <a
                    href="/"
                    className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-white/20 hover:text-[#1ed760] transition-colors uppercase tracking-[0.15em]"
                >
                    ENCRYPT NEW PAYLOAD
                    <ChevronRight size={12} />
                </a>
            </div>
        </motion.div>
    );
}
