'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Shield,
  Flame,
  Terminal,
  Lock,
  ShieldCheck,
  Globe,
  Github
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

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
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
    <main className="min-h-screen selection:bg-accent/30 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <motion.div
              whileHover={{ rotate: 90, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-lg shadow-accent/20 transition-all duration-500"
            >
              <Terminal size={22} className="text-black" strokeWidth={2.5} />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">Binify</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black leading-none mt-0.5">Zero Knowledge</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="/docs" className="text-sm font-medium text-white/50 hover:text-white hover:translate-y-[-1px] transition-all">Documentation</a>
            <div className="h-4 w-px bg-white/10" />
            <a href="https://github.com/instax-dutta/binify" target="_blank" rel="noopener noreferrer" className="p-2 text-white/30 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href="https://sdad.pro" className="text-sm font-semibold text-accent flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent hover:text-black transition-all">
              <Globe size={14} />
              sdad.pro
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
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
            {/* Hero Header */}
            <div className="text-center space-y-5 mb-24 max-w-3xl">
              <motion.div variants={cardVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-accent text-[10px] font-black tracking-widest uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Secure Transmission Nexus
              </motion.div>

              <motion.h2 variants={cardVariants} className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.1]">
                Your Secrets, <br />
                <span className="text-accent">Truly Anonymous.</span>
              </motion.h2>

              <motion.p variants={cardVariants} className="text-base md:text-lg text-white/40 font-medium leading-relaxed max-w-2xl mx-auto">
                End-to-end encrypted pastebin with no server-side persistence of keys.
                Built for the privacy-first generation.
              </motion.p>
            </div>

            {/* Features Staggered */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-40 w-full max-w-5xl"
            >
              <FeatureCard
                icon={<Shield size={20} className="text-accent" />}
                title="E2E Protection"
                description="AES-256-GCM encryption entirely in your browser. Server only sees noise."
                delay={0}
              />
              <FeatureCard
                icon={<Flame size={20} className="text-orange-500" />}
                title="Auto-Purge"
                description="Self-destruct logic wipes data from both Redis and DB after threshold."
                delay={1}
              />
              <FeatureCard
                icon={<Lock size={20} className="text-blue-500" />}
                title="Zero-Knowledge"
                description="No keys touch our server. Even if we wanted to, we can't see your data."
                delay={2}
              />
            </motion.div>

            {/* Editor Area */}
            <motion.div variants={cardVariants} className="w-full relative group">
              <div className="absolute inset-0 bg-accent/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Binary Workspace</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>
                <PasteEditor onPasteCreated={handlePasteCreated} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex items-center gap-3 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-pointer">
              <Terminal size={20} />
              <span className="text-lg font-black tracking-tighter">BINIFY</span>
            </div>
            <p className="text-sm text-white/20 font-medium">© 2025 sdad.pro. Powered by pure cryptography.</p>
          </div>
          <div className="flex items-center gap-10 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
            <a href="https://github.com/instax-dutta/binify" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-2">
              <Github size={12} />
              GitHub
            </a>
            <a href="/revoke" className="hover:text-accent transition-colors">Revoke Link</a>
            <a href="/privacy" className="hover:text-accent transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
            <a href="/security" className="hover:text-accent transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" }}
      className="luxury-card flex flex-col gap-4 text-left p-6 border border-white/5 transition-colors group cursor-default"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay * 0.5 }}
        className="w-11 h-11 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:border-accent/30 transition-colors"
      >
        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        {icon}
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-accent transition-colors">{title}</h3>
        <p className="text-sm text-white/40 leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}
