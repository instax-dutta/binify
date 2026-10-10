'use client';

import Link from 'next/link';

/**
 * 404. The slip was never filed, or it was already burned. The regulator says
 * the page must explain itself rather than show a bare frame.
 */export default function NotFound() {
    return (
        <main className="min-h-screen grid place-items-center px-6 text-center">
            <div className="anim-rise max-w-[440px]">
                <div
                    className="w-[74px] h-[74px] mx-auto mb-7 rounded-full grid place-items-center"
                    style={{ border: '1px solid var(--hair-soft)', boxShadow: '0 0 40px rgba(201,162,90,.08) inset' }}
                    aria-hidden="true"
                >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(236,225,203,.7)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <circle cx="8" cy="8" r="4.2" />
                        <path d="M11 11 L15 15" />
                        <path d="M14.4 18.6 L18.8 14.2" />
                        <path d="M16.2 13.4 L14 11" />
                    </svg>
                </div>
                <h1 className="font-voice font-semibold text-[25px] leading-snug">
                    Nothing came to hand
                </h1>
                <p className="rune-muted mt-4 leading-[1.9]" style={{ fontSize: '11.5px', letterSpacing: '.18em' }}>
                    THIS SLIP DOES NOT EXIST, OR IT IS NO LONGER AVAILABLE.
                    <span className="block mt-2">THE ORDER KEEPS NO RECORD OF WHAT BURNS.</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <Link href="/" className="ghost text-[10px] px-5">
                        RETURN TO THE NIGHT
                    </Link>
                    <a href="/docs" className="ghost text-[10px] px-5" style={{ color: 'rgba(236,225,203,.72)' }}>
                        THE DOCTRINE
                    </a>
                </div>
            </div>
        </main>
    );
}
