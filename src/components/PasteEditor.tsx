'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Clock,
    Eye,
    Flame,
    Lock,
    FileCode,
    ChevronDown,
    Loader2
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
    onPasteCreated: (pasteId: string, key: string) => void;
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

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

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
            onPasteCreated(data.pasteId, key);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create paste');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl mx-auto space-y-8"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-8">
                {/* Title Input */}
                <motion.div variants={itemVariants} className="relative group">
                    <input
                        type="text"
                        placeholder="Give your paste a title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="luxury-input text-lg font-medium py-4 px-6 border-white/10 group-focus-within:border-accent/30 transition-all"
                        maxLength={200}
                        autoComplete="off"
                    />
                </motion.div>

                {/* Content Editor */}
                <motion.div variants={itemVariants} className="relative rounded-2xl luxury-glass overflow-hidden group border-white/10 focus-within:border-accent/20 transition-all">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                                <FileCode size={14} />
                                <span>{viewMode === 'edit' ? 'EDITOR' : 'PREVIEW'}</span>
                            </div>

                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                        viewMode === 'edit' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    EDIT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                        viewMode === 'preview' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
                                    )}
                                >
                                    PREVIEW
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            <span>{content.length.toLocaleString()} CHARS</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        </div>
                    </div>

                    <div className="relative min-h-[500px]">
                        {viewMode === 'edit' ? (
                            <textarea
                                placeholder="Paste your code or text here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="luxury-textarea custom-scrollbar w-full min-h-[500px] border-none bg-transparent px-6 py-6 focus:ring-0 text-white/90 selection:bg-accent/20"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="p-0 overflow-x-auto selection:bg-accent/20 custom-scrollbar min-h-[500px]">
                                {language === 'markdown' ? (
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
                                            {content || '*Nothing to preview...*'}
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
                                        {content || '// Nothing to preview...'}
                                    </SyntaxHighlighter>
                                ) : (
                                    <pre className="p-8 text-sm font-mono text-white/70 whitespace-pre-wrap break-words leading-relaxed">
                                        {content || 'Nothing to preview...'}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Options Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Expiration */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                            <Clock size={12} /> Expiration
                        </label>
                        <LuxurySelect
                            options={expirationOptions}
                            value={expirationType}
                            onChange={(val) => setExpirationType(val as ExpirationType)}
                        />
                    </div>

                    {/* Dynamic Max Views / Language */}
                    {expirationType === 'views' ? (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                                <Eye size={12} /> Max Views
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={maxViews}
                                onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                                className="luxury-input"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                                <FileCode size={12} /> Language
                            </label>
                            <LuxurySelect
                                options={languageOptions}
                                value={language}
                                onChange={(val) => setLanguage(val)}
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                            <Lock size={12} /> Encryption Key/Password
                        </label>
                        <input
                            type="password"
                            placeholder="Extra layer of security..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="luxury-input"
                            autoComplete="new-password"
                        />
                    </div>
                </motion.div>

                {/* Error State */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer / Create Button */}
                <motion.div variants={itemVariants} className="pt-4 flex flex-col md:flex-row items-center gap-6">
                    <button
                        type="submit"
                        disabled={isCreating || !content.trim()}
                        className="btn-luxury-primary group w-full md:w-auto min-w-[240px] py-4 disabled:opacity-30 disabled:cursor-not-allowed overflow-visible"
                    >
                        {isCreating ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <Flame size={20} className="text-orange-500 group-hover:scale-125 transition-transform" />
                                <span>Initialize Binify Paste</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-3 text-white/30 text-xs">
                        <ShieldCheck size={18} className="text-accent" />
                        <span className="flex-1">Encryption happens locally. No keys reach the server.</span>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
}
