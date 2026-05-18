'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Terminal, ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen pt-24 pb-20 px-6">
            <div className="container mx-auto max-w-4xl">
                <a href="/" className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold text-[#b3b3b3] hover:text-white transition-colors mb-6 uppercase tracking-[0.15em]">
                    <ChevronLeft size={12} /> BACK
                </a>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-10"
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[#1ed760]">
                            <Shield size={28} />
                            <h1 className="title-xl">Privacy Policy</h1>
                        </div>
                        <p className="text-caption">Last updated: December 2025</p>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-8 space-y-8">
                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Lock size={16} className="text-[#1ed760]" />
                                No Data Collection
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Binify is designed with a zero-knowledge architecture. We do not collect, store, or have access to the plaintext content of your pastes. All encryption and decryption processes occur locally within your browser.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Eye size={16} className="text-[#1ed760]" />
                                No Cookies or Tracking
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                We do not use tracking cookies, analytics scripts, or third-party marketing tools. IP addresses are hashed temporarily for rate-limiting only.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Terminal size={16} className="text-[#1ed760]" />
                                Infrastructure
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Encrypted payloads are stored in transient storage. Metadata (expiration, view counts) is stored in a structured database. Decryption keys are never transmitted.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white">Contact</h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                For security-related inquiries, reach out via sdad.pro.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
