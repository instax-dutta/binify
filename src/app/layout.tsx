import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Binify - Zero-Knowledge Encrypted Pastebin',
  description:
    'Share secrets securely with end-to-end encryption. Zero-knowledge pastebin with burn-after-read, password protection, and syntax highlighting.',
  keywords: [
    'pastebin',
    'encrypted',
    'zero-knowledge',
    'privacy',
    'secure',
    'paste',
    'share',
    'burn after read',
  ],
  authors: [{ name: 'sdad.pro' }],
  openGraph: {
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Share secrets securely with end-to-end encryption',
    url: 'https://bin.sdad.pro',
    siteName: 'Binify',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Share secrets securely with end-to-end encryption',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
