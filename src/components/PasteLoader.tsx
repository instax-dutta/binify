'use client';

import { useState, useEffect, useCallback } from 'react';
import { decryptContent, openSealed } from '@/lib/crypto';
import PasteViewer from '@/components/PasteViewer';
import { WaxSeal, WaxSealDefs } from '@/components/WaxSeal';
import Link from 'next/link';

interface PasteMeta {
    ciphertext: string;
    iv: string;
    authTag: string;
    salt?: string;
    iterations?: number;
    kdf?: 'argon2id';
    createdAt: number;
    expiresAt?: number;
    viewCount: number;
    maxViews?: number;
    hasPassword: boolean;
    language?: string;
    title?: string;
    finalView: boolean;
}

/**
 * Metadata to render, after preferring the authenticated copy.
 *
 * `title`, `language` and `expiresAt` arrive from the server as cleartext
 * columns and cannot be trusted on their own. When the decrypted envelope
 * carries them, those are authoritative, because the GCM tag would have failed
 * if the server had altered them.
 */
interface ResolvedMeta extends PasteMeta {
    authenticated: boolean;
}

interface PasteLoaderProps {
    pasteId: string;
}

export default function PasteLoader({ pasteId }: PasteLoaderProps) {

    const [content, setContent] = useState<string>('');
    const [metadata, setMetadata] = useState<ResolvedMeta | null>(null);
    const [password, setPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPaste = useCallback(async (passwordAttempt?: string) => {
        setIsLoading(true);
        setError('');

        try {
            const hash = window.location.hash.slice(1);
            if (!hash) {
                throw new Error('Encryption key not found in URL fragment. Decryption is impossible.');
            }

            const response = await fetch(`/api/paste/${pasteId}`);

            if (!response.ok) {
                // 404 covers unknown, expired, purged and exhausted alike. The
                // server deliberately does not say which, so neither do we.
                if (response.status === 404) throw new Error('This paste does not exist, or is no longer available.');
                throw new Error('Failed to synchronize with server.');
            }

            const data = await response.json();

            if (data.hasPassword && !passwordAttempt) {
                setNeedsPassword(true);
                setMetadata({ ...data, authenticated: false });
                setIsLoading(false);
                return;
            }

            const decrypted = await decryptContent(
                {
                    ciphertext: data.ciphertext,
                    iv: data.iv,
                    authTag: data.authTag,
                    salt: data.salt,
                    iterations: data.iterations,
                    kdf: data.kdf,
                },
                hash,
                passwordAttempt
            );

            const sealed = openSealed(decrypted);

            // Prefer the sealed fields; fall back to the server's copy only for
            // legacy pastes that predate the envelope.
            const resolved: ResolvedMeta = {
                ...data,
                title: sealed.title ?? data.title,
                language: sealed.language ?? data.language,
                expiresAt: sealed.expiresAt ?? data.expiresAt,
                maxViews: sealed.maxViews ?? data.maxViews,
                authenticated: sealed.title !== undefined || sealed.content !== decrypted,
            };

            setContent(sealed.content);
            setMetadata(resolved);
            setNeedsPassword(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cryptographic failure.');
        } finally {
            setIsLoading(false);
        }
    }, [pasteId]);

    useEffect(() => {
        void loadPaste();
    }, [loadPaste]);

    const handlePasswordSubmit = () => {
        if (password) loadPaste(password);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="flex flex-col items-center gap-6 anim-fade" aria-live="polite">
                    <span
                        className="ember-pulse h-[6px] w-[76px] rounded-[3px]"
                        style={{ background: 'linear-gradient(180deg,#c9a25a,#a4762f)', boxShadow: '0 0 14px rgba(201,162,90,.55)' }}
                        aria-hidden="true"
                    />
                    <p className="rune-muted">Decryption is worked by hand — a moment</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div
                    role="alert"
                    className="anim-rise text-center px-6"
                >
                    <div className="w-[74px] h-[74px] mx-auto mb-7 rounded-full grid place-items-center"
                        style={{ border: '1px solid rgba(122,46,42,.5)', boxShadow: '0 0 40px rgba(122,46,42,.15) inset' }}>
                        {/* the broken sigil: a key with a snapped stem */}
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a4463f" strokeWidth="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="8" cy="8" r="4.2" />
                            <path d="M11 11 L15 15" />
                            <path d="M14.4 18.6 L18.8 14.2" />
                            <path d="M16.2 13.4 L14 11" />
                        </svg>
                    </div>
                    <h2 className="font-voice font-semibold text-[24px]">The slip could not be opened</h2>
                    <p className="rune-muted mt-3 leading-[1.9] px-2" style={{ fontSize: '11.5px', letterSpacing: '.18em' }}>
                        {error.toUpperCase()}
                    </p>
                    <Link href="/" className="ghost inline-block mt-8 text-[10px]">
                        RETURN TO THE NIGHT FOOTPATH
                    </Link>
                </div>
            </div>
        );
    }

    if (needsPassword) {
        return (
            <div className="min-h-screen grid place-items-center">
                <WaxSealDefs />
                <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}
                    className="slip px-7 py-9 anim-rise max-w-[420px] w-[88vw]"
                >
                    <p className="rune text-center tracking-[0.4em] mb-6">A GUARDED SLIP</p>
                    <h2 className="font-voice italic font-medium text-center text-[20px] leading-[1.55]" style={{ color: 'var(--ink)' }}>
                        This slip answers only to the keeper&apos;s word. Speak it below.
                    </h2>
                    <div className="slip-rule" />
                    <label htmlFor="guard-authority" className="rune block mb-2">The word</label>
                    <input
                        id="guard-authority"
                        type="password"
                        placeholder="What was agreed"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="paper-input font-data text-[13px] text-center"
                        autoFocus
                        autoComplete="off"
                    />
                    <div className="seal-zone flex flex-col items-center gap-3 mt-8">
                        <button type="submit" aria-label="Decrypt with this word" className="seal-press">
                            <span className="sr-only">UNLOCK</span>
                            <WaxSeal size={64} />
                        </button>
                        <span className="rune text-[11px]" style={{ color: 'var(--ink)' }}>SPEAK THE WORD</span>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                <Link href="/" className="rune-muted tracking-[0.32em] hover:text-amber">
                    THE <span style={{ color: 'var(--amber)' }}>BURN</span> ARCHIVE
                </Link>
                <span className="rune-muted text-[10px]">OPENED AT YOUR HAND</span>
            </nav>

            <div className="px-6 pt-6 grid place-items-center">
                <PasteViewer
                    content={content}
                    language={metadata?.language}
                    title={metadata?.title}
                    createdAt={metadata?.createdAt ?? 0}
                    expiresAt={metadata?.expiresAt}
                    viewCount={metadata?.viewCount ?? 0}
                    maxViews={metadata?.maxViews}
                    willBurn={metadata?.finalView ?? false}
                />
            </div>
        </div>
    );
}
