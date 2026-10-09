import type { Metadata } from 'next';
import PasteLoader from '@/components/PasteLoader';

/**
 * Paste pages are never indexable.
 *
 * Two independent reasons, either of which alone justifies this:
 *
 * 1. Privacy. A paste URL existing is itself sensitive. Letting a crawler
 *    record the URL leaks that a given paste was created and when, and search
 *    results would preserve it indefinitely after the paste has expired.
 * 2. Value. The page has nothing indexable on it. The ciphertext renders
 *    client-side only, so a crawler sees an empty shell.
 *
 * `noindex, nofollow` keeps the fragment key out of crawl records and stops
 * authority flowing to these URLs.
 */
export const metadata: Metadata = {
    title: 'Paste',
    description: 'End-to-end encrypted paste.',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
    },
    // A paste is a single unguessable URL; there is nothing for a visitor to
    // follow on to.
    alternates: { canonical: '/p' },
};

export default async function ViewPastePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <PasteLoader pasteId={id} />;
}