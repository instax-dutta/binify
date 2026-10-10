import Link from 'next/link';

/**
 * The folio: a widened slip for the order's written pages. Every static page
 * (docs, privacy, security, terms) wears the same shell so the doctrine reads
 * like part of one book rather than four separate cards.
 */
export default function Folio({
    eyebrow,
    title,
    lede,
    children,
}: {
    eyebrow: string;
    title: string;
    lede?: string;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen px-5 pb-24">
            <nav className="flex items-center justify-between px-1 md:px-5 py-6">
                <Link href="/" className="rune-muted tracking-[0.32em] text-[11px] hover:text-amber">
                    THE <span style={{ color: 'var(--amber)' }}>BURN</span> ARCHIVE
                </Link>
                <Link href="/" className="rune-muted text-[10px] hover:text-amber">RETURN</Link>
            </nav>

            <div className="grid place-items-center px-1 pt-2">
                <div className="folio w-full anim-rise">
                    <p className="rune-muted text-center text-[10.5px] tracking-[0.4em] mb-8">{eyebrow}</p>
                    <div className="slip px-7 py-9 md:px-12 md:py-11">
                        <h1 className="font-voice font-semibold text-center text-[30px] leading-tight">
                            {title}
                        </h1>
                        {lede && (
                            <p className="text-center mt-3" style={{ color: 'var(--ink-soft)' }}>
                                {lede}
                            </p>
                        )}
                        <div className="slip-rule mt-8" />
                        <div className="max-w-none">{children}</div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/** A section inside the folio: a rune eyebrow and prose. */
export function Chapter({ mark, title, children }: { mark: string; title: string; children: React.ReactNode }) {
    return (
        <section className="mt-10 first:mt-0">
            <p className="rune text-[10px] tracking-[0.32em] mb-1.5" style={{ color: 'var(--amber)' }}>
                {mark}
            </p>
            <h2>{title}</h2>
            {children}
        </section>
    );
}
