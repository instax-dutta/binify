'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Copy,
    QrCode,
    AlertTriangle,
    ArrowRight,
    Plus,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasteCreatedProps {
    pasteId: string;
    encryptionKey: string;
    onCreateAnother: () => void;
}

export default function PasteCreated({
    pasteId,
    encryptionKey,
    onCreateAnother,
}: PasteCreatedProps) {
    const [copied, setCopied] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQR, setShowQR] = useState(false);

    const pasteUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/p/${pasteId}#${encryptionKey}`
        : '';

    useEffect(() => {
        if (pasteUrl) {
            QRCode.toDataURL(pasteUrl, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#ffffff',
                    light: '#000000',
                },
            })
                .then(setQrCodeUrl)
                .catch(console.error);
        }
    }, [pasteUrl]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(pasteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl mx-auto space-y-8"
        >
            {/* Success Banner */}
            <div className="luxury-glass rounded-2xl p-8 border-accent/20 bg-accent/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CheckCircle2 size={120} className="text-accent" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Paste Secured Successfully</h3>
                </div>
                <p className="text-white/40 font-medium max-w-xl">
                    Your data has been encrypted client-side and stored. The encryption key is embedded in your URL fragment and was never sent to our servers.
                </p>
            </div>

            {/* URL Display */}
            <div className="luxury-card space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">
                    Access & Share URL
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        value={pasteUrl}
                        readOnly
                        className="flex-1 luxury-input font-mono text-xs py-4 px-6 border-white/10"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                        onClick={copyToClipboard}
                        className={cn(
                            "btn-luxury-primary md:min-w-[140px] transition-all",
                            copied && "bg-accent text-black border-accent"
                        )}
                    >
                        {copied ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 size={18} />
                                COPIED
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Copy size={18} />
                                COPY
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="luxury-card flex flex-col items-center justify-center gap-6 group cursor-pointer" onClick={() => setShowQR(!showQR)}>
                    <div className="flex items-center gap-3 text-sm font-bold text-white/40 group-hover:text-white transition-colors">
                        <QrCode size={18} />
                        GENERATE QR CODE
                    </div>
                    {showQR && qrCodeUrl ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-white rounded-xl shadow-2xl shadow-white/5"
                        >
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </motion.div>
                    ) : (
                        <div className="w-48 h-48 rounded-xl border border-dashed border-white/10 flex items-center justify-center bg-white/[0.01]">
                            <QrCode size={32} className="text-white/5" />
                        </div>
                    )}
                </div>

                {/* Navigation & Warning */}
                <div className="space-y-6">
                    <div className="luxury-glass rounded-2xl p-6 border-orange-500/20 bg-orange-500/[0.02]">
                        <div className="flex items-center gap-3 text-orange-500 mb-2">
                            <AlertTriangle size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Crucial Security Alert</span>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed font-medium">
                            This URL contains the **decryption key**. If forgotten, our servers cannot recover your data. Bookmark it or save it in a safe place.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            href={pasteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-luxury-secondary justify-between group"
                        >
                            <span className="flex items-center gap-2">
                                <ExternalLink size={16} />
                                View Live Paste
                            </span>
                            <ArrowRight size={16} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <button
                            onClick={onCreateAnother}
                            className="btn-luxury-secondary justify-between group border-white/5"
                        >
                            <span className="flex items-center gap-2">
                                <Plus size={16} />
                                Initialize New Paste
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
