'use client';

import { useState } from 'react';
import PasteEditor from '@/components/PasteEditor';
import PasteCreated from '@/components/PasteCreated';
import Link from 'next/link';

export default function HomePage() {
  const [createdPaste, setCreatedPaste] = useState<{
    pasteId: string;
    key: string;
    deletionToken?: string;
  } | null>(null);

  const handlePasteCreated = (pasteId: string, key: string, deletionToken?: string) => {
    setCreatedPaste({ pasteId, key, deletionToken });
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* The order's wordmark, held in one quiet line at the top. */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6">
        <Link href="/" className="rune-muted tracking-[0.32em] text-[11px] hover:text-amber">
          THE <span style={{ color: 'var(--amber)' }}>BURN</span> ARCHIVE
        </Link>
        <div className="flex items-center gap-7">
          <Link href="/docs" className="rune-muted text-[10px] tracking-[0.22em] hover:text-amber">DOCS</Link>
          <Link href="/revoke" className="rune-muted text-[10px] tracking-[0.22em] hover:text-amber" style={{ color: '#b98f65' }}>REVOKE</Link>
          <a
            href="https://github.com/instax-dutta/binify"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Binify on GitHub"
            className="rune-muted text-[10px] tracking-[0.22em] hover:text-amber"
          >
            GITHUB
          </a>
        </div>
      </nav>

      <div className="flex-1 grid place-items-center px-5 pb-16 pt-4">
        <div className="w-full">
          {createdPaste ? (
            <PasteCreated
              pasteId={createdPaste.pasteId}
              encryptionKey={createdPaste.key}
              deletionToken={createdPaste.deletionToken}
              onCreateAnother={() => setCreatedPaste(null)}
            />
          ) : (
            <div className="flex flex-col items-center w-full">
              {/* The motto is the only introduction the order gives. */}
              <p
                className="anim-fade text-center font-voice italic font-medium text-[21px] mb-9"
                style={{ color: 'rgba(236,225,203,.68)' }}
              >
                <span style={{ color: 'var(--amber)' }} aria-hidden="true">—</span>
                {' '}Spoken once, then silence{' '}
                <span style={{ color: 'var(--amber)' }} aria-hidden="true">—</span>
              </p>
              <PasteEditor onPasteCreated={handlePasteCreated} />
            </div>
          )}
        </div>
      </div>

      {/* The night footpath: three quiet links, nothing to sell. */}
      <footer className="px-6 md:px-10 py-7">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="rune-muted text-[10px]">ENTERED UNDER SEAL — MMXXVI</span>
          <div className="flex items-center gap-7">
            <a href="/docs" className="rune-muted text-[10px] hover:text-amber">DOCS</a>
            <a href="/privacy" className="rune-muted text-[10px] hover:text-amber">PRIVACY</a>
            <a href="/terms" className="rune-muted text-[10px] hover:text-amber">TERMS</a>
            <a href="/security" className="rune-muted text-[10px] hover:text-amber">SECURITY</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
