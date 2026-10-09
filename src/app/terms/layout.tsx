import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of service',
    description:
        'Terms governing use of Binify, including acceptable-use limits, the abuse policy, and liability for encrypted content.',
    alternates: { canonical: '/terms' },
    openGraph: {
        title: 'Terms of service | Binify',
        description: 'Acceptable use, abuse policy, and liability.',
        url: 'https://bin.sdad.pro/terms',
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}