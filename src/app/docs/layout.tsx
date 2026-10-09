import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Documentation',
    description:
        'How Binify works: browser-side AES-256-GCM encryption, key handling in the URL fragment, expiry modes, link rotation, and self-destruct rules.',
    alternates: { canonical: '/docs' },
    openGraph: {
        title: 'Documentation | Binify',
        description: 'Encryption, expiry, rotation, and self-destruct, documented.',
        url: 'https://bin.sdad.pro/docs',
    },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return children;
}