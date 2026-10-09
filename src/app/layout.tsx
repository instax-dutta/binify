import type { Metadata } from 'next';
import { DM_Sans, Figtree, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

/*
 * Fonts are downloaded and self-hosted at build time rather than pulled from
 * Google at runtime. That removes a render-blocking third-party stylesheet,
 * keeps the visitor's IP away from Google, and lets the CSP stay at 'self' for
 * styles and fonts.
 */
const display = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-display',
    display: 'swap',
});

const sans = Figtree({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Binify | Zero-Knowledge Encrypted Pastebin',
    template: '%s | Binify'
  },
  description: 'Share secrets securely with end-to-end, zero-knowledge encryption. Your data is encrypted in your browser before it reaches our servers.',
  keywords: [
    'Binify',
    'pastebin',
    'encrypted pastebin',
    'zero-knowledge',
    'end-to-end encryption',
    'secure text sharing',
    'burn after read',
    'private paste',
    'privacy tools',
    'secure sharing'
  ],
  authors: [{ name: 'sdad.pro', url: 'https://sdad.pro' }],
  creator: 'sdad.pro',
  metadataBase: new URL('https://bin.sdad.pro'),
  icons: {
    // Served from this origin rather than as absolute bin.sdad.pro URLs, so
    // the same markup is correct in preview deployments and on localhost.
    icon: [
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Military-grade end-to-end encryption for your sensitive data. Privacy by design.',
    url: 'https://bin.sdad.pro',
    siteName: 'Binify',
    images: [
      {
        url: '/og-image.jpg',
        // The real dimensions. They were previously declared as 1200x630
        // while the file was 1024x1024, which made platforms crop a square
        // image to a 1.91:1 box.
        width: 1024,
        height: 1024,
        alt: 'Binify - Secure Encrypted Pastebin',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Share secrets securely with end-to-end encryption. No keys ever touch the server.',
    creator: '@sdad_pro',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: '#1ed760',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
