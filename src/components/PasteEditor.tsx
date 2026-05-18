'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Eye,
    Flame,
    Lock,
    FileCode,
    Loader2,
    Check,
    Terminal
} from 'lucide-react';
import { generateKey, encryptContent } from '@/lib/crypto';
import type { ExpirationType } from '@/lib/validation';
import { cn } from '@/lib/utils';

import LuxurySelect from './LuxurySelect';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface PasteEditorProps {
    onPasteCreated: (pasteId: string, key: string, deletionToken?: string) => void;
}

const expirationOptions = [
    { label: '5 minutes', value: '5min' },
    { label: '1 hour', value: '1hour' },
    { label: '1 day', value: '1day' },
    { label: '7 days', value: '7days' },
    { label: '30 days', value: '30days' },
    { label: 'Never', value: 'never' },
    { label: 'After X views', value: 'views' },
    { label: 'Burn after reading', value: 'burn' },
];

const languageOptions = [
    { label: 'Plain Text', value: 'plaintext' },
    { label: 'Bash', value: 'bash' },
    { label: 'C', value: 'c' },
    { label: 'C#', value: 'csharp' },
    { label: 'C++', value: 'cpp' },
    { label: 'CSS', value: 'css' },
    { label: 'Dockerfile', value: 'dockerfile' },
    { label: 'Go', value: 'go' },
    { label: 'HTML', value: 'html' },
    { label: 'Java', value: 'java' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'JSON', value: 'json' },
    { label: 'Kotlin', value: 'kotlin' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'PHP', value: 'php' },
    { label: 'Python', value: 'python' },
    { label: 'Ruby', value: 'ruby' },
    { label: 'Rust', value: 'rust' },
    { label: 'SQL', value: 'sql' },
    { label: 'Swift', value: 'swift' },
    { label: 'TOML', value: 'toml' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'YAML', value: 'yaml' },
];

export default function PasteEditor({ onPasteCreated }: PasteEditorProps) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [password, setPassword] = useState('');
    const [expirationType, setExpirationType] = useState<ExpirationType>('1day');
    const [maxViews, setMaxViews] = useState(10);
    const [language, setLanguage] = useState('plaintext');
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!content.trim()) {
            setError('Content cannot be empty');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const key = await generateKey();
            const encrypted = await encryptContent(content, key, password || undefined);

            const response = await fetch('/api/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ciphertext: encrypted.ciphertext,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag,
                    salt: encrypted.salt,
                    iterations: encrypted.iterations,
                    expirationType,
                    maxViews: expirationType === 'views' ? maxViews : undefined,
                    hasPassword: !!password,
                    language: language !== 'plaintext' ? language : undefined,
                    title: title || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create paste');
            }

            const data = await response.json();
            onPasteCreated(data.pasteId, key, data.deletionToken);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create paste');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-6">
                {/* Title Input */}
                <div>
                    <input
                        type="text"
                        placeholder="Give your paste a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-spotify text-base py-3.5"
                        maxLength={200}
                        autoComplete="off"
                        aria-label="Paste Title"
                    />
                </div>

                {/* Content Editor */}
                <div className="bg-[#181818] rounded-lg overflow-hidden border border-white/5">
                    {/* Editor toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1f1f1f] border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#f3727f]/60 group-hover:bg-[#f3727f] transition-colors" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#ffa42b]/60 group-hover:bg-[#ffa42b] transition-colors" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1ed760]/60 group-hover:bg-[#1ed760] transition-colors" />
                            </div>
                            <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-white/20">
                                {viewMode === 'edit' ? 'EDITOR' : 'PREVIEW'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-[#121212] rounded-[9999px] p-0.5 border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    aria-pressed={viewMode === 'edit'}
                                    className={cn(
                                        "px-3 py-1 text-[0.625rem] font-bold rounded-[9999px] transition-all uppercase tracking-[0.05em]",
                                        viewMode === 'edit' ? "bg-[#1f1f1f] text-white" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    EDIT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    aria-pressed={viewMode === 'preview'}
                                    className={cn(
                                        "px-3 py-1 text-[0.625rem] font-bold rounded-[9999px] transition-all uppercase tracking-[0.05em]",
                                        viewMode === 'preview' ? "bg-[#1f1f1f] text-white" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    PREVIEW
                                </button>
                            </div>
                            <span className="text-[0.625rem] font-bold text-white/20 uppercase tracking-[0.1em]">
                                {content.length.toLocaleString()} CHARS
                            </span>
                        </div>
                    </div>

                    {/* Editor body */}
                    <div className="relative min-h-[500px]">
                        {viewMode === 'edit' ? (
                            <textarea
                                placeholder="Paste your code or text here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="textarea-spotify w-full h-[650px] overflow-y-auto custom-scrollbar px-5 py-5 text-white/80 selection:bg-[#1ed760]/20"
                                spellCheck={false}
                                data-lenis-prevent="true"
                                aria-label="Editor Content"
                            />
                        ) : (
                            <div
                                className="p-0 overflow-y-auto overflow-x-auto selection:bg-[#1ed760]/20 custom-scrollbar h-[650px]"
                                data-lenis-prevent="true"
                            >
                                {language === 'markdown' ? (
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
                                            {content || '*Nothing to preview...*'}
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
                                        {content || '// Nothing to preview...'}
                                    </SyntaxHighlighter>
                                ) : (
                                    <pre className="p-6 text-sm font-mono text-white/60 whitespace-pre-wrap break-words leading-relaxed">
                                        {content || 'Nothing to preview...'}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="expiration-select" className="label-spotify">
                            <Clock size={12} /> Expiration
                        </label>
                        <LuxurySelect
                            id="expiration-select"
                            options={expirationOptions}
                            value={expirationType}
                            onChange={(val) => setExpirationType(val as ExpirationType)}
                        />
                    </div>

                    {expirationType === 'views' ? (
                        <div className="space-y-1.5">
                            <label htmlFor="max-views-input" className="label-spotify">
                                <Eye size={12} /> Max Views
                            </label>
                            <input
                                id="max-views-input"
                                type="number"
                                min={1}
                                max={1000}
                                value={maxViews}
                                onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                                className="input-spotify"
                            />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label htmlFor="language-select" className="label-spotify">
                                <FileCode size={12} /> Language
                            </label>
                            <LuxurySelect
                                id="language-select"
                                options={languageOptions}
                                value={language}
                                onChange={(val) => setLanguage(val)}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="password-input" className="label-spotify">
                            <Lock size={12} /> Password
                        </label>
                        <input
                            id="password-input"
                            type="password"
                            placeholder="Extra layer of security..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-spotify"
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#f3727f]/10 border border-[#f3727f]/20 text-[#f3727f] px-4 py-3 rounded-lg text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pt-2">
                    <button
                        type="submit"
                        disabled={isCreating || !content.trim()}
                        className="btn-spotify-primary min-w-[200px] h-12 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <Terminal size={16} />
                                <span>ENCRYPT & SHARE</span>
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-[#b3b3b3]">
                        <Check size={14} className="text-[#1ed760]" />
                        <span>Encrypted in-browser before upload</span>
                    </div>
                </div>
            </form>
        </div>
    );
}
