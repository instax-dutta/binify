import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy policy',
    description:
        'What Binify stores, for how long, and how to delete it. Paste contents are encrypted before upload and keys never reach the server.',
    alternates: { canonical: '/privacy' },
    openGraph: {
        title: 'Privacy policy | Binify',
        description: 'What is stored, for how long, and how to delete it.',
        url: 'https://bin.sdad.pro/privacy',
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return children;
}