'use client';

import { motion } from 'framer-motion';
import { Book, Code, Zap, Shield, ChevronLeft, Terminal, Info } from 'lucide-react';

export default function DocsPage() {
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
                            <Book size={32} />
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Documentation</h1>
                        </div>
                        <p className="text-xl text-white/40 font-medium">Everything you need to know about using Binify.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="luxury-card p-8 space-y-4">
                            <Zap size={24} className="text-accent" />
                            <h3 className="text-xl font-bold text-white">Getting Started</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium transition-colors">
                                Simply enter your text or code into the editor. Choose your desired expiration time or view limit, and click "Initialize Binify Paste". Your data is encrypted immediately.
                            </p>
                        </div>
                        <div className="luxury-card p-8 space-y-4">
                            <Code size={24} className="text-accent" />
                            <h3 className="text-xl font-bold text-white">Syntax Highlighting</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">
                                Binify automatically detects many popular languages. You can also manually select your language from the dropdown to ensure perfect formatting and highlighting.
                            </p>
                        </div>
                    </div>

                    <div className="luxury-card p-10 space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Shield size={22} className="text-accent" />
                                Zero-Knowledge Design
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Binify follows the principle of <strong>Zero-Knowledge</strong>. The server is "blind" to your content. This is achieved by storing the decryption key in the URL fragment (the part after the #), which is never sent to our servers by your browser.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Terminal size={22} className="text-accent" />
                                Self-Destruction (Burn)
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                When "Burn after reading" is enabled, the server deletes the encrypted data immediately after it is retrieved for the first time. This ensures that the secret exists only as long as it needs to be seen once.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex gap-4">
                                <Info size={24} className="text-accent shrink-0" />
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Important Warning</h4>
                                    <p className="text-xs text-white/40 leading-relaxed font-medium">
                                        If you lose the URL generated for your paste, the data is **permanently gone**. We have no way to recover it, reset your password, or provide the key.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">FAQs</h2>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-white font-bold mb-1">What is the maximum paste size?</h4>
                                    <p className="text-white/40 text-sm font-medium">The current limit is 1MB per paste, which is sufficient for thousands of lines of code.</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Does Binify store my IP?</h4>
                                    <p className="text-white/40 text-sm font-medium">We temporarily hash IP addresses for rate limiting purposes to prevent spam and abuse. These hashes are purged regularly.</p>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Is Binify freely hostable?</h4>
                                    <p className="text-white/40 text-sm font-medium">Yes, Binify is designed to be easily self-hosted on platforms like Vercel.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
