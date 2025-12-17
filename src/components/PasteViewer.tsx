'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

interface PasteViewerProps {
    content: string;
    language?: string;
    title?: string;
    createdAt: number;
    expiresAt?: number;
    viewCount: number;
    maxViews?: number;
    willBurn: boolean;
}

export default function PasteViewer({
    content,
    language = 'plaintext',
    title,
    createdAt,
    expiresAt,
    viewCount,
    maxViews,
    willBurn,
}: PasteViewerProps) {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!expiresAt) return;

        const updateTimeLeft = () => {
            const now = Date.now();
            const diff = expiresAt - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadPaste = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title ? `${title}.txt` : 'paste.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-4 fade-in">
            {/* Burn Warning */}
            {willBurn && (
                <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <div className="text-sm">
                            <p className="font-medium text-accent-red mb-1">
                                ⚠️ This paste will self-destruct after you close this page
                            </p>
                            <p className="text-text-secondary">
                                This is a burn-after-read paste. Make sure to save the content
                                before leaving.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {title && (
                            <h1 className="text-2xl font-bold text-text-primary mb-2">
                                {title}
                            </h1>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                            <span>Created {new Date(createdAt).toLocaleString()}</span>
                            {expiresAt && (
                                <>
                                    <span>•</span>
                                    <span className="text-accent-yellow">
                                        Expires in {timeLeft}
                                    </span>
                                </>
                            )}
                            {maxViews && (
                                <>
                                    <span>•</span>
                                    <span>
                                        Views: {viewCount}/{maxViews}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')
                            }
                            className="btn-secondary text-sm"
                        >
                            {viewMode === 'formatted' ? 'Raw' : 'Formatted'}
                        </button>
                        <button onClick={copyToClipboard} className="btn-secondary text-sm">
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={downloadPaste} className="btn-secondary text-sm">
                            Download
                        </button>
                    </div>
                </div>

                {language && language !== 'plaintext' && (
                    <div className="mt-3">
                        <span className="badge-blue">{language}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="card p-0 overflow-hidden">
                {viewMode === 'raw' ? (
                    <pre className="p-6 overflow-x-auto text-sm font-mono text-text-primary whitespace-pre-wrap break-words">
                        {content}
                    </pre>
                ) : language === 'markdown' ? (
                    <div className="prose prose-invert max-w-none p-6">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                ) : language && language !== 'plaintext' ? (
                    <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            background: 'transparent',
                            fontSize: '0.875rem',
                        }}
                        showLineNumbers
                    >
                        {content}
                    </SyntaxHighlighter>
                ) : (
                    <pre className="p-6 overflow-x-auto text-sm font-mono text-text-primary whitespace-pre-wrap break-words">
                        {content}
                    </pre>
                )}
            </div>

            {/* Footer */}
            <div className="text-center">
                <a href="/" className="link text-sm">
                    Create your own encrypted paste →
                </a>
            </div>
        </div>
    );
}
