'use client';

/**
 * Last-resort boundary for failures in the root layout itself, where the route
 * boundary cannot render. This component replaces the entire document, so it
 * has to emit <html> and <body> itself.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body
                role="alert"
                aria-live="assertive"
                className="bg-[#121212] text-white antialiased"
                style={{
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    padding: '1.5rem',
                }}
            >
                <main style={{ maxWidth: '28rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: '#b3b3b3', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        Binify could not start. Reloading usually clears it.
                    </p>
                    {error.digest && (
                        <p style={{ color: '#666', fontSize: '0.6875rem', marginTop: '1rem' }}>
                            Reference: {error.digest}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={reset}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '9999px',
                            border: 'none',
                            background: '#1ed760',
                            color: '#000',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Reload
                    </button>
                </main>
            </body>
        </html>
    );
}