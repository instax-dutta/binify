import Folio, { Chapter } from '@/components/Folio';

export const metadata = { title: 'Security' };

export default function SecurityPage() {
    return (
        <Folio
            eyebrow="HOW THE SECRET STAYS A SECRET"
            title="Security"
            lede="The cipher, the keys, and what stands between you and the drawer."
        >
            <Chapter mark="I" title="The cipher">
                <p>
                    Your message is sealed on your machine with the Web Crypto API -
                    <strong> AES-256-GCM</strong>, an authenticated cipher. The six words
                    under a slip are not decoration: the auth tag means even one altered byte
                    anywhere in the envelope is detected, and nothing is shown but a refusal.
                </p>
            </Chapter>

            <Chapter mark="II" title="Where the key lives">
                <p>
                    In the <strong>fragment</strong> - the part of the link after{' '}
                    <code>#</code>. Your browser does not send fragments to servers, so the key
                    never arrives here, never enters a log, and never reaches the database. A
                    stolen drawer still yields nothing.
                </p>
            </Chapter>

            <Chapter mark="III" title="When the two of you share a word">
                <p>
                    A guard word is worked into the derivation: new slips use{' '}
                    <strong>Argon2id</strong>, a deliberately slow memory-hard function that
                    punishes brute force; older slips sealed with <strong>PBKDF2</strong> still
                    open exactly as they did the day they were written.
                </p>
            </Chapter>

            <Chapter mark="IV" title="The walls around the desk">
                <ul>
                    <li><strong>Content Security Policy</strong> - every script and style is pinned to this origin; no third-party foot ever crosses.</li>
                    <li><strong>HSTS</strong> - the desk demands TLS.</li>
                    <li><strong>X-Frame-Options</strong> - the slipping may not be framed.</li>
                    <li><strong>Durable rate limits</strong> - abuse is counted atomically in the ledger, not in memory that forgets.</li>
                </ul>
            </Chapter>
        </Folio>
    );
}
