'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock, Loader2, ShieldAlert } from 'lucide-react';
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
                    iterations: data.iterations,
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
                <div className="text-center space-y-4">
                    <div className="relative">
                        <Loader2 size={36} className="text-[#1ed760] animate-spin mx-auto" />
                    </div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/30">Decrypting...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-[#181818] rounded-lg p-8 text-center space-y-6 border border-[#f3727f]/15"
                >
                    <div className="w-16 h-16 bg-[#f3727f]/10 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert size={32} className="text-[#f3727f]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">Access Denied</h2>
                        <p className="text-sm text-[#b3b3b3] leading-relaxed">{error}</p>
                    </div>
                    <a href="/" className="btn-spotify-primary inline-flex">
                        <Terminal size={14} />
                        RETURN HOME
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
                    className="max-w-md w-full bg-[#181818] rounded-lg p-8 space-y-8"
                >
                    <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-[#1ed760]/10 flex items-center justify-center mx-auto">
                            <Lock size={24} className="text-[#1ed760]" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-white tracking-tight">Password Required</h2>
                            <p className="text-sm text-[#b3b3b3]">This paste is protected by an extra PBKDF2 layer.</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="label-spotify justify-center">Password</label>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-spotify text-center"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" className="btn-spotify-primary w-full h-12 tracking-[0.05em]">
                            <Lock size={14} />
                            UNLOCK
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <nav className="border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center">
                            <Terminal size={16} className="text-black" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-white">Binify</span>
                    </a>
                    <span className="text-[0.625rem] font-bold text-white/20 uppercase tracking-[0.2em]">DECRYPTED PAYLOAD</span>
                </div>
            </nav>

            <div className="container mx-auto px-6 pt-10">
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
