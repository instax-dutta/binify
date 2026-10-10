import Folio, { Chapter } from '@/components/Folio';

export const metadata = { title: 'Terms' };

export default function TermsPage() {
    return (
        <Folio
            eyebrow="THE TERMS OF THE ORDER"
            title="Terms"
            lede="Last updated: February 2026."
        >
            <Chapter mark="I" title="Acceptable use">
                <p>
                    Using Binify confirms you will not use it for anything unlawful -
                    distributing malware, stolen data, or any content that breaks applicable
                    law. The keeper may remove material that breaks these terms.
                </p>
            </Chapter>

            <Chapter mark="II" title="No promises except the ones stated">
                <p>
                    Binify is offered <strong>as is</strong>, without warranty. Because it is
                    zero-knowledge, losing a link or a guard word is unrecoverable - the order
                    has no back door and will not pretend otherwise. It is not responsible for
                    data loss, downtime, or third-party misuse.
                </p>
            </Chapter>

            <Chapter mark="III" title="Burning is final">
                <p>
                    Content is destroyed according to the terms chosen at sealing: a timer, a
                    number of readings, or on first reading. Once burned, it is{' '}
                    <strong>irrecoverable</strong> - by design, not by accident.
                </p>
            </Chapter>

            <Chapter mark="IV" title="Changes">
                <p>
                    These terms and the service may change over time. Continued use after a
                    change is acceptance of it.
                </p>
            </Chapter>
        </Folio>
    );
}
