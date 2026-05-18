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
import { logger } from '@/lib/logging';

interface PasteCreatedProps {
    pasteId: string;
    encryptionKey: string;
    deletionToken?: string;
    onCreateAnother: () => void;
}

export default function PasteCreated({
    pasteId,
    encryptionKey,
    deletionToken,
    onCreateAnother,
}: PasteCreatedProps) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
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
                    dark: '#1ed760',
                    light: '#121212',
                },
            })
                .then(setQrCodeUrl)
                .catch(logger.error);
        }
    }, [pasteUrl]);

    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(pasteUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } catch (err) {
            logger.error('Failed to copy URL:', err);
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(deletionToken || '');
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        } catch (err) {
            logger.error('Failed to copy token:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl mx-auto space-y-6"
        >
            {/* Success Banner */}
            <div className="bg-[#181818] rounded-lg border border-[#1ed760]/20 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                    <CheckCircle2 size={100} />
                </div>
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#1ed760]/15 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-[#1ed760]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Paste encrypted</h3>
                        <p className="text-sm text-[#b3b3b3]">Your data never touched our servers without encryption.</p>
                    </div>
                </div>
            </div>

            {/* URL Display */}
            <div className="bg-[#181818] rounded-lg p-5 space-y-3">
                <label className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#b3b3b3]">
                    Share URL
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                    <input
                        type="text"
                        value={pasteUrl}
                        readOnly
                        className="flex-1 input-spotify text-xs font-mono"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                        onClick={copyUrl}
                        className={cn(
                            "btn-spotify-primary min-w-[120px] h-[44px] tracking-[0.05em]",
                            copiedUrl && "!bg-[#1ed760]"
                        )}
                    >
                        {copiedUrl ? (
                            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> COPIED</span>
                        ) : (
                            <span className="flex items-center gap-2"><Copy size={16} /> COPY</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Deletion Token */}
            {deletionToken && (
                <div className="bg-[#181818] rounded-lg p-5 space-y-3 border border-white/5">
                    <div className="flex items-center justify-between">
                        <label className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#1ed760]">
                            Deletion Token
                        </label>
                        <span className="text-[0.5rem] font-bold text-[#1ed760]/40 bg-[#1ed760]/5 px-2 py-0.5 rounded-[9999px] uppercase tracking-[0.1em]">
                            Keep secret
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            type="text"
                            value={deletionToken}
                            readOnly
                            className="flex-1 input-spotify text-xs font-mono"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                            onClick={copyToken}
                            className={cn(
                                "btn-spotify-secondary min-w-[120px] h-[44px] tracking-[0.05em]",
                                copiedToken && "!text-[#1ed760]"
                            )}
                        >
                            {copiedToken ? (
                                <span className="flex items-center gap-2 text-[#1ed760]"><CheckCircle2 size={14} /> COPIED</span>
                            ) : (
                                <span className="flex items-center gap-2"><Copy size={14} /> TOKEN</span>
                            )}
                        </button>
                    </div>
                    <p className="text-[0.625rem] text-white/20 px-1">
                        Use this at <a href="/revoke" className="underline hover:text-white transition-colors">/revoke</a> to delete or rotate your paste.
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    className="bg-[#181818] rounded-lg p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#1f1f1f] transition-colors"
                    onClick={() => setShowQR(!showQR)}
                >
                    <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-[#b3b3b3]">
                        <QrCode size={14} className="inline mr-1.5" />
                        QR CODE
                    </span>
                    {showQR && qrCodeUrl ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-white rounded-lg shadow-[rgba(0,0,0,0.5)_0px_8px_24px]"
                        >
                            <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                        </motion.div>
                    ) : (
                        <div className="w-40 h-40 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
                            <QrCode size={28} className="text-white/5" />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="bg-[#181818] rounded-lg p-5 border border-[#ffa42b]/15 space-y-2">
                        <div className="flex items-center gap-2 text-[#ffa42b]">
                            <AlertTriangle size={14} />
                            <span className="text-[0.625rem] font-bold uppercase tracking-[0.1em]">Warning</span>
                        </div>
                        <p className="text-xs text-[#b3b3b3] leading-relaxed">
                            Save the URL now. If you lose it, the data is permanently unrecoverable.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <a
                            href={pasteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-spotify-secondary justify-between w-full"
                        >
                            <span className="flex items-center gap-2 text-xs">
                                <ExternalLink size={14} />
                                VIEW PASTE
                            </span>
                            <ArrowRight size={14} className="text-white/20" />
                        </a>
                        <button
                            onClick={onCreateAnother}
                            className="btn-spotify-secondary justify-between w-full"
                        >
                            <span className="flex items-center gap-2 text-xs">
                                <Plus size={14} />
                                NEW PASTE
                            </span>
                            <ArrowRight size={14} className="text-white/20" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
