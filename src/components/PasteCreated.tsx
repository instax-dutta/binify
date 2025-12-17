'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

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

    const pasteUrl = `${window.location.origin}/p/${pasteId}#${encryptionKey}`;

    useEffect(() => {
        // Generate QR code
        QRCode.toDataURL(pasteUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#e5e5e5',
                light: '#0a0a0a',
            },
        })
            .then(setQrCodeUrl)
            .catch(console.error);
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
        <div className="w-full max-w-3xl mx-auto space-y-6 fade-in">
            {/* Success Message */}
            <div className="bg-accent-green/10 border border-accent-green/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-6 h-6 text-accent-green flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-accent-green mb-2">
                            Paste Created Successfully!
                        </h3>
                        <p className="text-text-secondary text-sm">
                            Your encrypted paste is ready to share. The encryption key is
                            included in the URL fragment and will never be sent to the server.
                        </p>
                    </div>
                </div>
            </div>

            {/* URL Display */}
            <div className="card">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Share this URL
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={pasteUrl}
                        readOnly
                        className="input flex-1 font-mono text-sm"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button onClick={copyToClipboard} className="btn-primary">
                        {copied ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Copied!
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                Copy
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* QR Code */}
            <div className="card">
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <span className="text-sm font-medium text-text-secondary">
                        QR Code
                    </span>
                    <svg
                        className={`w-5 h-5 text-text-tertiary transition-transform ${showQR ? 'rotate-180' : ''
                            }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {showQR && qrCodeUrl && (
                    <div className="mt-4 flex justify-center">
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="rounded-lg border border-border"
                        />
                    </div>
                )}
            </div>

            {/* Warning */}
            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <div className="text-sm">
                        <p className="font-medium text-accent-yellow mb-1">
                            Important: Save this URL
                        </p>
                        <p className="text-text-secondary">
                            This URL contains the encryption key. If you lose it, the paste
                            cannot be recovered. Make sure to save it before leaving this page.
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <a
                    href={pasteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex-1 text-center"
                >
                    View Paste
                </a>
                <button onClick={onCreateAnother} className="btn-secondary flex-1">
                    Create Another
                </button>
            </div>
        </div>
    );
}
