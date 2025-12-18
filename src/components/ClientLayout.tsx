'use client';

import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.4, // Increased for elegant feel
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.1,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            lenis.destroy();
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative min-h-screen"
            >
                {/* Dynamic Background Elements */}
                <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-black" />
                    <motion.div
                        animate={{
                            x: mousePos.x * 0.05,
                            y: mousePos.y * 0.05,
                        }}
                        className="glow-mesh bg-mesh"
                    />

                    {/* Extra Bloom Blobs */}
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-secondary/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative z-10 w-full">
                    {children}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
