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
    icon: '/favicon.png',
    apple: '/favicon.png',
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
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
