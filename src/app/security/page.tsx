'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Cpu, Lock, ChevronLeft } from 'lucide-react';

export default function SecurityPage() {
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
                            <ShieldAlert size={32} />
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Security Architecture</h1>
                        </div>
                        <p className="text-xl text-white/40 font-medium tracking-tight">Technical details on how your secrets stay secret.</p>
                    </div>

                    <div className="luxury-card space-y-12 p-10">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Cpu size={20} className="text-accent" />
                                Client-Side Cryptography
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                All encryption and decryption happens on your device using the <strong>Web Crypto API</strong>. The plaintext never leaves your browser. We use <strong>AES-256-GCM</strong>, a military-grade authenticated encryption standard, to ensure both confidentiality and integrity.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Lock size={20} className="text-accent" />
                                Key Management
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                Your encryption keys are stored in the URL <strong>fragment</strong> (the part after the #). Browsers do not send fragments to the server during requests. This means even if our database or servers were compromised, your data remains secure as we never had the keys to begin with.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Fingerprint size={20} className="text-accent" />
                                Secondary Protection (PBKDF2)
                            </h2>
                            <p className="text-white/60 leading-relaxed font-normal">
                                When you choose to add a password, we utilize <strong>PBKDF2</strong> (Password-Based Key Derivation Function 2) with 100,000 iterations and a unique salt for every paste. This protects against brute-force attacks and ensures your password effectively strengthens the encryption key.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-white">Network Security</h2>
                            <ul className="list-disc list-inside text-white/60 space-y-2 font-normal">
                                <li>Strong Content Security Policy (CSP) headers to prevent XSS.</li>
                                <li>HSTS (HTTP Strict Transport Security) for forced HTTPS.</li>
                                <li>X-Frame-Options to prevent clickjacking.</li>
                                <li>Strict Rate Limiting powered by Upstash Redis.</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
