'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * The burn-slip desk. The keeper presents a paste address and the one-time slip
 * that was issued with it, then recalls the paste or rotates its address.
 * Contract: role="alert" on the error line.
 */
export default function RevokePage() {
    const [inputValue, setInputValue] = useState('');
    const [token, setToken] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [rotatedId, setRotatedId] = useState('');

    const extractPasteId = (input: string) => {
        const trimmed = input.trim();
        try {
            const url = new URL(trimmed);
            const pathParts = url.pathname.split('/');
            const pIndex = pathParts.indexOf('p');
            if (pIndex !== -1 && pathParts[pIndex + 1]) {
                return pathParts[pIndex + 1];
            }
            return trimmed;
        } catch {
            return trimmed;
        }
    };

    const handleRevoke = async () => {
        const id = extractPasteId(inputValue);
        if (!id || !token) {
            setStatus('error');
            setMessage('The address and the burn slip are both required.');
            return;
        }
        setIsProcessing(true);
        setStatus('idle');
        setMessage('');
        try {
            const response = await fetch(`/api/paste/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
            });

            let data: { error?: string; newId?: string } = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || 'Recall failed. Present the address and slip again.');
            }

            setStatus('success');
            setMessage('The paste has been recalled and purged. Nothing remains.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'The recall failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = async () => {
        const id = extractPasteId(inputValue);
        if (!id || !token) {
            setStatus('error');
            setMessage('The address and the burn slip are both required.');
            return;
        }
        setIsProcessing(true);
        setStatus('idle');
        setMessage('');
        try {
            const response = await fetch(`/api/paste/${encodeURIComponent(id)}/rotate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            let data: { error?: string; newId?: string } = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || 'Rotation failed. Present the address and slip again.');
            }
            setStatus('success');
            setMessage('A new address has been cut. The old one no longer answers.');
            if (data.newId) setRotatedId(data.newId);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'The rotation failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen px-5 pb-24">
            <nav className="flex items-center justify-between px-1 md:px-5 py-6">
                <Link href="/" className="rune-muted tracking-[0.32em] text-[11px] hover:text-amber">
                    THE <span style={{ color: 'var(--amber)' }}>BURN</span> ARCHIVE
                </Link>
                <span className="rune-muted text-[10px]" style={{ color: '#b98f65' }}>THE RECALL DESK</span>
            </nav>

            <div className="grid place-items-center px-1 pt-6">
                <div className="w-full max-w-[520px] anim-rise">
                    <p className="rune-muted text-center text-[10.5px] tracking-[0.4em] mb-3">
                        PRESENT THE SLIP, AND THE PAST OBEYS
                    </p>
                    <h1 className="font-voice font-semibold text-center text-[30px] leading-tight">
                        Recall &amp; Reform
                    </h1>
                    <p className="text-center mt-3 leading-[1.8]" style={{ color: 'rgba(236,225,203,.7)' }}>
                        The burn slip is a one-time authority issued when a paste was sealed.
                        With it, the keeper may destroy the paste or cut it a fresh address.
                    </p>

                    <div className="mt-10">
                        {status === 'success' ? (
                            <div className="slip px-7 py-9 text-center anim-fade" role="status">
                                <p className="rune text-center mb-4" style={{ color: 'var(--amber)' }}>
                                    IT IS DONE
                                </p>
                                <p className="font-voice italic font-medium text-[20px] leading-[1.55]" style={{ color: 'var(--ink)' }}>
                                    {message}
                                </p>
                                {rotatedId && (
                                    <div className="mt-7">
                                        <p className="rune-muted text-[10px] normal-case tracking-[0.2em] mb-2">
                                            THE NEW SIGIL
                                        </p>
                                        <a
                                            href={`/p/${rotatedId}${typeof window !== 'undefined' ? window.location.hash : ''}`}
                                            className="font-data text-[13px] break-all"
                                            style={{ color: 'var(--amber)' }}
                                        >
                                            /p/{rotatedId}
                                        </a>
                                    </div>
                                )}
                                <button
                                    className="ghost mt-8 text-[10px] px-5"
                                    onClick={() => { setStatus('idle'); setInputValue(''); setToken(''); setRotatedId(''); }}
                                >
                                    ANOTHER DISPOSITION
                                </button>
                            </div>
                        ) : (
                            <div className="slip px-7 py-9 anim-fade">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                    <div>
                                        <label htmlFor="slip-address" className="rune block mb-2">The address</label>
                                        <input
                                            id="slip-address"
                                            type="text"
                                            placeholder="Full link or the sigil alone"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            className="paper-input font-data text-[12.5px]"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="burn-slip" className="rune block mb-2">The burn slip</label>
                                        <input
                                            id="burn-slip"
                                            type="text"
                                            placeholder="Issued when the paste was sealed"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            className="paper-input font-data text-[12.5px]"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <p
                                        role="alert"
                                        className="anim-fade mt-6 text-center font-voice italic text-[16px]"
                                        style={{ color: '#a4463f' }}
                                    >
                                        {message}
                                    </p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                    {/* Recall is severe: wax border, spoken plainly. */}
                                    <button
                                        onClick={handleRevoke}
                                        disabled={isProcessing || !inputValue || !token}
                                        className="ghost flex flex-col items-center gap-1.5 py-5 px-4"
                                        style={{ borderColor: 'rgba(122,46,42,.6)', color: '#c98780' }}
                                    >
                                        <span className="rune text-[11px] tracking-[0.3em]">RECALL</span>
                                        <span className="rune text-[9px] opacity-80 normal-case tracking-[0.16em]">
                                            DESTROY IT EVERYWHERE
                                        </span>
                                    </button>
                                    <button
                                        onClick={handleRotate}
                                        disabled={isProcessing || !inputValue || !token}
                                        className="ghost flex flex-col items-center gap-1.5 py-5 px-4"
                                    >
                                        <span className="rune text-[11px] tracking-[0.3em]">REFORM</span>
                                        <span className="rune text-[9px] opacity-80 normal-case tracking-[0.16em]">
                                            CUT THE SLIP A NEW ADDRESS
                                        </span>
                                    </button>
                                </div>
                                {isProcessing && (
                                    <p className="rune-muted text-center text-[10px] mt-6" aria-live="polite">
                                        THE DESK IS WORKING…
                                    </p>
                                )}
                                <div className="slip-rule" />
                                <div className="leading-[2]" style={{ color: 'var(--ink-soft)', fontSize: '11.5px' }}>
                                    <p>Recall is instant and final — one atomic stroke, nothing marked.</p>
                                    <p className="mt-1.5">Reform cuts a fresh address; the old sigil answers nothing.</p>
                                    <p className="mt-1.5">The cipher key is never stored. This desk governs the paste alone.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
