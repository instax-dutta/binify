'use client';

import { useState } from 'react';
import PasteEditor from '@/components/PasteEditor';
import PasteCreated from '@/components/PasteCreated';

export default function HomePage() {
  const [createdPaste, setCreatedPaste] = useState<{
    pasteId: string;
    key: string;
  } | null>(null);

  const handlePasteCreated = (pasteId: string, key: string) => {
    setCreatedPaste({ pasteId, key });
  };

  const handleCreateAnother = () => {
    setCreatedPaste(null);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Binify</h1>
              <p className="text-sm text-text-secondary mt-1">
                Zero-knowledge encrypted pastebin
              </p>
            </div>
            <a
              href="https://sdad.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
            >
              by sdad.pro
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {createdPaste ? (
          <PasteCreated
            pasteId={createdPaste.pasteId}
            encryptionKey={createdPaste.key}
            onCreateAnother={handleCreateAnother}
          />
        ) : (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
                Share Secrets Securely
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                End-to-end encrypted pastebin with zero-knowledge architecture.
                Your data is encrypted in your browser before it reaches our
                servers.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              <div className="card-hover">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent-blue/10 rounded-lg">
                    <svg
                      className="w-6 h-6 text-accent-blue"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">
                      AES-256-GCM Encryption
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Military-grade encryption happens entirely in your browser
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-hover">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent-green/10 rounded-lg">
                    <svg
                      className="w-6 h-6 text-accent-green"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">
                      Burn After Reading
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Self-destruct pastes after first view or time limit
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-hover">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent-yellow/10 rounded-lg">
                    <svg
                      className="w-6 h-6 text-accent-yellow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">
                      Syntax Highlighting
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Beautiful code display with 20+ language support
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor */}
            <PasteEditor onPasteCreated={handlePasteCreated} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-tertiary">
            <p>
              © {new Date().getFullYear()} Binify. Open source and
              privacy-focused.
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-text-secondary transition-colors">
                How it works
              </a>
              <a href="#" className="hover:text-text-secondary transition-colors">
                Security
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-secondary transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
