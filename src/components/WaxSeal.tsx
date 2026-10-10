/**
 * The pressed wax seal.
 *
 * One vector serves every appearance of the brand's single most important
 * object: the composer's action, the sealed screen, the favicon, the OG image.
 * The defs block holds the shared geometry; hosts reference it with <use>. A
 * flat matte impression with a rim legend reads as wax; anything glossy reads
 * as an app icon, which two review rounds rejected.
 */
export function WaxSealDefs() {
    return (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
            <defs>
                <radialGradient id="waxface" cx="42%" cy="34%" r="72%">
                    <stop offset="0%" stopColor="#8a3a33" />
                    <stop offset="55%" stopColor="#7a2e2a" />
                    <stop offset="100%" stopColor="#541f1b" />
                </radialGradient>
                <path id="seal-legend-path" d="M 60,15 a45,45 0 1,1 -0.01,0 z" fill="none" />
                <g id="sealface">
                    <circle cx="60" cy="60" r="56" fill="url(#waxface)" />
                    <ellipse cx="44" cy="42" rx="14" ry="10" fill="#96423c" opacity=".35" />
                    <ellipse cx="78" cy="76" rx="16" ry="12" fill="#54201c" opacity=".5" />
                    <ellipse cx="62" cy="30" rx="9" ry="6" fill="#9c4a44" opacity=".25" />
                    <circle cx="60" cy="60" r="52.5" fill="none" stroke="#4a1c18" strokeWidth="1.6" />
                    <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(240,226,208,.16)" strokeWidth="1" />
                    <text
                        fontSize="6.6"
                        letterSpacing="2.1"
                        fill="rgba(240,226,208,.62)"
                        fontWeight="500"
                        style={{ fontFamily: 'var(--font-data)' }}
                    >
                        <textPath href="#seal-legend-path" startOffset="0">
                            SPOKEN ONCE · THEN SILENCE · SEALS THE BURN ·
                        </textPath>
                    </text>
                    <text
                        x="60" y="79" textAnchor="middle"
                        fontSize="52" fontWeight="600" fill="#3f1714" opacity=".9"
                        style={{ fontFamily: 'var(--font-voice)' }}
                    >
                        B
                    </text>
                    <text
                        x="60" y="77.6" textAnchor="middle"
                        fontSize="52" fontWeight="600" fill="#7f342e" opacity=".85"
                        style={{ fontFamily: 'var(--font-voice)' }}
                    >
                        B
                    </text>
                </g>
            </defs>
        </svg>
    );
}

export function WaxSeal({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <use href="#sealface" />
        </svg>
    );
}
