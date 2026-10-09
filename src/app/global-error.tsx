'use client';

import { useEffect } from 'react';

/**
 * The last boundary. If the error survived here the document shell itself has
 * failed, so this component must emit <html> and <body> itself, and load the
 * fonts inline for whatever style still reaches the visitor.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[global-error]', error.digest ?? error.name, error.message);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '24px',
                    background: '#0f0c09',
                    color: '#ece1cb',
                    fontFamily:
                        'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
            >
                <div role="alert" aria-live="assertive" style={{ textAlign: 'center' }}>
                    <div
                        aria-hidden="true"
                        style={{
                            width: 74,
                            height: 74,
                            margin: '0 auto 28px',
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            border: '1px solid rgba(122,46,42,.5)',
                            boxShadow: '0 0 40px rgba(122,46,42,.15) inset',
                        }}
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a4463f" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 3.5 V20.5" />
                            <path d="M10 6 C 13.5 7.5, 15 10, 13.5 13.5" strokeDasharray="2 2.6" />
                            <path d="M14 15.5 L18 19.5" opacity=".55" strokeDasharray="1.5 3" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 25, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                        Something went wrong
                    </h1>
                    <p
                        style={{
                            marginTop: 14,
                            fontSize: 11.5,
                            letterSpacing: '.18em',
                            color: 'rgba(236,225,203,.66)',
                            textTransform: 'uppercase',
                            lineHeight: '1.9',
                        }}
                    >
                        The lamp guttered — nothing is lost but the page
                        {error.digest ? ` · proof ${error.digest}` : ''}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            marginTop: 30,
                            background: 'transparent',
                            border: '1px solid rgba(236,225,203,.3)',
                            color: '#ece1cb',
                            fontFamily: 'inherit',
                            fontSize: 11,
                            letterSpacing: '.28em',
                            padding: '12px 26px',
                            cursor: 'pointer',
                        }}
                    >
                        TRY AGAIN
                    </button>
                </div>
            </body>
        </html>
    );
}
