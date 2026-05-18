'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Shield,
  Flame,
  Lock,
  Terminal,
  Github,
  Globe,
  ChevronRight
} from 'lucide-react';
import PasteEditor from '@/components/PasteEditor';
import PasteCreated from '@/components/PasteCreated';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

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
          <a href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              <Terminal size={16} className="text-black" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#1ed760] transition-colors">Binify</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/docs" className="nav-link-spotify-inactive text-sm">Docs</a>
            <a href="https://github.com/instax-dutta/binify" target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors">
              <Github size={18} />
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center w-full"
          >
            {/* Hero */}
            <div className="text-center space-y-6 mb-20 max-w-3xl">
              <motion.div variants={itemVariants}>
                <span className="inline-flex items-center gap-2 bg-[#1f1f1f] text-[#1ed760] px-4 py-1.5 rounded-[9999px] text-[0.625rem] font-bold uppercase tracking-[0.1em]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1ed760]" />
                  </span>
                  ZERO-KNOWLEDGE
                </span>
              </motion.div>

              <motion.h1 variants={heroVariants} className="title-xl text-white">
                Your Secrets,<br />
                <span className="text-[#1ed760]">Truly Anonymous.</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-base md:text-lg text-[#b3b3b3] font-normal max-w-xl mx-auto leading-relaxed">
                End-to-end encrypted pastebin with no server-side persistence of keys.
              </motion.p>
            </div>

            {/* Feature Cards */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-20 w-full max-w-5xl"
            >
              <FeatureCard
                icon={<Shield size={16} />}
                title="E2E Protection"
                description="AES-256-GCM encryption in your browser. Server only sees noise."
              />
              <FeatureCard
                icon={<Flame size={16} />}
                title="Auto-Purge"
                description="Self-destruct logic wipes data from both Redis and DB after threshold."
              />
              <FeatureCard
                icon={<Lock size={16} />}
                title="Zero-Knowledge"
                description="No keys touch our server. Even if we wanted to, we can't see your data."
              />
            </motion.div>

            {/* Editor */}
            <motion.div variants={itemVariants} className="w-full max-w-5xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="divider-spotify flex-1" />
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-white/20">ENCRYPT & SHARE</span>
                <div className="divider-spotify flex-1" />
              </div>
              <PasteEditor onPasteCreated={handlePasteCreated} />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-all duration-500">
              <Terminal size={14} />
              <span className="text-sm font-bold tracking-tight">BINIFY</span>
            </div>
            <p className="text-xs text-white/20">© 2025 sdad.pro. Pure cryptography.</p>
          </div>
          <div className="flex items-center gap-6 text-[0.625rem] font-bold text-white/20 uppercase tracking-[0.2em]">
            <a href="https://github.com/instax-dutta/binify" target="_blank" rel="noopener noreferrer" className="hover:text-[#1ed760] transition-colors flex items-center gap-1.5">
              <Github size={11} />
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-[#181818] rounded-lg p-5 transition-all duration-200 hover:bg-[#1f1f1f] cursor-default group"
    >
      <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center mb-3 group-hover:bg-[#1ed760]/10 transition-colors">
        <span className="text-[#b3b3b3] group-hover:text-[#1ed760] transition-colors">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#1ed760] transition-colors">{title}</h3>
      <p className="text-xs text-[#b3b3b3] leading-relaxed">{description}</p>
    </motion.div>
  );
}
