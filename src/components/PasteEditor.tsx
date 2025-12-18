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
    Sparkles,
    Loader2
} from 'lucide-react';
import { generateKey, encryptContent } from '@/lib/crypto';
import type { ExpirationType } from '@/lib/validation';
import { cn } from '@/lib/utils';

import LuxurySelect from './LuxurySelect';

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
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'SQL', value: 'sql' },
    { label: 'Bash', value: 'bash' },
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent/50 transition-colors">
                        <Sparkles size={20} />
                    </div>
                </motion.div>

                {/* Content Editor */}
                <motion.div variants={itemVariants} className="relative rounded-2xl luxury-glass overflow-hidden group border-white/10 focus-within:border-accent/20 transition-all">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                            <FileCode size={14} />
                            <span>EDITOR</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            <span>{content.length.toLocaleString()} CHARS</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        </div>
                    </div>

                    <textarea
                        placeholder="Paste your code or text here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="luxury-textarea custom-scrollbar w-full min-h-[500px] border-none bg-transparent px-6 py-6 focus:ring-0 text-white/90 selection:bg-accent/20"
                        spellCheck={false}
                    />
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
