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
    ChevronRight,
    Copy,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevokePage() {
    const [pasteId, setPasteId] = useState('');
    const [token, setToken] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [rotatedId, setRotatedId] = useState('');

    const handleRevoke = async () => {
        if (!pasteId || !token) {
            setStatus('error');
            setMessage('Paste ID and Authorization Token are required.');
            return;
        }

        setIsProcessing(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch(`/api/paste/${encodeURIComponent(pasteId)}?token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
            });

            let data: any = {};
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || 'Revocation sequence failed. Verify your ID and token.');
            }

            setStatus('success');
            setMessage('Your paste has been securely purged from the nexus. All references have been destroyed.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Critical system failure during revocation.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = async () => {
        if (!pasteId || !token) {
            setStatus('error');
            setMessage('Paste ID and Authorization Token are required.');
            return;
        }

        setIsProcessing(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await fetch(`/api/paste/${encodeURIComponent(pasteId)}/rotate`, {
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
                throw new Error(data.error || 'Rotation sequence failed. Verify your ID and token.');
            }

            setRotatedId(data.newId);
            setStatus('success');
            setMessage('Secure link rotation complete. The old ID is now invalid, and your content has been moved to a new destination.');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Critical system failure during rotation.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 px-6 container mx-auto flex flex-col items-center">
            {/* Navigation Header */}
            <div className="w-full max-w-2xl mb-12 flex items-center justify-between">
                <a href="/" className="inline-flex items-center gap-2 text-xs font-black text-white/30 hover:text-accent transition-all uppercase tracking-[0.2em] group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </a>
                <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-3 py-1 rounded-full border border-accent/10">
                    <ShieldAlert size={12} />
                    Admin Terminal
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-8"
            >
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                        Link <span className="text-accent">Revocation</span> & Change
                    </h1>
                    <p className="text-white/40 font-medium max-w-lg mx-auto leading-relaxed">
                        Securely manage your published pastes. Use your administrative token to manually purge content or rotate the access link.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="luxury-card border-accent/20 bg-accent/[0.02] space-y-6 text-center py-12"
                        >
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto border border-accent/20 shadow-2xl shadow-accent/10">
                                <CheckCircle2 size={40} className="text-accent" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">Operation Successful</h3>
                                <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            {rotatedId && (
                                <div className="mt-8 space-y-4 px-8">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-accent text-left ml-1">NEW DESTINATION ID</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={rotatedId}
                                            className="luxury-input font-mono text-xs text-accent/80 border-accent/10 bg-accent/[0.02]"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(rotatedId);
                                                // Minimal feedback via button opacity or something?
                                            }}
                                            className="btn-luxury-secondary p-4 h-auto"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                    <div className="pt-4 flex flex-col gap-3">
                                        <a
                                            href={`/p/${rotatedId}${window.location.hash}`}
                                            className="btn-luxury-primary w-full py-4 text-xs font-bold tracking-widest uppercase italic"
                                        >
                                            Navigate to New Link
                                        </a>
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
                                            Note: Your encryption key (URL fragment #) remains the same. Only the Paste ID has changed.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!rotatedId && (
                                <button
                                    onClick={() => { setStatus('idle'); setPasteId(''); setToken(''); }}
                                    className="btn-luxury-secondary text-[10px] font-black tracking-widest uppercase mt-4"
                                >
                                    Initialize New Operation
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="luxury-card space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                            <LinkIcon size={12} /> Paste identifier / ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: abc-123-xyz"
                                            value={pasteId}
                                            onChange={(e) => setPasteId(e.target.value)}
                                            className="luxury-input text-sm font-mono tracking-tight"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                                            <Key size={12} /> Admin Deletion Token
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter your private token"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            className="luxury-input text-sm font-mono tracking-tight"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Error Feedback */}
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-medium"
                                    >
                                        {message}
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={handleRevoke}
                                        disabled={isProcessing || !pasteId || !token}
                                        className="btn-luxury-secondary flex flex-col items-center gap-2 py-8 group relative overflow-hidden border-orange-500/20 hover:border-orange-500/40 bg-orange-500/[0.01] hover:bg-orange-500/[0.03] active:scale-[0.98] transition-all"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Trash2 size={48} />
                                        </div>
                                        <Trash2 size={24} className="text-orange-500" />
                                        <div className="text-center">
                                            <span className="block text-xs font-black uppercase tracking-widest text-white">Manual Revoke</span>
                                            <span className="block text-[9px] text-white/30 mt-1 uppercase">Permanently purge data</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleRotate}
                                        disabled={isProcessing || !pasteId || !token}
                                        className="btn-luxury-secondary flex flex-col items-center gap-2 py-8 group relative overflow-hidden border-accent/20 hover:border-accent/40 bg-accent/[0.01] hover:bg-accent/[0.03] active:scale-[0.98] transition-all"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <RefreshCw size={48} />
                                        </div>
                                        <RefreshCw size={24} className={cn("text-accent", isProcessing && "animate-spin")} />
                                        <div className="text-center">
                                            <span className="block text-xs font-black uppercase tracking-widest text-white">Rotate ID</span>
                                            <span className="block text-[9px] text-white/30 mt-1 uppercase">Generate new access link</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Alert Box */}
                            <div className="luxury-glass p-6 rounded-2xl border-white/5 bg-white/[0.01] space-y-4">
                                <div className="flex items-center gap-3 text-white/40">
                                    <AlertTriangle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administrative Security Policy</span>
                                </div>
                                <div className="space-y-3 text-[11px] text-white/20 leading-relaxed font-medium uppercase tracking-wide">
                                    <p>• Revocation is **instant and final**. Data segments are purged from both Redis cache and Turso persistence layers.</p>
                                    <p>• Rotation generates a completely new URL. The old link will immediately return a 404/410 status.</p>
                                    <p>• Binify never stores your encryption key. These operations only manage the transmission container (Paste ID).</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {isProcessing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="text-center space-y-6">
                        <Loader2 size={48} className="text-accent animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white animate-pulse">Synchronizing Cryptographic State...</p>
                    </div>
                </div>
            )}
        </main>
    );
}
