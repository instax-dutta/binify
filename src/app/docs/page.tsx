import Folio, { Chapter } from '@/components/Folio';

export const metadata = { title: 'Doctrine' };

export default function DocsPage() {
    return (
        <Folio
            eyebrow="THE DOCTRINE"
            title="How the order works"
            lede="Everything between the seal and the silence, explained plainly."
        >
            <Chapter mark="I" title="Getting started">
                <p>
                    Write the message on the slip. Choose when it burns, add a guard word if
                    the two of you share one, then press the seal. The cipher is worked on
                    your machine before a single byte leaves it.
                </p>
            </Chapter>

            <Chapter mark="II" title="What the server knows">
                <p>
                    Nothing it can act on. The slip travels as ciphertext; the key never
                    leaves the <strong>#</strong> part of your link, which browsers are told
                    never to send. The server holds noise, unreadable to us and to anyone
                    who takes the drawer.
                </p>
            </Chapter>

            <Chapter mark="III" title="Burning">
                <p>
                    A slip is read as many times as its maker allows, then it is destroyed in
                    one atomic stroke - not marked, not hidden, gone. A slip may also surrender
                    on a timer, on first reading, or on a fixed number of readings.
                </p>
            </Chapter>

            <Chapter mark="IV" title="The burn slip (recall)">
                <p>
                    Every sealed paste can also be issued a <strong>burn slip</strong>: a one-time
                    string that lets its maker recall the paste from the desk at{' '}
                    <code>/revoke</code>. Present the slip and the paste is destroyed wherever it
                    still exists.
                </p>
            </Chapter>

            <Chapter mark="V" title="Questions asked at the door">
                <p><strong>How large may a slip be?</strong> Deployments set their own ceiling;
                this one accepts messages up to 1 MB of sealed ciphertext.</p>
                <p className="mt-2"><strong>Am I recorded?</strong> Addresses are briefly hashed to slow abuse of the desk and are purged; nothing about your message is ever legible to us.</p>
                <p className="mt-2"><strong>May I exchange at my own desk?</strong> Yes - Binify is open source and its doctrine runs wherever your own data store does.</p>
            </Chapter>
        </Folio>
    );
}
