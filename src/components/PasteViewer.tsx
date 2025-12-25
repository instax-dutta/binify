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
    Terminal as TerminalIcon,
    CheckCircle2,
    Code2,
    FileText,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
            console.error('Failed to copy:', err);
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto space-y-6 pb-20"
        >
            {/* Burn Warning */}
            {willBurn && (
                <div className="luxury-glass border-red-500/20 bg-red-500/[0.02] rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Flame size={18} className="text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Burn After Reading Enabled</h3>
                            <p className="text-xs text-white/40 font-medium">This content will be permanently purged from the server once you close this session.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Meta Header */}
            <div className="luxury-card space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                            <TerminalIcon size={12} />
                            Binary Output
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                            {title || 'Untitled Session'}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-white/30">
                            <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                <Clock size={14} className="text-white/20" />
                                {new Date(createdAt).toLocaleDateString()}
                            </div>
                            {expiresAt && (
                                <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                    <CheckCircle2 size={14} className="text-orange-500/50" />
                                    Purge in {timeLeft}
                                </div>
                            )}
                            {maxViews && (
                                <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                    <Eye size={14} className="text-blue-500/50" />
                                    Access {viewCount} / {maxViews}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                            className="btn-luxury-secondary text-xs h-12"
                        >
                            {viewMode === 'formatted' ? (
                                <span className="flex items-center gap-2">RAW DATA <ChevronRight size={14} /></span>
                            ) : (
                                <span className="flex items-center gap-2">FORMATTED <ChevronRight size={14} /></span>
                            )}
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className={cn("btn-luxury-secondary text-xs h-12 min-w-[100px]", copied && "text-accent border-accent/20 bg-accent/5")}
                        >
                            {copied ? (
                                <span className="flex items-center gap-2"><CheckCircle2 size={14} /> COPIED</span>
                            ) : (
                                <span className="flex items-center gap-2"><Copy size={14} /> COPY</span>
                            )}
                        </button>
                        <button onClick={downloadPaste} className="btn-luxury-secondary text-xs h-12">
                            <Download size={14} />
                        </button>
                    </div>
                </div>

                {language && language !== 'plaintext' && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Compiler</span>
                        <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase">
                            {language}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Canvas */}
            <div className="luxury-glass border-white/10 rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-10 bg-white/[0.03] border-b border-white/5 flex items-center px-4 gap-4">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-accent/20" />
                    </div>
                    <div className="text-[10px] font-bold text-white/10 tracking-widest uppercase flex items-center gap-2">
                        <FileText size={12} />
                        Binary Session Output
                    </div>
                </div>

                <div className="mt-10 p-0 overflow-x-auto selection:bg-accent/20 custom-scrollbar">
                    {viewMode === 'raw' ? (
                        <pre className="p-8 text-sm font-mono text-white/70 whitespace-pre-wrap break-words leading-relaxed">
                            {content}
                        </pre>
                    ) : language === 'markdown' ? (
                        <div className="prose prose-invert max-w-none p-8 text-white/80 overflow-x-auto">
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
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={cn("bg-white/10 px-1.5 py-0.5 rounded text-accent-secondary font-mono text-xs", className)} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    table({ children }) {
                                        return (
                                            <div className="overflow-x-auto my-8 luxury-glass rounded-xl border border-white/10">
                                                <table className="min-w-full divide-y divide-white/10">
                                                    {children}
                                                </table>
                                            </div>
                                        );
                                    },
                                    thead({ children }) {
                                        return <thead className="bg-white/[0.03] uppercase tracking-wider text-[10px] font-bold text-white/40">{children}</thead>;
                                    },
                                    th({ children }) {
                                        return <th className="px-6 py-4 text-left font-bold border-b border-white/5">{children}</th>;
                                    },
                                    td({ children }) {
                                        return <td className="px-6 py-4 text-sm border-b border-white/5 text-white/60">{children}</td>;
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
                                padding: '2rem',
                                background: 'transparent',
                                fontSize: '0.875rem',
                                lineHeight: '1.7',
                            }}
                            showLineNumbers
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: 'rgba(255,255,255,0.05)', textAlign: 'right' }}
                        >
                            {content}
                        </SyntaxHighlighter>
                    ) : (
                        <pre className="p-8 text-sm font-mono text-white/70 whitespace-pre-wrap break-words leading-relaxed">
                            {content}
                        </pre>
                    )}
                </div>
            </div>

            {/* View Page Footer */}
            <div className="pt-8 text-center">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white/20 hover:text-accent transition-all group tracking-widest uppercase"
                >
                    Initialize Own Secure Session
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </motion.div>
    );
}
