import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLink, EndCta, SectionIntro } from './MarketingLayout';
import { FlowIllustration, ProductVisual } from './Visuals';

const chapters = [
    {
        title: 'Appointments',
        scene: 'appointments' as const,
        tag: '01 / KNOW THE DAY',
        heading: 'The day starts with a plan everyone can follow.',
        body: 'Book a patient with the right doctor and time, then keep their visit status visible as the day changes.',
        href: '/features/appointments',
    },
    {
        title: 'Live queue',
        scene: 'queue' as const,
        tag: '02 / RESPOND IN REAL TIME',
        heading: 'A queue that reflects what is actually happening.',
        body: 'Reception can see arrivals, waiting patients and calls in one place, and adjust the active order when needed.',
        href: '/features/live-queue',
    },
    {
        title: 'No-show assistance',
        scene: 'risk' as const,
        tag: '03 / REVIEW WITH CONTEXT',
        heading: 'A little more context before a slot goes quiet.',
        body: 'Explainable rules surface risk levels and reasons so staff can decide whether an appointment needs attention.',
        href: '/features/no-show-risk',
    },
];

export default function HomePage() {
    const [active, setActive] = useState(0);
    const chapter = chapters[active];
    return (
        <>
            <section className="m-home-hero">
                <div className="m-home-orbit" aria-hidden="true" />
                <div className="m-container m-home-hero-grid">
                    <div className="m-home-copy" data-hero>
                        <span className="m-eyebrow m-eyebrow-light">
                            <span className="m-pulse" /> CLINIC FLOW, CONNECTED
                        </span>
                        <h1>
                            Better patient flow.
                            <br />
                            <em>Better clinic days.</em>
                        </h1>
                        <p>
                            From appointments to arrivals, live queues and completed visits, Pravaah
                            helps your team stay organized throughout the clinic day.
                        </p>
                        <div className="m-hero-actions">
                            <Link className="m-button m-button-light" to="/product">
                                Explore Pravaah <span aria-hidden="true">↗</span>
                            </Link>
                            <Link className="m-button m-button-outline-light" to="/how-it-works">
                                See how it works
                            </Link>
                        </div>
                        <div className="m-home-hero-foot">
                            <span>01 — A clearer daily rhythm</span>
                            <span>↓ Scroll to explore</span>
                        </div>
                    </div>
                    <div className="m-hero-product" data-hero>
                        <div className="m-hero-visual-caption">
                            A connected view of the clinic day
                        </div>
                        <ProductVisual />
                        <div className="m-floating-card m-floating-card-top">
                            <span className="m-card-dot" /> Arrival recorded{' '}
                            <small>Ready for the queue</small>
                        </div>
                        <div className="m-floating-card m-floating-card-bottom">
                            Next in line <strong>02 / Waiting</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section className="m-trust-line">
                <div className="m-container">
                    <p>Made for the moments between booking and care.</p>
                    <div>
                        <span>APPOINTMENTS</span>
                        <span>ARRIVALS</span>
                        <span>LIVE QUEUE</span>
                        <span>VISIT COMPLETION</span>
                    </div>
                </div>
            </section>
            <section className="m-section m-problem">
                <div className="m-container m-problem-grid">
                    <div>
                        <SectionIntro
                            eyebrow="THE EVERYDAY GAP"
                            title="A booking is only the beginning."
                        >
                            Reception is coordinating arrivals. Doctors need an orderly next step.
                            Patients are waiting. When each update lives somewhere different, the
                            whole day becomes harder to read.
                        </SectionIntro>
                        <ArrowLink to="/how-it-works">See the connected workflow</ArrowLink>
                    </div>
                    <div className="m-problem-art" data-reveal>
                        <div className="m-problem-cards">
                            <div>
                                <span>01</span>
                                <strong>Booked</strong>
                                <small>On the schedule</small>
                            </div>
                            <div>
                                <span>02</span>
                                <strong>Arrived</strong>
                                <small>At reception</small>
                            </div>
                            <div>
                                <span>03</span>
                                <strong>Waiting</strong>
                                <small>In the queue</small>
                            </div>
                            <div>
                                <span>04</span>
                                <strong>Called</strong>
                                <small>Into the visit</small>
                            </div>
                        </div>
                        <div className="m-problem-connection">
                            <span />
                            One visible journey
                            <span />
                        </div>
                    </div>
                </div>
            </section>
            <section className="m-section m-pillars">
                <div className="m-container">
                    <SectionIntro
                        eyebrow="THE PRACTICAL DIFFERENCE"
                        title="Less guesswork at every handoff."
                    >
                        Pravaah gives clinic staff a shared picture of what is scheduled, what has
                        changed and what needs attention next.
                    </SectionIntro>
                    <div className="m-pillar-grid">
                        <article className="m-pillar m-pillar-a" data-reveal>
                            <span className="m-pillar-index">01 / PLAN</span>
                            <div className="m-mini-calendar">
                                <span>
                                    09:20 <b>Asha Mehra</b>
                                </span>
                                <span>
                                    10:10 <b>Kabir Shah</b>
                                </span>
                                <span>
                                    11:30 <b>Mina Dutta</b>
                                </span>
                            </div>
                            <h3>Keep appointments organized.</h3>
                            <p>
                                Bring doctor, patient, time and status together in a schedule the
                                team can work from.
                            </p>
                            <ArrowLink to="/features/appointments">Explore appointments</ArrowLink>
                        </article>
                        <article className="m-pillar m-pillar-b" data-reveal>
                            <span className="m-pillar-index">02 / MOVE</span>
                            <div className="m-mini-queue">
                                <span>
                                    <b>01</b> Called
                                </span>
                                <span>
                                    <b>02</b> Waiting
                                </span>
                                <span>
                                    <b>03</b> Arrived
                                </span>
                            </div>
                            <h3>Bring clarity to the live queue.</h3>
                            <p>
                                See who has arrived, who is waiting and which visit should move
                                next.
                            </p>
                            <ArrowLink to="/features/live-queue">Explore the queue</ArrowLink>
                        </article>
                        <article className="m-pillar m-pillar-c" data-reveal>
                            <span className="m-pillar-index">03 / REVIEW</span>
                            <div className="m-mini-risk">
                                <span>!</span>
                                <div>
                                    <strong>Risk context available</strong>
                                    <small>Reasons shown to staff</small>
                                </div>
                            </div>
                            <h3>Make informed decisions.</h3>
                            <p>
                                Review explainable no-show indicators while keeping every
                                operational choice with your team.
                            </p>
                            <ArrowLink to="/features/no-show-risk">
                                Explore risk assistance
                            </ArrowLink>
                        </article>
                    </div>
                </div>
            </section>
            <section className="m-section m-showcase">
                <div className="m-container">
                    <div className="m-showcase-head">
                        <SectionIntro
                            eyebrow="INSIDE THE WORKFLOW"
                            title="See the clinic day come together."
                        >
                            Choose a moment in the day to see how Pravaah helps staff keep it
                            moving.
                        </SectionIntro>
                        <span className="m-showcase-counter">0{active + 1} / 03</span>
                    </div>
                    <div className="m-showcase-grid">
                        <div
                            className="m-showcase-tabs"
                            role="tablist"
                            aria-label="Product preview"
                        >
                            {chapters.map((item, index) => (
                                <button
                                    id={`m-tab-${index}`}
                                    aria-controls="m-showcase-panel"
                                    aria-selected={active === index}
                                    role="tab"
                                    type="button"
                                    tabIndex={active === index ? 0 : -1}
                                    className={active === index ? 'active' : ''}
                                    key={item.title}
                                    onClick={() => setActive(index)}
                                    onKeyDown={(event) => {
                                        let next = index;
                                        if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
                                            next = (index + 1) % chapters.length;
                                        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
                                            next = (index + chapters.length - 1) % chapters.length;
                                        if (next !== index) {
                                            event.preventDefault();
                                            setActive(next);
                                            (
                                                event.currentTarget.parentElement?.querySelectorAll(
                                                    'button'
                                                )[next] as HTMLButtonElement
                                            )?.focus();
                                        }
                                    }}
                                >
                                    {item.title}
                                    <span aria-hidden="true">↗</span>
                                </button>
                            ))}
                        </div>
                        <div
                            className="m-showcase-panel"
                            id="m-showcase-panel"
                            role="tabpanel"
                            aria-labelledby={`m-tab-${active}`}
                            key={chapter.title}
                        >
                            <span className="m-eyebrow">{chapter.tag}</span>
                            <h3>{chapter.heading}</h3>
                            <p>{chapter.body}</p>
                            <ArrowLink to={chapter.href}>Explore this feature</ArrowLink>
                            <ProductVisual scene={chapter.scene} compact />
                        </div>
                    </div>
                </div>
            </section>
            <section className="m-section m-flow-section">
                <div className="m-container">
                    <SectionIntro eyebrow="THE JOURNEY" title="One visit. A connected path.">
                        Pravaah follows the operational journey after booking, so staff can work
                        from the same understanding of the day.
                    </SectionIntro>
                    <FlowIllustration />
                    <div className="m-flow-bottom">
                        <p>
                            Staff stay in control as appointments become arrivals, queue entries and
                            completed visits.
                        </p>
                        <ArrowLink to="/how-it-works">Explore the complete workflow</ArrowLink>
                    </div>
                </div>
            </section>
            <EndCta />
        </>
    );
}
