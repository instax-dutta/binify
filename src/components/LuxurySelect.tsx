'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
    id?: string;
    'aria-label'?: string;
}

export default function LuxurySelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    className,
    id,
    'aria-label': ariaLabel
}: LuxurySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() =>
        options.find(opt => opt.value === value),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerSearchTerm)
        );
    }, [options, searchTerm]);

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
                id={id}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "input-spotify flex items-center justify-between gap-3 text-left cursor-pointer",
                    isOpen && "!bg-[#252525]"
                )}
            >
                <span className={cn("truncate flex-1", !selectedOption && "text-white/20")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "text-white/20 transition-transform duration-300",
                        isOpen && "rotate-180 text-[#1ed760]"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-[100] mt-2 w-full bg-[#181818] rounded-lg overflow-hidden shadow-[rgba(0,0,0,0.5)_0px_8px_24px] border border-white/5"
                    >
                        {options.length > 5 && (
                            <div className="p-2 border-b border-white/5">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#1f1f1f] border-none rounded-[9999px] px-3 py-2 text-xs outline-none text-white placeholder:text-white/20"
                                />
                            </div>
                        )}

                        <div
                            className="max-h-[240px] overflow-y-auto overflow-x-hidden p-1 scrollbar-hide scroll-smooth"
                            data-lenis-prevent
                            onWheel={(e) => e.stopPropagation()}
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => handleSelect(option.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-150 rounded-[9999px]",
                                                isSelected
                                                    ? "bg-[#1ed760]/10 text-[#1ed760] font-bold"
                                                    : "text-[#b3b3b3] hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && <Check size={14} className="shrink-0" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-xs text-white/20">
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
