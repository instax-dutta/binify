'use client';

import { useState, useRef, useEffect, useMemo, useId, useCallback } from 'react';
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
    'aria-labelledby'?: string;
}

export default function LuxurySelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    className,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
}: LuxurySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const reactId = useId();
    const listboxId = `listbox-${reactId}`;
    const optionId = (i: number) => `option-${reactId}-${i}`;

    const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

    const filteredOptions = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, searchTerm]);

    const close = useCallback((refocus = true) => {
        setIsOpen(false);
        setSearchTerm('');
        setActiveIndex(-1);
        if (refocus) triggerRef.current?.focus();
    }, []);

    // Dismiss on outside pointer interaction only. A focusout handler here would
    // fire while tabbing between options and collapse the list mid-navigation.
    useEffect(() => {
        if (!isOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) close(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [isOpen, close]);

    // Keep the highlighted option scrolled into view during keyboard navigation.
    useEffect(() => {
        if (!isOpen || activeIndex < 0) return;
        // Derive the id here rather than depending on optionId, which is
        // rebuilt every render and would re-run this effect each time.
        const id = `option-${reactId}-${activeIndex}`;
        listRef.current
            ?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, activeIndex, reactId]);

    const open = (startIndex = 0) => {
        setIsOpen(true);
        setSearchTerm('');
        const current = options.findIndex((o) => o.value === value);
        setActiveIndex(startIndex === -1 ? Math.max(0, current) : startIndex);
    };

    const commit = (optionValue: string) => {
        onChange(optionValue);
        close();
    };

    const onTriggerKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                open();
                break;
            case 'ArrowUp':
                e.preventDefault();
                open();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (isOpen) commit(filteredOptions[activeIndex]?.value ?? value);
                else open();
                break;
            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    close();
                }
                break;
            case 'Home':
                if (isOpen) {
                    e.preventDefault();
                    setActiveIndex(0);
                }
                break;
            case 'End':
                if (isOpen) {
                    e.preventDefault();
                    setActiveIndex(filteredOptions.length - 1);
                }
                break;
            case 'Tab':
                // Tabbing away should not strand the list open.
                if (isOpen) close(false);
                break;
        }
    };

    const onListKeyDown = (e: React.KeyboardEvent) => {
        const last = filteredOptions.length - 1;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => (i < last ? i + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => (i > 0 ? i - 1 : last));
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(last);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex <= last) {
                    commit(filteredOptions[activeIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                close();
                break;
            case 'Tab':
                close(false);
                break;
        }
    };

    const onSearchKeyDown = (e: React.KeyboardEvent) => {
        // While the search box has focus the arrow keys must move the option
        // highlight rather than move the caret.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const last = filteredOptions.length - 1;
            if (last < 0) return;
            setActiveIndex((i) =>
                e.key === 'ArrowDown' ? (i < last ? i + 1 : 0) : i > 0 ? i - 1 : last
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                commit(filteredOptions[activeIndex].value);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    };

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                id={id}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                onClick={() => (isOpen ? close(false) : open(-1))}
                onKeyDown={onTriggerKeyDown}
                  className={cn(
                      'paper-input font-data text-xs flex items-center justify-between gap-3 text-left cursor-pointer',
                      isOpen && '[border-bottom-color:var(--wax)]'
                  )}
              >
                  <span className={cn('truncate flex-1', !selectedOption && 'opacity-60')}>
                      {selectedOption ? selectedOption.label : placeholder}
                  </span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"
                      className={cn('shrink-0 opacity-70 transition-transform duration-300', isOpen && 'rotate-180')}
                  >
                      <path d="M5 9 L12 16 L19 9" />
                  </svg>
              </button>

            {isOpen && (
                <div className="anim-fade absolute z-[100] mt-2 w-full slip overflow-hidden">
                    {options.length > 5 && (
                        <div className="p-2" style={{ borderBottom: '1px solid rgba(43,36,26,.22)' }}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search..."
                                aria-label={`Filter ${ariaLabel ?? 'options'}`}
                                aria-controls={listboxId}
                                aria-activedescendant={
                                    activeIndex >= 0 ? optionId(activeIndex) : undefined
                                }
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={onSearchKeyDown}
                                className="w-full bg-transparent px-2 py-1.5 text-xs outline-none text-ink placeholder:text-ink/50 font-data"
                            />
                        </div>
                    )}

                    <div
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        aria-label={ariaLabel ?? ariaLabelledBy ? String(ariaLabel ?? ariaLabelledBy) : 'Options'}
                        aria-activedescendant={
                            options.length > 5 || activeIndex >= 0
                                ? activeIndex >= 0
                                    ? optionId(activeIndex)
                                    : undefined
                                : undefined
                        }
                        tabIndex={-1}
                        onKeyDown={onListKeyDown}
                        className="max-h-[240px] overflow-y-auto overflow-x-hidden py-1 custom-scrollbar"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, i) => {
                                const isSelected = option.value === value;
                                const isActive = i === activeIndex;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        id={optionId(i)}
                                        aria-selected={isSelected}
                                        onClick={() => commit(option.value)}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        className={cn(
                                            'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-150 rounded-[9999px] text-left',
                                            isSelected
                                                ? 'bg-[#1ed760]/10 text-[#1ed760] font-bold'
                                                : 'text-[#b3b3b3] hover:bg-white/5 hover:text-white',
                                            isActive && !isSelected && 'bg-white/5 text-white'
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" className="shrink-0"><path d="M4.5 12.5 L9.5 17.5 L20 6.5"/></svg>
                                          )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-xs text-ink/60" role="presentation">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}