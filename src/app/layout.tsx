import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

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
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Military-grade end-to-end encryption for your sensitive data. Privacy by design.',
    url: 'https://bin.sdad.pro',
    siteName: 'Binify',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
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
    images: ['https://bin.sdad.pro/og-image.png'],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
