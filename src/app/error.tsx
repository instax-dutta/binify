'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary.
 *
 * Next.js renders this in place of the route that threw, so a failure shows
 * explained UI with a way forward rather than an empty frame. `reset` re-renders
 * the segment without a full reload, which matters here because a viewer who
 * mistyped a fragment or hit a transient database error should not lose the page.
 */
export default function Error({
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
            className="min-h-screen flex items-center justify-center p-6 bg-[#121212]"
        >
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-[#f3727f]/10 rounded-full flex items-center justify-center mx-auto">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f3727f"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Something went wrong
                    </h1>
                    <p className="text-sm text-[#b3b3b3] leading-relaxed">
                        This page failed to load. Your paste is unaffected.
                    </p>
                </div>

                {error.digest && (
                    <p className="text-[0.625rem] font-mono text-white/50">
                        Reference: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button type="button" onClick={reset} className="btn-spotify-primary">
                        Try again
                    </button>
                    <Link href="/" className="btn-spotify-secondary">
                        Go home
                    </Link>
                </div>
            </div>
        </main>
    );
}