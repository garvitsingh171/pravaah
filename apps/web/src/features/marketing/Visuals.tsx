import type { ReactNode } from 'react';

type Scene = 'overview' | 'appointments' | 'queue' | 'risk' | 'clinic' | 'team';

const appointments = [
    { time: '09:20', name: 'Asha Mehra', doctor: 'Dr. Rao', status: 'Confirmed', tone: 'teal' },
    { time: '10:10', name: 'Kabir Shah', doctor: 'Dr. Iyer', status: 'Arrived', tone: 'blue' },
    { time: '11:30', name: 'Mina Dutta', doctor: 'Dr. Rao', status: 'Waiting', tone: 'gold' },
];

function Badge({ children, tone = 'teal' }: { children: ReactNode; tone?: string }) {
    return <span className={`m-visual-badge m-tone-${tone}`}>{children}</span>;
}

export function ProductVisual({
    scene = 'overview',
    compact = false,
}: {
    scene?: Scene;
    compact?: boolean;
}) {
    const title = {
        overview: 'Today at a glance',
        appointments: 'Appointments',
        queue: 'Live queue',
        risk: 'No-show assistance',
        clinic: 'Clinic settings',
        team: 'Team access',
    }[scene];
    return (
        <div
            className={`m-product-visual ${compact ? 'm-product-visual-compact' : ''}`}
            aria-label={`Illustrative Pravaah ${title.toLowerCase()} interface using fictional information`}
            role="img"
        >
            <div className="m-visual-sidebar">
                <img src="/brand/pravaah-mark-gradient.svg" width="30" height="34" alt="" />
                <span>Overview</span>
                <span>Appointments</span>
                <span>Queue</span>
                <span>Patients</span>
                <span>Doctors</span>
                <span>Team</span>
            </div>
            <div className="m-visual-main">
                <div className="m-visual-top">
                    <div>
                        <small>PRAVAAH / CLINIC WORKSPACE</small>
                        <h3>{title}</h3>
                    </div>
                    <span className="m-visual-avatar">RC</span>
                </div>
                {scene === 'overview' && (
                    <>
                        <div className="m-visual-metrics">
                            <div>
                                <small>Scheduled today</small>
                                <strong>12</strong>
                                <span>Across 3 doctors</span>
                            </div>
                            <div>
                                <small>In the queue</small>
                                <strong>04</strong>
                                <span>2 patients waiting</span>
                            </div>
                            <div>
                                <small>Needs a closer look</small>
                                <strong>02</strong>
                                <span>Risk information available</span>
                            </div>
                        </div>
                        <div className="m-visual-section-title">
                            Appointments moving today <Badge>Live clinic day</Badge>
                        </div>
                        <AppointmentRows />
                    </>
                )}
                {scene === 'appointments' && (
                    <>
                        <div className="m-visual-filter">
                            <span>Today</span>
                            <span>All doctors</span>
                            <span>All statuses</span>
                            <b>+ Book appointment</b>
                        </div>
                        <AppointmentRows />
                        <div className="m-visual-note">
                            Doctor, patient, time and status remain connected to the visit.
                        </div>
                    </>
                )}
                {scene === 'queue' && (
                    <>
                        <div className="m-visual-section-title">
                            Waiting for consultation <Badge tone="blue">Staff controlled</Badge>
                        </div>
                        {[
                            { n: '01', name: 'Mina Dutta', status: 'Called', tone: 'blue' },
                            { n: '02', name: 'Rohan Sen', status: 'Waiting', tone: 'gold' },
                            { n: '03', name: 'Fatima Ali', status: 'Arrived', tone: 'teal' },
                        ].map((row) => (
                            <div className="m-visual-row" key={row.n}>
                                <b className="m-visual-number">{row.n}</b>
                                <div>
                                    <strong>{row.name}</strong>
                                    <small>Consultation with Dr. Rao</small>
                                </div>
                                <Badge tone={row.tone}>{row.status}</Badge>
                            </div>
                        ))}
                        <div className="m-visual-note">
                            Reception can update statuses and manually reorder active entries.
                        </div>
                    </>
                )}
                {scene === 'risk' && (
                    <>
                        <div className="m-risk-summary">
                            <span className="m-risk-icon">!</span>
                            <div>
                                <small>APPOINTMENT REVIEW</small>
                                <strong>A reason to check in, not a decision made for you.</strong>
                            </div>
                        </div>
                        <div className="m-visual-row">
                            <div>
                                <strong>Kabir Shah</strong>
                                <small>10:10 · Dr. Iyer</small>
                            </div>
                            <Badge tone="gold">Medium risk</Badge>
                        </div>
                        <div className="m-risk-reasons">
                            <strong>Why this appears</strong>
                            <span>
                                Booking context and available history are considered by explainable
                                rules.
                            </span>
                            <span>Staff can review the reasons and decide what to do next.</span>
                        </div>
                    </>
                )}
                {scene === 'clinic' && (
                    <>
                        <div className="m-visual-metrics">
                            <div>
                                <small>Clinic</small>
                                <strong className="m-small-metric">Pravaah Family</strong>
                                <span>Profile and hours</span>
                            </div>
                            <div>
                                <small>Doctors</small>
                                <strong>03</strong>
                                <span>Records managed</span>
                            </div>
                        </div>
                        <div className="m-visual-section-title">Operational records</div>
                        {[
                            'Clinic profile and hours',
                            'Doctor profiles and availability',
                            'Patient records',
                        ].map((x, i) => (
                            <div className="m-visual-row" key={x}>
                                <b className="m-visual-number">0{i + 1}</b>
                                <strong>{x}</strong>
                                <span aria-hidden="true">↗</span>
                            </div>
                        ))}
                    </>
                )}
                {scene === 'team' && (
                    <>
                        <div className="m-visual-section-title">
                            People with clinic access <Badge>Admin view</Badge>
                        </div>
                        {[
                            { name: 'Riya Kapoor', role: 'Admin' },
                            { name: 'Nikhil Varma', role: 'Staff' },
                            { name: 'Leela Nair', role: 'Staff' },
                        ].map((x, i) => (
                            <div className="m-visual-row" key={x.name}>
                                <span className="m-team-avatar">
                                    {x.name
                                        .split(' ')
                                        .map((y) => y[0])
                                        .join('')}
                                </span>
                                <div>
                                    <strong>{x.name}</strong>
                                    <small>{x.role} · Clinic team</small>
                                </div>
                                <Badge tone={i ? 'blue' : 'teal'}>{x.role}</Badge>
                            </div>
                        ))}
                        <div className="m-visual-note">
                            Admins manage team access. Staff work in their assigned clinic.
                        </div>
                    </>
                )}
            </div>
            <span className="m-illustrative-label">
                Illustrative product view · fictional names
            </span>
        </div>
    );
}

function AppointmentRows() {
    return (
        <div className="m-visual-rows">
            {appointments.map((row) => (
                <div className="m-visual-row" key={row.name}>
                    <b className="m-visual-time">{row.time}</b>
                    <div>
                        <strong>{row.name}</strong>
                        <small>{row.doctor} · Consultation</small>
                    </div>
                    <Badge tone={row.tone}>{row.status}</Badge>
                </div>
            ))}
        </div>
    );
}

export function FlowIllustration({ compact = false }: { compact?: boolean }) {
    const steps = ['Book', 'Arrive', 'Wait', 'Call', 'Complete'];
    return (
        <div
            className={`m-flow-art ${compact ? 'm-flow-art-compact' : ''}`}
            role="img"
            aria-label="Clinic visit flow: book, arrive, wait, call, complete"
        >
            <div className="m-flow-line" />
            {steps.map((step, index) => (
                <div className="m-flow-step" key={step}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{step}</strong>
                </div>
            ))}
        </div>
    );
}
