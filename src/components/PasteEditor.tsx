'use client';

import { useState } from 'react';
import { generateKey, encryptContent, sealPaste } from '@/lib/crypto';
import { calculateExpiration, type ExpirationType } from '@/lib/validation';
import { cn } from '@/lib/utils';
import ContentCanvas from './ContentCanvas';
import LuxurySelect from './LuxurySelect';
import { WaxSeal, WaxSealDefs } from './WaxSeal';

interface PasteEditorProps {
    onPasteCreated: (pasteId: string, key: string, deletionToken?: string) => void;
}

const expirationOptions = [
    { label: 'In 5 minutes', value: '5min' },
    { label: 'In an hour', value: '1hour' },
    { label: 'In a day', value: '1day' },
    { label: 'In seven days', value: '7days' },
    { label: 'In thirty days', value: '30days' },
    { label: 'On my word', value: 'never' },
    { label: 'After X readings', value: 'views' },
    { label: 'On first reading', value: 'burn' },
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
            setError('The message cannot be empty');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const key = await generateKey();

            // Seal the descriptive fields inside the ciphertext so the GCM tag
            // authenticates them. The server still receives title/language for
            // indexing, but the values the client renders come from the
            // authenticated copy, not from whatever the server chose to send.
            const payload = sealPaste({
                content,
                title: title || undefined,
                language: language !== 'plaintext' ? language : undefined,
                expiresAt: calculateExpiration(expirationType),
                maxViews: expirationType === 'views' ? maxViews : expirationType === 'burn' ? 1 : undefined,
            });

            const encrypted = await encryptContent(payload, key, password || undefined);

            const response = await fetch('/api/paste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ciphertext: encrypted.ciphertext,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag,
                    salt: encrypted.salt,
                    iterations: encrypted.iterations,
                    kdf: encrypted.kdf,
                    expirationType,
                    maxViews: expirationType === 'views' ? maxViews : undefined,
                    hasPassword: !!password,
                    language: language !== 'plaintext' ? language : undefined,
                    title: title || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'The slip could not be sealed');
            }

            const data = await response.json();
            onPasteCreated(data.pasteId, key, data.deletionToken);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The slip could not be sealed');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full max-w-[460px] mx-auto">
            <WaxSealDefs />
            <form
                onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                className="slip px-7 py-8 md:px-8 anim-rise"
            >
                <p className="rune text-center tracking-[0.4em] text-[11px] mb-7">
                    WHAT MUST NOT PERSIST
                </p>

                <label htmlFor="paste-title" className="rune block mb-2">Name</label>
                <input
                    id="paste-title"
                    type="text"
                    placeholder="Give this slip a title — or leave it nameless"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="paper-input font-voice font-medium text-[20px]"
                    maxLength={200}
                    autoComplete="off"
                />

                {/* The message area is a single white field on the slip: the
                    voice carries prose, the data hand carries code. */}
                <label htmlFor="editor-content" className="rune block mt-6 mb-2">The message</label>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-3" role="tablist" aria-label="Message view">
                        <button
                            type="button"
                            onClick={() => setViewMode('edit')}
                            aria-pressed={viewMode === 'edit'}
                            className={cn(
                                'rune pb-1 transition-colors',
                                viewMode === 'edit'
                                    ? 'text-wax border-b border-wax'
                                    : 'opacity-60 hover:opacity-90'
                            )}
                        >
                            Write
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('preview')}
                            aria-pressed={viewMode === 'preview'}
                            className={cn(
                                'rune pb-1 transition-colors',
                                viewMode === 'preview'
                                    ? 'text-wax border-b border-wax'
                                    : 'opacity-60 hover:opacity-90'
                            )}
                        >
                            Proof
                        </button>
                    </div>
                    <span className="rune" aria-live="polite">
                        {content.length.toLocaleString()} CHARS
                    </span>
                </div>

                <div className="relative min-h-[300px]">
                    {viewMode === 'edit' ? (
                        <textarea
                            id="editor-content"
                            placeholder="Say what must not be kept…"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="paper-input border-0 font-voice font-medium text-[19px] leading-[1.55] w-full min-h-[280px] resize-none custom-scrollbar"
                            spellCheck={false}
                        />
                    ) : (
                        <div className="min-h-[280px] max-h-[420px] overflow-y-auto overflow-x-auto custom-scrollbar">
                            <ContentCanvas
                                content={content}
                                language={language}
                                emptyPreview={
                                    language === 'markdown'
                                        ? 'Nothing to prove yet.'
                                        : '// nothing to prove yet'
                                }
                            />
                        </div>
                    )}
                </div>

                <div className="slip-rule" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                    <div>
                        <label htmlFor="expiration-select" className="rune block mb-2">Burns</label>
                        <LuxurySelect
                            id="expiration-select"
                            options={expirationOptions}
                            value={expirationType}
                            onChange={(val) => setExpirationType(val as ExpirationType)}
                        />
                    </div>

                    {expirationType === 'views' ? (
                        <div>
                            <label htmlFor="max-views-input" className="rune block mb-2">Readings</label>
                            <input
                                id="max-views-input"
                                type="number"
                                min={1}
                                max={1000}
                                value={maxViews}
                                aria-label="Maximum number of readings"
                                onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                                className="paper-input font-data text-xs"
                            />
                        </div>
                    ) : null}
                    {expirationType !== 'views' ? (
                        <div>
                            <label htmlFor="language-select" className="rune block mb-2">The hand</label>
                            <LuxurySelect
                                id="language-select"
                                options={languageOptions}
                                value={language}
                                onChange={(val) => setLanguage(val)}
                            />
                        </div>
                    ) : null}

                    <div>
                        <label htmlFor="guard-input" className="rune block mb-2">Guard</label>
                        <input
                            id="guard-input"
                            type="password"
                            placeholder="Optional word"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="paper-input font-data text-xs"
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="anim-fade mt-6 text-center font-voice italic text-[17px]" style={{ color: '#a4463f' }}>
                        {error}
                    </p>
                )}

                <div className="seal-zone flex flex-col items-center gap-3 mt-8">
                    <button
                        type="submit"
                        disabled={isCreating || !content.trim()}
                        aria-label="Press the seal to encrypt and share"
                        className="seal-press"
                    >
                        <span className="sr-only">Encrypt and share</span>
                        <WaxSeal
                            size={72}
                            className={cn('transition-transform', isCreating && 'press-depressed spin-slow')}
                        />
                    </button>
                    <span className="rune text-ink tracking-[0.32em]" style={{ color: 'var(--ink)' }}>
                        {isCreating ? 'SEALING…' : 'PRESS THE SEAL'}
                    </span>
                    <span className="rune text-[10px] opacity-70">
                        ONE READING · THE SERVER HOLDS NOISE
                    </span>
                </div>
            </form>
            <p className="rune-muted text-center mt-6 text-[10.5px]">
                THE BURN ARCHIVE — WHAT LEAVES THIS MACHINE IS NOISE
            </p>
        </div>
    );
}
