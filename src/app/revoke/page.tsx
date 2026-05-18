'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    Trash2,
    RefreshCw,
    Terminal,
    Key,
    Link as LinkIcon,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        } catch (e) {
            return trimmed;
        }
    };

    const handleRevoke = async () => {
        const id = extractPasteId(inputValue);
        if (!id || !token) {
            setStatus('error');
            setMessage('Paste ID/URL and Authorization Token are required.');
            return;
        }

        setIsProcessing(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch(`/api/paste/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
            });

            let data: any = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || 'Revocation failed. Verify your ID and token.');
            }

            setStatus('success');
            setMessage('Your paste has been securely purged from the server.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Critical failure during revocation.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = async () => {
        const id = extractPasteId(inputValue);
        if (!id || !token) {
            setStatus('error');
            setMessage('Paste ID/URL and Authorization Token are required.');
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

            let data: any = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || 'Rotation failed. Verify your ID and token.');
            }

            setRotatedId(data.newId);
            setStatus('success');
            setMessage('Secure link rotation complete. The old ID is now invalid.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Critical failure during rotation.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen pt-20 pb-20 px-6 container mx-auto flex flex-col items-center">
            <div className="w-full max-w-2xl mb-10 flex items-center justify-between">
                <a href="/" className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-[#b3b3b3] hover:text-[#1ed760] transition-colors uppercase tracking-[0.15em] group">
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    BACK
                </a>
                <div className="flex items-center gap-1.5 text-[0.5rem] font-bold text-[#1ed760] uppercase tracking-[0.15em] bg-[#1ed760]/5 px-2.5 py-1 rounded-[9999px] border border-[#1ed760]/10">
                    <ShieldAlert size={10} />
                    ADMIN
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-6"
            >
                <div className="text-center space-y-3">
                    <h1 className="title-xl text-white">
                        Revoke &amp; <span className="text-[#1ed760]">Rotate</span>
                    </h1>
                    <p className="text-sm text-[#b3b3b3] max-w-lg mx-auto leading-relaxed">
                        Use your admin token to purge content or rotate the access link.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#181818] rounded-lg p-8 space-y-6 text-center border border-[#1ed760]/15"
                        >
                            <div className="w-16 h-16 bg-[#1ed760]/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} className="text-[#1ed760]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="title-md text-white">Operation Successful</h3>
                                <p className="text-sm text-[#b3b3b3] max-w-sm mx-auto">{message}</p>
                            </div>

                            {rotatedId && (
                                <div className="space-y-4 pt-4">
                                    <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#1ed760] text-left">
                                        New ID
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={rotatedId}
                                            className="input-spotify text-xs font-mono text-[#1ed760]/80"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(rotatedId)}
                                            className="btn-spotify-secondary shrink-0 h-[44px] w-[44px] !p-0"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                    <a
                                        href={`/p/${rotatedId}${typeof window !== 'undefined' ? window.location.hash : ''}`}
                                        className="btn-spotify-primary w-full h-11 text-[0.625rem] tracking-[0.05em]"
                                    >
                                        <Terminal size={14} />
                                        VIEW NEW LINK
                                    </a>
                                </div>
                            )}

                            {!rotatedId && (
                                <button
                                    onClick={() => { setStatus('idle'); setInputValue(''); setToken(''); }}
                                    className="btn-spotify-secondary mt-2"
                                >
                                    NEW OPERATION
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-5"
                        >
                            <div className="bg-[#181818] rounded-lg p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="label-spotify">
                                            <LinkIcon size={12} /> Paste Link or ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Full URL or just the ID"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            className="input-spotify text-sm font-mono"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="label-spotify">
                                            <Key size={12} /> Deletion Token
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter your private token"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            className="input-spotify text-sm font-mono"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-[#f3727f]/10 border border-[#f3727f]/20 text-[#f3727f] p-3 rounded-lg text-xs"
                                    >
                                        {message}
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={handleRevoke}
                                        disabled={isProcessing || !inputValue || !token}
                                        className="btn-spotify-secondary flex flex-col items-center gap-2 py-6 border border-[#ffa42b]/15 bg-[#ffa42b]/[0.01] hover:bg-[#ffa42b]/[0.03] hover:border-[#ffa42b]/30 disabled:opacity-30 disabled:cursor-not-allowed h-auto"
                                    >
                                        <Trash2 size={20} className="text-[#ffa42b]" />
                                        <div className="text-center">
                                            <span className="block text-xs font-bold uppercase tracking-[0.05em] text-white">Revoke</span>
                                            <span className="block text-[0.5rem] text-[#b3b3b3] mt-0.5 uppercase tracking-[0.1em]">Permanently delete</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleRotate}
                                        disabled={isProcessing || !inputValue || !token}
                                        className="btn-spotify-secondary flex flex-col items-center gap-2 py-6 border border-[#1ed760]/15 bg-[#1ed760]/[0.01] hover:bg-[#1ed760]/[0.03] hover:border-[#1ed760]/30 disabled:opacity-30 disabled:cursor-not-allowed h-auto"
                                    >
                                        <RefreshCw size={20} className={cn("text-[#1ed760]", isProcessing && "animate-spin")} />
                                        <div className="text-center">
                                            <span className="block text-xs font-bold uppercase tracking-[0.05em] text-white">Rotate</span>
                                            <span className="block text-[0.5rem] text-[#b3b3b3] mt-0.5 uppercase tracking-[0.1em]">New access link</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#1f1f1f] rounded-lg p-5 space-y-3">
                                <div className="flex items-center gap-2 text-[#b3b3b3]">
                                    <AlertTriangle size={14} />
                                    <span className="text-[0.625rem] font-bold uppercase tracking-[0.1em]">Security Policy</span>
                                </div>
                                <div className="space-y-2 text-[0.625rem] text-white/20 leading-relaxed">
                                    <p>Revocation is instant and final. Data is purged from both Redis and DB.</p>
                                    <p>Rotation generates a new URL. The old link returns 404 immediately.</p>
                                    <p>Binify never stores your encryption key. These operations manage the paste ID only.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {isProcessing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <Loader2 size={36} className="text-[#1ed760] animate-spin mx-auto" />
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white animate-pulse">Processing...</p>
                    </div>
                </div>
            )}
        </main>
    );
}
