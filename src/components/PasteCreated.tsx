'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { logger } from '@/lib/logging';
import { WaxSeal, WaxSealDefs } from './WaxSeal';

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
            // A QR the recipient scans is jewellery on vellum: wax on paper.
            QRCode.toDataURL(pasteUrl, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#4d1d1a',
                    light: '#ece1cb',
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

    const host = typeof window !== 'undefined' ? window.location.host : 'bin.sdad.pro';
    const sigil = `${host}/p/${pasteId}`;

    return (
        <div className="w-full max-w-[460px] mx-auto text-center anim-seal">
            <WaxSealDefs />

            <div className="charred-paper relative h-[170px]">
                <div className="absolute right-7 top-[52px] rotate-[4deg]">
                    <WaxSeal size={88} />
                </div>
                <p className="absolute left-6 top-8 text-left max-w-[46%] leading-[1.9]">
                    <span className="rune block text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                        THE SLIP IS WAXED
                    </span>
                    <span
                        className="font-voice italic font-medium text-[17px] mt-1 block"
                        style={{ color: 'var(--ink)' }}
                    >
                        It opens once, then it is smoke.
                    </span>
                </p>
            </div>

            <p className="font-voice italic font-medium text-[20px] mt-7 leading-[1.55]" style={{ color: 'rgba(236,225,203,.72)' }}>
                Deliver the sigil.
            </p>
            <p aria-label="Share link" className="font-data text-[15px] mt-4 break-all leading-[1.7]" style={{ color: 'var(--amber)' }}>
                {pasteUrl}
            </p>

            <div className="rune-muted flex flex-wrap justify-center gap-x-7 gap-y-2 mt-5 text-[11px]">
                <span>SIGIL <span className="font-voice italic normal-case tracking-normal text-[13px]">{sigil}</span></span>
                <span>UNGUARDED</span>
            </div>

            <button className="ghost mt-7" onClick={copyUrl} aria-live="polite">
                {copiedUrl ? 'SIGIL COPIED' : 'COPY THE SIGIL'}
            </button>

            {deletionToken && (
                <div className="mt-10 border pt-5 pb-5 px-5" style={{ borderColor: 'var(--hair-soft)' }}>
                    <div className="flex items-center justify-between">
                        <span className="rune-muted text-[11px] tracking-[0.3em]">THE BURN SLIP</span>
                        <span className="rune text-[9px]" style={{ color: 'var(--amber)' }}>KEEP IT SECRET</span>
                    </div>
                    <p className="text-left mt-3 px-1 break-all text-[11.5px] leading-[1.7]" style={{ color: 'rgba(236,225,203,.66)' }}>
                        {deletionToken}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <button className="ghost text-[10px] px-4 py-2" onClick={copyToken} aria-live="polite">
                            {copiedToken ? 'SLIP COPIED' : 'COPY THE SLIP'}
                        </button>
                        <a href="/revoke" className="ghost text-[10px] px-4 py-2" style={{ color: '#a4463f', borderColor: 'rgba(122,46,42,.55)' }}>
                            RECALL AT THE DESK
                        </a>
                    </div>
                    <p className="rune-muted mt-4 text-[9.5px] tracking-[0.2em]">
                        THE SLIP RECALLS A PASTE — LOSE IT AND NO ONE CAN RECALL IT
                    </p>
                </div>
            )}

            {showQR && qrCodeUrl && (
                <div className="anim-fade mt-8 inline-block p-3" style={{ background: 'var(--vellum)' }}>
                    {/* The QR is a data: URL from toDataURL(); next/image cannot
                        optimise data URLs, so the raw element is correct here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="QR code to carry this sigil to another device" className="w-40 h-40" />
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 mt-8">
                <a
                    href={pasteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ghost text-[10px] px-4 py-2"
                >
                    GO TO THE SLIP
                </a>
                <button className="ghost text-[10px] px-4 py-2" onClick={() => setShowQR(!showQR)}>
                    {showQR ? 'HIDE THE CIPHER DISC' : 'SHOW A CIPHER DISC'}
                </button>
                <button className="ghost text-[10px] px-4 py-2" onClick={onCreateAnother}>
                    SEAL ANOTHER
                </button>
            </div>

            <p className="rune-muted text-[10px] mt-8 leading-[1.9]">
                COPY IT NOW — IF THE ADDRESS IS LOST, THE MESSAGE IS UNRECOVERABLE BY DESIGN
            </p>
        </div>
    );
}
