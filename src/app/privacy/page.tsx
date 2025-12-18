'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Terminal, ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-4xl">
                <a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors mb-8 uppercase tracking-widest">
                    <ChevronLeft size={14} /> Back to Session
                </a>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-accent">
                            <Shield size={32} />
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Privacy Policy</h1>
                        </div>
                        <p className="text-xl text-white/40 font-medium">Last updated: December 2025</p>
                    </div>

                    <div className="luxury-card space-y-8 p-10">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Lock size={20} className="text-accent" />
                                No Data Collection
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Binify is designed with a zero-knowledge architecture. We do not collect, store, or have access to the plaintext content of your pastes. All encryption and decryption processes occur locally within your browser.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Eye size={20} className="text-accent" />
                                No Cookies or Tracking
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                We do not use tracking cookies, analytics scripts, or third-party marketing tools. Your interaction with Binify is anonymous. We only maintain minimal logs required for rate-limiting and infrastructure stability (IP addresses are hashed and stored temporarily).
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Terminal size={20} className="text-accent" />
                                Infrastructure
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Encrypted payloads are stored in highly secure, transient storage. Metadata (expiration times, view counts) is stored in a structured database. Our infrastructure providers do not have access to your decryption keys, as they are never transmitted to our servers.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">Contact</h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                For security-related inquiries, please reach out via our official platforms at sdad.pro.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
