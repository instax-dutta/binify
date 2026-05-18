'use client';

import { motion } from 'framer-motion';
import { Gavel, AlertTriangle, FileText, ChevronLeft } from 'lucide-react';

export default function TermsPage() {
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
                            <Gavel size={28} />
                            <h1 className="title-xl">Terms of Service</h1>
                        </div>
                        <p className="text-caption">Last updated: December 2025</p>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-8 space-y-8">
                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <FileText size={16} className="text-[#1ed760]" />
                                Acceptable Use
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                By using Binify, you agree not to use the service for illegal activities. This includes distribution of malware, stolen data, or any content that violates applicable laws. We reserve the right to remove content that violates these terms.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <AlertTriangle size={16} className="text-[#1ed760]" />
                                Disclaimer of Warranty
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Binify is provided &quot;as is&quot; without warranties. As a zero-knowledge service, we cannot recover data if you lose your decryption key. We are not responsible for data loss, downtime, or third-party misuse.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white">Expiration and Deletion</h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Content is automatically deleted based on your chosen expiration settings. &quot;Burn after reading&quot; pastes are purged immediately after first retrieval. Once deleted, data is irrecoverable.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white">Modifications</h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                We reserve the right to modify these terms or the service at any time. Continued use after changes implies acceptance.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
