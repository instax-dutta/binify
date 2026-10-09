import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Security model',
    description:
        'What Binify can and cannot see: zero-knowledge encryption, PBKDF2 key derivation, hashed deletion tokens, constant-time comparison, and rate limiting.',
    alternates: { canonical: '/security' },
    openGraph: {
        title: 'Security model | Binify',
        description: 'Exactly what the server can and cannot see, and why.',
        url: 'https://bin.sdad.pro/security',
    },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
    return children;
}