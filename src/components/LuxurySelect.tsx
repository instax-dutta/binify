'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    label: string;
    value: string;
}

interface LuxurySelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function LuxurySelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    className
}: LuxurySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "luxury-input flex items-center justify-between gap-2 text-left transition-all",
                    isOpen && "border-accent/40 ring-1 ring-accent/20 bg-white/[0.07]"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-gray-500")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-white/20 transition-transform duration-300",
                        isOpen && "rotate-180 text-accent/50"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-50 mt-2 w-full luxury-glass rounded-xl overflow-hidden shadow-2xl border-white/10 p-1.5 backdrop-blur-2xl bg-black/80"
                    >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                                            isSelected
                                                ? "bg-accent/10 text-accent font-bold"
                                                : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                        )}
                                    >
                                        <span className="relative z-10">{option.label}</span>
                                        {isSelected && (
                                            <motion.div layoutId="check">
                                                <Check size={14} />
                                            </motion.div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-accent/5 rounded-lg blur-sm" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
