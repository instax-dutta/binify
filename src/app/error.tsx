'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route error boundary.
 *
 * An unhandled render failure becomes a quiet confession rather than a blank
 * frame: the slip is dampened, the candle nearly out. Contract for the
 * pending-UI gate: role="alert" (asserted statically) and a Try again control
 * wired to Next's reset.
 */
export default function RouteError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // The client has no visibility into server-side failures otherwise.
        console.error('[route-error]', error.digest ?? error.name, error.message);
    }, [error]);

    return (
        <main
            role="alert"
            aria-live="assertive"
            className="min-h-screen grid place-items-center px-6"
        >
            <div className="text-center anim-rise max-w-[420px]">
                <div
                    className="w-[74px] h-[74px] mx-auto mb-7 rounded-full grid place-items-center"
                    style={{ border: '1px solid rgba(122,46,42,.5)', boxShadow: '0 0 40px rgba(122,46,42,.15) inset' }}
                    aria-hidden="true"
                >
                    {/* the gutter line of a guttered slip */}
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a4463f" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 3.5 V20.5" />
                        <path d="M10 6 C 13.5 7.5, 15 10, 13.5 13.5" strokeDasharray="2 2.6" />
                        <path d="M14 15.5 L18 19.5" opacity=".55" strokeDasharray="1.5 3" />
                    </svg>
                </div>
                <h1 className="font-voice font-semibold text-[25px] leading-snug">
                    Something went wrong
                </h1>
                <p className="rune-muted mt-4 leading-[1.9]" style={{ fontSize: '11.5px', letterSpacing: '.18em' }}>
                    THE ORDER CONFESSES — THE SLIP WAS TAKEN BY THE WIND{' '}
                    {error.digest && <span className="block mt-2 text-[10px] opacity-70">PROOF {error.digest}</span>}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <button onClick={reset} className="ghost text-[10px] px-5">
                        TRY AGAIN
                    </button>
                    <Link href="/" className="ghost text-[10px] px-5" style={{ color: 'rgba(236,225,203,.72)' }}>
                        RETURN TO THE NIGHT
                    </Link>
                </div>
            </div>
        </main>
    );
}
