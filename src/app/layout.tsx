import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

/*
 * Fonts are committed to the repository rather than fetched from Google during
 * the build. The files were taken from Google Fonts (all three are SIL Open Font
 * License) and are served from this origin only.
 *
 * next/font/google downloads at build time, which makes every build depend on
 * reaching fonts.googleapis.com. That is not a theoretical concern: a gate build
 * failed on a transient network error and produced module-not-found for the font
 * CSS. Committing the files makes the build hermetic, keeps the visitor's
 * address away from Google, and lets the CSP stay at 'self' for styles and
 * fonts.
 */
/*
 * Two voices, as committed in .design/round-01/SPEC.md: Cormorant Garamond is
 * the order's voice (titles, mottos, message text) and IBM Plex Mono is the
 * data hand (labels, hashes, links). Both are committed files, so the build
 * stays hermetic and the CSP keeps font-src 'self'.
 */
const voice = localFont({
    src: [
        { path: './fonts/cormorant-500.woff2', weight: '500', style: 'normal' },
        { path: './fonts/cormorant-500-italic.woff2', weight: '500', style: 'italic' },
        { path: './fonts/cormorant-600.woff2', weight: '600', style: 'normal' },
    ],
    variable: '--font-voice',
    display: 'swap',
});

const data = localFont({
    src: [
        { path: './fonts/plex-mono-400.woff2', weight: '400', style: 'normal' },
        { path: './fonts/plex-mono-500.woff2', weight: '500', style: 'normal' },
    ],
    variable: '--font-data',
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
    /*
     * The brand is the pressed wax seal, drawn in .design/round-01 and rendered
     * under /brand/. Served from this origin so the markup is usable on
     * previews and localhost alike.
     */
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/brand/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Binify - Zero-Knowledge Encrypted Pastebin',
    description: 'Military-grade end-to-end encryption for your sensitive data. Privacy by design.',
    url: 'https://bin.sdad.pro',
    siteName: 'Binify',
    images: [
      {
        url: '/brand/og-sanctum.jpg',
        width: 1200,
        height: 630,
        alt: 'Binify — a wax-sealed slip of vellum: Spoken once, then silence.',
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
    images: ['/brand/og-sanctum.jpg'],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: '#0f0c09',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${voice.variable} ${data.variable}`}>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
