'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Cpu, Lock, ChevronLeft } from 'lucide-react';

export default function SecurityPage() {
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
                            <ShieldAlert size={28} />
                            <h1 className="title-xl">Security Architecture</h1>
                        </div>
                        <p className="text-body max-w-2xl">Technical details on how your secrets stay secret.</p>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-8 space-y-10">
                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Cpu size={16} className="text-[#1ed760]" />
                                Client-Side Cryptography
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                All encryption and decryption happens on your device using the <strong>Web Crypto API</strong>. We use <strong>AES-256-GCM</strong>, a military-grade authenticated encryption standard, ensuring both confidentiality and integrity.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Lock size={16} className="text-[#1ed760]" />
                                Key Management
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                Your encryption keys are stored in the URL <strong>fragment</strong> (the part after the #). Browsers do not send fragments to the server. Even if our database is compromised, your data remains secure.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white flex items-center gap-2">
                                <Fingerprint size={16} className="text-[#1ed760]" />
                                Secondary Protection (PBKDF2)
                            </h2>
                            <p className="text-sm text-[#b3b3b3] leading-relaxed">
                                When you add a password, we use <strong>PBKDF2</strong> with 100,000 iterations and a unique salt per paste. This protects against brute-force attacks.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="title-md text-white">Network Security</h2>
                            <ul className="list-disc list-inside text-sm text-[#b3b3b3] space-y-1.5">
                                <li>Strong Content Security Policy (CSP) headers to prevent XSS</li>
                                <li>HSTS for forced HTTPS</li>
                                <li>X-Frame-Options to prevent clickjacking</li>
                                <li>Strict rate limiting powered by Upstash Redis</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
