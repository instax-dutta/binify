'use client';

import { motion } from 'framer-motion';
import { Book, Code, Zap, Shield, ChevronLeft, Terminal, Info } from 'lucide-react';

export default function DocsPage() {
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
                            <Book size={28} />
                            <h1 className="title-xl">Documentation</h1>
                        </div>
                        <p className="text-body max-w-2xl">Everything you need to know about using Binify.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#181818] rounded-lg p-6 space-y-3 hover:bg-[#1f1f1f] transition-colors">
                            <Zap size={20} className="text-[#1ed760]" />
                            <h3 className="title-md text-white">Getting Started</h3>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Enter your text or code into the editor. Choose expiration or view limits, and click &quot;Encrypt & Share&quot;. Your data is encrypted immediately in your browser.
                            </p>
                        </div>
                        <div className="bg-[#181818] rounded-lg p-6 space-y-3 hover:bg-[#1f1f1f] transition-colors">
                            <Code size={20} className="text-[#1ed760]" />
                            <h3 className="title-md text-white">Syntax Highlighting</h3>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Binify supports 20+ languages with automatic detection. Select your language manually for perfect formatting.
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-8 space-y-10">
                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Shield size={18} className="text-[#1ed760]" />
                                Zero-Knowledge Design
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Binify follows the principle of <strong>Zero-Knowledge</strong>. The server is &quot;blind&quot; to your content. This is achieved by storing the decryption key in the URL fragment (the part after the #), which is never sent to our servers by your browser.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Terminal size={18} className="text-[#1ed760]" />
                                Self-Destruction (Burn)
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                When &quot;Burn after reading&quot; is enabled, the server deletes the encrypted data immediately after it is retrieved for the first time. The secret exists only as long as it needs to be seen once.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <div className="bg-[#1f1f1f] rounded-lg p-5 flex gap-3">
                                <Info size={20} className="text-[#1ed760] shrink-0 mt-0.5" />
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-[0.05em]">Important</h4>
                                    <p className="text-xs text-[#b3b3b3] leading-relaxed">
                                        If you lose the URL generated for your paste, the data is <strong>permanently gone</strong>. We have no way to recover it.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="title-md text-white">FAQs</h2>
                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">What is the maximum paste size?</h4>
                                    <p className="text-sm text-[#b3b3b3]">The current limit is 1MB per paste.</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Does Binify store my IP?</h4>
                                    <p className="text-sm text-[#b3b3b3]">IPs are temporarily hashed for rate limiting and purged regularly.</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">Is Binify freely hostable?</h4>
                                    <p className="text-sm text-[#b3b3b3]">Yes. Binify is designed to be self-hosted on platforms like Vercel.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
