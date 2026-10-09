import type { Metadata } from 'next';

/**
 * The revoke console is a management tool, not a destination. It is a client
 * component so it cannot export metadata itself; the segment layout can.
 */
export const metadata: Metadata = {
    title: 'Revoke a paste',
    description:
        'Permanently delete a Binify paste or rotate its access link using the deletion token you were given when it was created.',
    alternates: { canonical: '/revoke' },
    robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
    },
};

export default function RevokeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}