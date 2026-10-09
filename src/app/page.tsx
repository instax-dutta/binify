'use client';

import { useState } from 'react';
import {
  Shield,
  Flame,
  Lock,
  Terminal,
  Github,
  Globe
} from 'lucide-react';
import PasteEditor from '@/components/PasteEditor';
import PasteCreated from '@/components/PasteCreated';
import Link from 'next/link';

// Staggered reveal, expressed with CSS animation delays so the sequencing is
// handled by the compositor instead of a JS animation runtime.
const STAGGER = 'animationDelay';

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
    <main className="min-h-screen selection:bg-[#1ed760]/20 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <Terminal size={16} className="text-black" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#1ed760] transition-colors">Binify</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="/docs" className="nav-link-spotify-inactive text-sm">Docs</a>
            <a
              href="https://github.com/instax-dutta/binify"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Binify on GitHub"
              className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors"
            >
              <Github size={18} aria-hidden="true" />
            </a>
            <a href="https://sdad.pro" className="btn-spotify-secondary text-xs h-8 gap-1.5 !px-4">
              <Globe size={12} />
              sdad.pro
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 pt-24 pb-12 flex-1 flex flex-col items-center">
        {createdPaste ? (
          <PasteCreated
            pasteId={createdPaste.pasteId}
            encryptionKey={createdPaste.key}
            deletionToken={createdPaste.deletionToken}
            onCreateAnother={() => setCreatedPaste(null)}
          />
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Hero */}
            <div className="text-center space-y-6 mb-20 max-w-3xl">
              <div className="anim-rise" style={{ [STAGGER]: '200ms' }}>
                <span className="inline-flex items-center gap-2 bg-[#1f1f1f] text-[#1ed760] px-4 py-1.5 rounded-[9999px] text-[0.625rem] font-bold uppercase tracking-[0.1em]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1ed760]" />
                  </span>
                  ZERO-KNOWLEDGE
                </span>
              </div>

              <h1 className="anim-rise title-xl text-white" style={{ [STAGGER]: '300ms' }}>
                Your Secrets,<br />
                <span className="text-[#1ed760]">Truly Anonymous.</span>
              </h1>

              <p className="anim-rise text-base md:text-lg text-[#b3b3b3] font-normal max-w-xl mx-auto leading-relaxed" style={{ [STAGGER]: '400ms' }}>
                End-to-end encrypted pastebin with no server-side persistence of keys.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-20 w-full max-w-5xl">
              <FeatureCard
                icon={<Shield size={16} />}
                title="E2E Protection"
                description="AES-256-GCM encryption in your browser. Server only sees noise."
                delay="600ms"
              />
              <FeatureCard
                icon={<Flame size={16} />}
                title="Auto-Purge"
                description="Self-destruct logic enforces the view limit in one atomic statement."
                delay="700ms"
              />
              <FeatureCard
                icon={<Lock size={16} />}
                title="Zero-Knowledge"
                description="No keys touch our server. Even if we wanted to, we can't see your data."
                delay="800ms"
              />
            </div>

            {/* Editor */}
            <div className="anim-rise w-full max-w-5xl" style={{ [STAGGER]: '500ms' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="divider-spotify flex-1" />
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-white/50">ENCRYPT & SHARE</span>
                <div className="divider-spotify flex-1" />
              </div>
              <PasteEditor onPasteCreated={handlePasteCreated} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all duration-500">
              <Terminal size={14} />
              <span className="text-sm font-bold tracking-tight">BINIFY</span>
            </div>
            <p className="text-xs text-white/50">© 2025 sdad.pro. Pure cryptography.</p>
          </div>
          <div className="flex items-center gap-6 text-[0.625rem] font-bold text-white/50 uppercase tracking-[0.2em]">
            <a href="https://github.com/instax-dutta/binify" target="_blank" rel="noopener noreferrer" className="hover:text-[#1ed760] transition-colors flex items-center gap-1.5">
              <Github size={11} aria-hidden="true" />
              GitHub
            </a>
            <a href="/revoke" className="hover:text-white transition-colors">Revoke</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/security" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="anim-rise bg-[#181818] rounded-lg p-5 transition-all duration-200 hover:bg-[#1f1f1f] cursor-default group"
      style={{ animationDelay: delay }}
    >
      <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center mb-3 group-hover:bg-[#1ed760]/10 transition-colors">
        <span className="text-[#b3b3b3] group-hover:text-[#1ed760] transition-colors">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#1ed760] transition-colors">{title}</h3>
      <p className="text-xs text-[#b3b3b3] leading-relaxed">{description}</p>
    </div>
  );
}
