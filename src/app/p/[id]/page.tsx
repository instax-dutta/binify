'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
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
            const hash = window.location.hash.slice(1);
            if (!hash) {
                throw new Error('Encryption key not found in URL fragment. Decryption is impossible.');
            }

            const response = await fetch(`/api/paste/${pasteId}`);

            if (!response.ok) {
                if (response.status === 404) throw new Error('Data segment not found.');
                if (response.status === 410) throw new Error('This session has already been purged or expired.');
                throw new Error('Failed to synchronize with server.');
            }

            const data = await response.json();

            if (data.hasPassword && !passwordAttempt) {
                setNeedsPassword(true);
                setMetadata(data);
                setIsLoading(false);
                return;
            }

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
            setError(err instanceof Error ? err.message : 'Cryptographic failure.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) loadPaste(password);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Loader2 size={48} className="text-accent animate-spin mx-auto" />
                        <div className="absolute inset-0 blur-xl bg-accent/20 animate-pulse" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Decrypting Logic...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full luxury-card text-center space-y-8 border-red-500/20"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                        <ShieldAlert size={40} className="text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white tracking-tighter">Access Denied</h2>
                        <p className="text-sm text-white/40 font-medium leading-relaxed">{error}</p>
                    </div>
                    <a href="/" className="btn-luxury-primary w-full">
                        Return to Matrix
                    </a>
                </motion.div>
            </div>
        );
    }

    if (needsPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full luxury-card space-y-10"
                >
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-accent/20">
                            <Lock size={30} className="text-accent" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Secondary Key Required</h2>
                            <p className="text-sm text-white/30 font-medium tracking-tight">This session is double-locked via PBKDF2.</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Session Password</label>
                            <input
                                type="password"
                                placeholder="Enter bypass code"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="luxury-input text-center tracking-widest"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="btn-luxury-primary w-full py-4 text-sm font-bold uppercase tracking-widest">
                            Unlock Binary
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-accent/40 transition-all">
                            <Terminal size={20} className="text-white group-hover:text-accent transition-colors" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Binify</span>
                    </a>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        Secure Payload Terminal
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 pt-16">
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
