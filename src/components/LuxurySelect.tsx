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
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

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
                    "luxury-input flex items-center justify-between gap-3 text-left transition-all group",
                    isOpen && "border-accent/40 ring-1 ring-accent/20 bg-white/[0.07]"
                )}
            >
                <span className={cn("truncate flex-1 font-medium", !selectedOption && "text-white/20")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-white/20 transition-transform duration-500",
                        isOpen && "rotate-180 text-accent"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "circOut" }}
                        className="absolute z-[100] mt-2 w-full luxury-glass rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 backdrop-blur-3xl bg-black/90 flex flex-col"
                    >
                        {options.length > 5 && (
                            <div className="p-2 border-b border-white/5">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-accent/30 transition-colors placeholder:text-white/10"
                                />
                            </div>
                        )}

                        <div
                            className="max-h-[320px] overflow-y-auto overflow-x-hidden p-1.5 scrollbar-hide scroll-smooth"
                            data-lenis-prevent
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-300 group relative mb-0.5 last:mb-0",
                                                isSelected
                                                    ? "bg-accent/10 text-accent font-bold"
                                                    : "text-white/40 hover:bg-white/[0.04] hover:text-white"
                                            )}
                                        >
                                            <span className="relative z-10">{option.label}</span>
                                            {isSelected ? (
                                                <motion.div
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="relative z-10"
                                                >
                                                    <Check size={14} />
                                                </motion.div>
                                            ) : (
                                                <div className="w-1 h-1 rounded-full bg-white/5 group-hover:bg-accent/40 transition-colors" />
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-accent/5 rounded-xl blur-md" />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-xs text-white/20 font-medium">
                                    No matches found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
