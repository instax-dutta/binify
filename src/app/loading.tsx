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
            className="min-h-screen grid place-items-center"
        >
            <span className="sr-only">Holding the slip — a moment</span>
            <div className="flex flex-col items-center gap-5" aria-hidden="true">
                <span
                    className="ember-pulse h-[6px] w-[76px] rounded-[3px]"
                    style={{
                        background: 'linear-gradient(180deg,#c9a25a,#a4762f)',
                        boxShadow: '0 0 14px rgba(201,162,90,.55)',
                    }}
                />
                <span className="rune-muted text-[10.5px]">A CANDLE HOLDS THE DARK</span>
            </div>
        </div>
    );
}
