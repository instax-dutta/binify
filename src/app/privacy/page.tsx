import Folio, { Chapter } from '@/components/Folio';

export const metadata = { title: 'Privacy' };

export default function PrivacyPage() {
    return (
        <Folio
            eyebrow="THE ORDER'S WORD ON PRIVACY"
            title="Privacy"
            lede="Last updated: February 2026 — what we keep, which is almost nothing."
        >
            <Chapter mark="I" title="No plaintext, ever">
                <p>
                    The order is built so it <strong>cannot</strong> read your message.
                    Encryption and decryption happen in your browser. What is stored after
                    sealing is noise, and the key to it is never transmitted.
                </p>
            </Chapter>

            <Chapter mark="II" title="No cookies, no tracking">
                <p>
                    No analytics scripts, no third-party marketing, no tracking of any kind.
                    Addresses are briefly hashed to slow abuse of the desk and are purged
                    regularly.
                </p>
            </Chapter>

            <Chapter mark="III" title="What is stored">
                <p>
                    Sealed ciphertext, and a small amount of operational metadata: when a slip
                    should burn, how many readings it allows, whether a guard word exists.
                    These columns describe the envelope, not the letter.
                </p>
            </Chapter>

            <Chapter mark="IV" title="Contact">
                <p>
                    For security inquiries, reach the keeper via sdad.pro.
                </p>
            </Chapter>
        </Folio>
    );
}
