'use client';

import { useState, useRef } from 'react';
import { generateKey, encryptContent, generatePasteId } from '@/lib/crypto';
import type { ExpirationType } from '@/lib/validation';

interface PasteEditorProps {
    onPasteCreated: (pasteId: string, key: string) => void;
}

export default function PasteEditor({ onPasteCreated }: PasteEditorProps) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [password, setPassword] = useState('');
    const [expirationType, setExpirationType] = useState<ExpirationType>('1day');
    const [maxViews, setMaxViews] = useState(10);
    const [language, setLanguage] = useState('plaintext');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleCreate = async () => {
        if (!content.trim()) {
            setError('Content cannot be empty');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            // Generate encryption key
            const key = await generateKey();

            // Encrypt content
            const encrypted = await encryptContent(
                content,
                key,
                password || undefined
            );

            // Send to API
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

            // Call callback with paste ID and key
            onPasteCreated(data.pasteId, key);

            // Reset form
            setContent('');
            setTitle('');
            setPassword('');
            setExpirationType('1day');
            setLanguage('plaintext');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create paste');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-4">
            {/* Title */}
            <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                maxLength={200}
            />

            {/* Content */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    placeholder="Paste your content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="textarea min-h-[400px]"
                    spellCheck={false}
                />
                <div className="absolute bottom-3 right-3 text-xs text-text-tertiary">
                    {content.length.toLocaleString()} characters
                </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Expiration */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Expiration
                    </label>
                    <select
                        value={expirationType}
                        onChange={(e) => setExpirationType(e.target.value as ExpirationType)}
                        className="input"
                    >
                        <option value="5min">5 minutes</option>
                        <option value="1hour">1 hour</option>
                        <option value="1day">1 day</option>
                        <option value="7days">7 days</option>
                        <option value="30days">30 days</option>
                        <option value="never">Never</option>
                        <option value="views">After X views</option>
                        <option value="burn">Burn after reading</option>
                    </select>
                </div>

                {/* Max Views (conditional) */}
                {expirationType === 'views' && (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Max Views
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={maxViews}
                            onChange={(e) => setMaxViews(parseInt(e.target.value) || 1)}
                            className="input"
                        />
                    </div>
                )}

                {/* Language */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Language
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="input"
                    >
                        <option value="plaintext">Plain Text</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="swift">Swift</option>
                        <option value="kotlin">Kotlin</option>
                        <option value="sql">SQL</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="yaml">YAML</option>
                        <option value="markdown">Markdown</option>
                        <option value="bash">Bash</option>
                    </select>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Password (optional)
                    </label>
                    <input
                        type="password"
                        placeholder="Extra protection"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        autoComplete="new-password"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Create Button */}
            <button
                onClick={handleCreate}
                disabled={isCreating || !content.trim()}
                className="btn-primary w-full md:w-auto px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="spinner" />
                        Creating...
                    </span>
                ) : (
                    'Create Encrypted Paste'
                )}
            </button>

            {/* Security Notice */}
            <div className="bg-surface-secondary border border-border rounded-lg p-4 text-sm text-text-secondary">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                    <div>
                        <p className="font-medium text-text-primary mb-1">
                            Zero-Knowledge Encryption
                        </p>
                        <p>
                            Your content is encrypted in your browser before being sent to the
                            server. The encryption key is stored only in the URL and never
                            transmitted to the server. Without the key, your paste cannot be
                            decrypted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
