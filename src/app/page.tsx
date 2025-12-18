'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Shield,
  Flame,
  Terminal,
  Lock,
  ShieldCheck,
  Globe
} from 'lucide-react';
import PasteEditor from '@/components/PasteEditor';
import PasteCreated from '@/components/PasteCreated';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any
    }
  }
};

export default function HomePage() {
  const [createdPaste, setCreatedPaste] = useState<{
    pasteId: string;
    key: string;
  } | null>(null);

  const handlePasteCreated = (pasteId: string, key: string) => {
    setCreatedPaste({ pasteId, key });
  };

  return (
    <main className="min-h-screen selection:bg-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/20">
              <Terminal size={22} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Binify</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-none mt-0.5">Zero Knowledge</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/docs" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Documentation</a>
            <div className="h-4 w-px bg-white/10" />
            <a href="https://sdad.pro" className="text-sm font-semibold text-accent flex items-center gap-2">
              <Globe size={14} />
              sdad.pro
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-6 pt-32 pb-20">
        {createdPaste ? (
          <PasteCreated
            pasteId={createdPaste.pasteId}
            encryptionKey={createdPaste.key}
            onCreateAnother={() => setCreatedPaste(null)}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Hero Header */}
            <motion.div variants={cardVariants} className="text-center space-y-6 mb-20 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-accent text-xs font-bold tracking-widest uppercase">
                <ShieldCheck size={14} className="animate-pulse" />
                Secure Architecture
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1]">
                Your Secrets, <br />
                <span className="text-accent">Truly Anonymous.</span>
              </h2>
              <p className="text-lg md:text-xl text-white/40 font-medium leading-relaxed">
                End-to-end encrypted pastebin with no server-side persistence of keys.
                Built for the privacy-first generation.
              </p>
            </motion.div>

            {/* Features Staggered */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 w-full max-w-5xl"
            >
              <FeatureCard
                icon={<Shield className="text-accent" />}
                title="E2E Encryption"
                description="AES-256-GCM encryption entirely in your browser. Server only sees static noise."
              />
              <FeatureCard
                icon={<Flame className="text-orange-500" />}
                title="Burn After Read"
                description="Self-destruct logic that wipes data from both Redis and DB after first access."
              />
              <FeatureCard
                icon={<Lock className="text-blue-500" />}
                title="Double Locked"
                description="Optional PBKDF2 password derivation for secondary layer security."
              />
            </motion.div>

            {/* Editor Area */}
            <motion.div variants={cardVariants} className="w-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Paste Workspace</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>
              <PasteEditor onPasteCreated={handlePasteCreated} />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Terminal size={18} />
              <span className="text-sm font-bold tracking-tighter">BINIFY</span>
            </div>
            <p className="text-sm text-white/20 font-medium">© 2025 sdad.pro. All Rights Reserved.</p>
          </div>
          <div className="flex items-center gap-8 text-xs font-bold text-white/20 uppercase tracking-widest">
            <a href="/privacy" className="hover:text-accent transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
            <a href="/security" className="hover:text-accent transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
      className="luxury-card flex flex-col gap-4 text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/40 leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
