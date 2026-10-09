import type { MetadataRoute } from 'next';

const SITE = 'https://bin.sdad.pro';

/**
 * Only the pages that are meant to be found. Paste URLs are deliberately
 * absent: they are noindex, they change constantly, and listing them would
 * publish the existence of private pastes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return [
        { url: `${SITE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
        { url: `${SITE}/docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${SITE}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${SITE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ];
}