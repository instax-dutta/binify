'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Book, Globe, ChevronLeft } from 'lucide-react';

export default function ErrorPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-6 overflow-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto max-w-2xl text-center space-y-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="luxury-card border-red-500/20 p-12 space-y-8 relative overflow-hidden"
                >
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-scanline pointer-events-none opacity-[0.03]" />

                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-lg shadow-red-500/5">
                        <ShieldAlert size={48} className="text-red-500" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">404: Payload Lost</h1>
                        <p className="text-white/40 font-medium text-lg leading-relaxed">
                            The communication link was severed or the sector does not exist.
                            The target data may have been purged or burned.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="/" className="btn-luxury-primary w-full sm:w-auto px-8 py-4">
                            Return to Control
                        </a>
                        <a href="/docs" className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                            <Book size={16} /> Technical Docs
                        </a>
                    </div>
                </motion.div>

                <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                        Status: Disconnected
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                        Secure Link: Active
                    </div>
                </div>
            </div>
        </main>
    );
}
