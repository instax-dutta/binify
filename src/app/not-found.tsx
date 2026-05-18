'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Book, ChevronLeft } from 'lucide-react';

export default function ErrorPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-6 overflow-hidden">
            <div className="container mx-auto max-w-2xl text-center space-y-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#181818] rounded-lg p-10 space-y-6"
                >
                    <div className="w-20 h-20 bg-[#f3727f]/10 rounded-full flex items-center justify-center mx-auto">
                        <ShieldAlert size={36} className="text-[#f3727f]" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="title-xl text-white">404</h1>
                        <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-md mx-auto">
                            The payload you are looking for has been purged, burned, or never existed.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <a href="/" className="btn-spotify-primary tracking-[0.05em]">
                            <ChevronLeft size={14} />
                            RETURN HOME
                        </a>
                        <a href="/docs" className="btn-spotify-secondary tracking-[0.05em]">
                            <Book size={14} />
                            DOCS
                        </a>
                    </div>
                </motion.div>

                <div className="flex justify-center gap-6 text-[0.5rem] font-bold uppercase tracking-[0.2em] text-white/20">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-[#f3727f]" />
                        Link: Disconnected
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-[#1ed760]" />
                        Encryption: Active
                    </div>
                </div>
            </div>
        </main>
    );
}
