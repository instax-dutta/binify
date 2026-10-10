'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ContentCanvas from './ContentCanvas';
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
                setTimeLeft('due to return to ash');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            if (days > 0) setTimeLeft(`burns in ${days}d ${hours}h`);
            else if (hours > 0) setTimeLeft(`burns in ${hours}h ${minutes}m`);
            else if (minutes > 0) setTimeLeft(`burns in ${minutes}m ${seconds}s`);
            else setTimeLeft(`burns in ${seconds}s`);
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            void err;
        }
    };

    const readsLeft = maxViews
        ? Math.max(0, maxViews - viewCount)
        : undefined;
    // The ember row for an uncounted slip shows four of four embers burning.
    const emberCount = maxViews
        ? Math.min(6, Math.max(2, Math.round((readsLeft ?? 0) / maxViews * 6)))
        : 4;

    return (
        <div className="w-full max-w-[640px] mx-auto">
            <div className="slip px-7 py-8 md:px-9 anim-rise">
                <p className="rune text-center tracking-[0.4em] text-[11px] mb-6">
                    {willBurn ? 'THIS READING BURNS IT' : 'ONE READING · THIS SLIP'}
                </p>

                {title && (
                    <>
                        <h1 className="font-voice font-semibold text-center text-[27px] leading-tight">
                            {title}
                        </h1>
                        <div className="slip-rule" />
                    </>
                )}

                <div
                    className={cn(
                        'relative font-data',
                        language === 'plaintext'
                            ? 'text-[14.5px] leading-[1.75]'
                            : 'text-[13.5px] leading-[1.7]'
                    )}
                    style={{ color: 'var(--ink)' }}
                >
                    <ContentCanvas
                        content={content}
                        language={language}
                        forceRaw={viewMode === 'raw'}
                    />
                </div>

                <div className="slip-rule" />

                {/* The ember line: time and readings drawn as a visible quantity. */}
                <div className="flex flex-wrap items-center justify-between gap-y-3">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-[5px]" aria-hidden="true">
                            {Array.from({ length: maxViews ? 6 : 4 }).map((_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'ember-pulse h-[5px] w-[14px] rounded-[2px] transition-colors',
                                        i < (maxViews ? emberCount : 4) ? '' : 'opacity-40'
                                    )}
                                    style={
                                        i < (maxViews ? emberCount : 4)
                                            ? { background: 'linear-gradient(180deg,#c9a25a,#a4762f)', boxShadow: '0 0 6px rgba(201,162,90,.55)' }
                                            : { background: 'rgba(43,36,26,.18)' }
                                    }
                                />
                            ))}
                        </span>
                        <span className="rune text-[11px]" style={{ color: 'var(--ink-soft)' }} aria-live="polite">
                            {timeLeft
                                ? timeLeft.toUpperCase()
                                : readsLeft !== undefined
                                    ? `${readsLeft} READING${readsLeft === 1 ? '' : 'S'} REMAIN`
                                    : 'HELD FOR YOU ALONE'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {language !== 'plaintext' && (
                            <div className="flex gap-3" role="group" aria-label="Payload view">
                                <button
                                    type="button"
                                    aria-pressed={viewMode === 'formatted'}
                                    onClick={() => setViewMode('formatted')}
                                    className={cn('rune text-[10px] pb-0.5 transition-colors', viewMode === 'formatted' ? 'text-wax border-b border-wax' : 'opacity-60')}
                                >
                                    PROOF
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={viewMode === 'raw'}
                                    onClick={() => setViewMode('raw')}
                                    className={cn('rune text-[10px] pb-0.5 transition-colors', viewMode === 'raw' ? 'text-wax border-b border-wax' : 'opacity-60')}
                                >
                                    RAW
                                </button>
                            </div>
                        )}
                        <button type="button" className="rune text-[10px] pb-0.5 transition-colors hover:text-wax" onClick={copyMessage} aria-live="polite">
                            {copied ? 'COPIED' : 'COPY THE MESSAGE'}
                        </button>
                    </div>
                </div>
            </div>

            <p className="rune-muted text-center mt-6 text-[10.5px]">
                HOLD THE BURN SLIP?{' '}
                <Link href="/revoke" className="underline underline-offset-4 hover:text-amber" style={{ color: '#a4463f' }}>
                    RECALL IT AT THE DESK
                </Link>
            </p>
        </div>
    );
}
