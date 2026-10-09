/**
 * Route-level loading state.
 *
 * Announced politely rather than assertively: this is an expected transient
 * state, and a screen reader interrupting whatever the visitor was doing to
 * announce "loading" would be worse than the silence it replaces.
 */
export default function Loading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="min-h-screen flex items-center justify-center bg-[#121212]"
        >
            <span className="sr-only">Loading…</span>
            <div className="flex items-center gap-3" aria-hidden="true">
                <span className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#1ed760] animate-spin" />
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/60">
                    Decrypting
                </span>
            </div>
        </div>
    );
}