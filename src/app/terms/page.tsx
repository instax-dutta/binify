'use client';

import { motion } from 'framer-motion';
import { Gavel, AlertTriangle, FileText, ChevronLeft } from 'lucide-react';

export default function TermsPage() {
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
                            <Gavel size={32} />
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Terms of Service</h1>
                        </div>
                        <p className="text-xl text-white/40 font-medium">Last updated: December 2025</p>
                    </div>

                    <div className="luxury-card space-y-8 p-10">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <FileText size={20} className="text-accent" />
                                Acceptable Use
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                By using Binify, you agree not to use the service for any illegal activities. This includes, but is not limited to, the distribution of malware, stolen data, or any content that violates protected laws. We reserve the right to remove any content that is reported and found to be in violation of these terms.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <AlertTriangle size={20} className="text-accent" />
                                Disclaimer of Warranty
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Binify is provided "as is" without any warranties of any kind. As a zero-knowledge service, we cannot recover data if you lose your decryption key. We are not responsible for any data loss, server downtime, or misuse of the service by third parties.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">Expiration and Deletion</h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Content is automatically deleted based on the expiration settings you choose during creation. "Burn After Reading" pastes are purged immediately after the first successful retrieval. Once deleted, data is irrecoverable.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">Modifications</h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                We reserve the right to modify these terms or the service at any time. Continued use of the platform after changes implies acceptance of the updated terms.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
