'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { decryptContent } from '@/lib/crypto';
import PasteViewer from '@/components/PasteViewer';

export default function ViewPastePage() {
    const params = useParams();
    const pasteId = params.id as string;

    const [content, setContent] = useState<string>('');
    const [metadata, setMetadata] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPaste();
    }, [pasteId]);

    const loadPaste = async (passwordAttempt?: string) => {
        setIsLoading(true);
        setError('');

        try {
            // Get encryption key from URL fragment
            const hash = window.location.hash.slice(1);
            if (!hash) {
                throw new Error('Encryption key not found in URL');
            }

            // Fetch encrypted paste
            const response = await fetch(`/api/paste/${pasteId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Paste not found');
                } else if (response.status === 410) {
                    throw new Error('This paste has expired or been deleted');
                } else {
                    throw new Error('Failed to load paste');
                }
            }

            const data = await response.json();

            // Check if password is required
            if (data.hasPassword && !passwordAttempt) {
                setNeedsPassword(true);
                setMetadata(data);
                setIsLoading(false);
                return;
            }

            // Decrypt content
            const decrypted = await decryptContent(
                {
                    ciphertext: data.ciphertext,
                    iv: data.iv,
                    authTag: data.authTag,
                    salt: data.salt,
                },
                hash,
                passwordAttempt
            );

            setContent(decrypted);
            setMetadata(data);
            setNeedsPassword(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load paste');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            loadPaste(password);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="spinner w-12 h-12 mx-auto" />
                    <p className="text-text-secondary">Decrypting paste...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="card text-center space-y-4">
                        <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto">
                            <svg
                                className="w-8 h-8 text-accent-red"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">Error</h2>
                        <p className="text-text-secondary">{error}</p>
                        <a href="/" className="btn-primary inline-block">
                            Create New Paste
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (needsPassword) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="card space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-accent-blue"
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
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">
                                Password Required
                            </h2>
                            <p className="text-text-secondary">
                                This paste is password-protected. Enter the password to decrypt
                                and view the content.
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                autoFocus
                                autoComplete="off"
                            />
                            <button type="submit" className="btn-primary w-full">
                                Decrypt Paste
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-4 py-6">
                    <a href="/" className="inline-block">
                        <h1 className="text-2xl font-bold text-gradient">Binify</h1>
                    </a>
                </div>
            </header>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <PasteViewer
                    content={content}
                    language={metadata?.language}
                    title={metadata?.title}
                    createdAt={metadata?.createdAt}
                    expiresAt={metadata?.expiresAt}
                    viewCount={metadata?.viewCount}
                    maxViews={metadata?.maxViews}
                    willBurn={metadata?.willBurn}
                />
            </div>
        </div>
    );
}
