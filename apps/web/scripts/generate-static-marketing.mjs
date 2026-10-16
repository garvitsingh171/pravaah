import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = 'https://pravaah.garvitsingh171.com';
const dist = new URL('../dist/', import.meta.url);
const distPath = fileURLToPath(dist);
const template = await readFile(new URL('index.html', dist), 'utf8');
const pages = [
    {
        path: '/',
        title: 'Pravaah | Clinic Flow and Operations Platform',
        description:
            'Pravaah helps small and medium clinics connect appointments, arrivals, queues, daily visibility, and explainable no-show assistance in one clinic operations workflow.',
        heading: 'Better patient flow. Better clinic days.',
        paragraphs: [
            'From appointments to arrivals, live queues and completed visits, Pravaah helps your team stay organized throughout the clinic day.',
            'Pravaah connects the work after booking. Reception can see who has arrived, staff can manage the live queue and the clinic can review the day as it unfolds.',
        ],
    },
    {
        path: '/product',
        title: 'Product | Pravaah Clinic Flow Management',
        description:
            'Explore how Pravaah connects clinic appointments, patient arrivals, live queues, no-show assistance, records and team access.',
        heading: 'One connected workflow for the entire clinic day.',
        paragraphs: [
            'Pravaah is a clinic flow workspace for Admin and Staff teams. It connects booking, arrival, queue movement and visit completion.',
            'Book against doctor availability, manage patient and clinic records, review explainable no-show assistance and follow daily activity. Staff remain in control of operational decisions.',
        ],
    },
    {
        path: '/features',
        title: 'Clinic Management Features | Pravaah',
        description:
            'Explore Pravaah features for appointments, queues, explainable no-show assistance, clinic records and team access.',
        heading: 'The details behind a smoother day.',
        paragraphs: [
            'Explore the working parts of Pravaah: appointment management, live queue workflows, rule-based no-show assistance, clinic records and team access.',
        ],
    },
    {
        path: '/features/appointments',
        title: 'Clinic Appointment Management | Pravaah',
        description:
            'Book patients with available doctors, follow appointment status and keep scheduling connected to the clinic day.',
        heading: 'A schedule that stays connected to the visit.',
        paragraphs: [
            'Book patients with the right doctor and available time. Keep their appointment status visible as the clinic day changes.',
            'Appointments connect doctor, patient, clinic and queue context. The current product does not provide a self-service rescheduling flow.',
        ],
    },
    {
        path: '/features/live-queue',
        title: 'Live Patient Queue Management | Pravaah',
        description:
            'See arrivals, waiting patients and called visits in a staff-controlled live clinic queue.',
        heading: 'Clarity for every patient waiting.',
        paragraphs: [
            'Reception can see arrival, waiting, called and completed states in a queue connected to appointments.',
            'Authorized clinic staff update statuses and can manually reorder active entries. Pravaah does not automatically prioritize patients.',
        ],
    },
    {
        path: '/features/no-show-risk',
        title: 'Explainable No-Show Assistance | Pravaah',
        description:
            'Review rule-based no-show risk levels, reasons and suggested actions while keeping clinic decisions in staff hands.',
        heading: 'See which bookings may need a closer look.',
        paragraphs: [
            'Pravaah stores deterministic, explainable no-show risk results with levels, reasons and suggested staff actions.',
            'This is decision support, not a trained model or a guarantee. It never cancels an appointment or changes queue order automatically.',
        ],
    },
    {
        path: '/features/clinic-management',
        title: 'Clinic, Doctor and Patient Management | Pravaah',
        description:
            'Manage clinic details, doctor availability and patient records that support a connected daily workflow.',
        heading: 'Give the day a dependable foundation.',
        paragraphs: [
            'Admins can manage clinic details. Authorized clinic users can create and edit doctor and patient records used in appointments.',
            'Doctor and patient records are managed by clinic staff; there are no independent doctor or patient portals in the current product.',
        ],
    },
    {
        path: '/features/team-management',
        title: 'Clinic Team Management | Pravaah',
        description:
            'Learn how Admin and Staff access and clinic-scoped records help teams work together in Pravaah.',
        heading: 'The right people in the clinic workflow.',
        paragraphs: [
            'Pravaah supports Admin and Staff roles and clinic-scoped access. A copy-link invitation workflow is implemented in source and still needs deployment verification.',
            'Admins manage membership. The current role model does not have a fine-grained permissions matrix.',
        ],
    },
    {
        path: '/solutions',
        title: 'Solutions for Clinic Teams | Pravaah',
        description:
            'See how Pravaah helps clinic managers, reception staff and doctors coordinate the daily patient journey.',
        heading: 'A clearer day for everyone in the clinic.',
        paragraphs: [
            'Clinic owners gain operational visibility. Reception staff can coordinate appointments and queues. Doctors benefit from a more orderly handoff through the clinic team.',
            'The operational workspace is for Admin and Staff users; doctors do not have separate authenticated portals today.',
        ],
    },
    {
        path: '/how-it-works',
        title: 'How Pravaah Works | Clinic Visit Workflow',
        description:
            'Follow the Pravaah clinic workflow from setup and booking through arrival, queue movement and visit completion.',
        heading: 'The visit is a journey. Keep every step in view.',
        paragraphs: [
            'Create a clinic, prepare doctor and patient records, book appointments, review risk context, record arrival, manage the queue and complete the visit.',
            'Clinic staff record each operational change and remain responsible for decisions.',
        ],
    },
    {
        path: '/faq',
        title: 'Frequently Asked Questions | Pravaah',
        description:
            'Clear answers about Pravaah setup, appointments, queues, no-show assistance and clinic access.',
        heading: 'Good questions deserve clear answers.',
        paragraphs: [
            'Pravaah is a clinic flow management workspace for small and medium clinics. It supports Admin and Staff users.',
            'The live queue is staff controlled. No-show assistance uses explainable rules and never makes operational decisions automatically.',
        ],
    },
    {
        path: '/about',
        title: 'About Pravaah | Better Clinic Flow',
        description:
            'Learn why Pravaah focuses on the complete clinic visit, from booking to a completed consultation.',
        heading: 'Healthcare moves better when the whole day flows together.',
        paragraphs: [
            'Pravaah means flow. The product focuses on the real work between a booked appointment and a completed visit.',
            'Its current workspace connects records, appointments, queues and operational visibility for clinic teams.',
        ],
    },
    {
        path: '/contact',
        title: 'Contact Pravaah | Ask About a Demo',
        description:
            'Ask the Pravaah team about clinic flow, product fit or a demonstration using a direct email draft.',
        heading: 'Let’s talk about your clinic day.',
        paragraphs: [
            'Tell us what you are trying to organize. The contact page opens an email draft that you can review and send from your own email app.',
            'You can also create an account and begin clinic onboarding to explore the product.',
        ],
    },
];

const escapeHtml = (value) =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
const links = pages
    .filter((page) => page.path !== '/')
    .map((page) => `<a href="${page.path}">${escapeHtml(page.heading)}</a>`)
    .join('');

for (const page of pages) {
    const url = `${origin}${page.path}`;
    const body = `<div style="font:16px/1.6 system-ui,sans-serif;background:#081b2a;color:#fff;min-height:620px">
      <header style="border-bottom:1px solid #ffffff22;padding:22px max(24px,5vw)"><a href="/" style="color:#83e8d8;font-weight:800;text-decoration:none;font-size:19px">Pravaah</a></header>
      <main style="max-width:900px;padding:70px max(24px,5vw) 90px"><h1 style="font-size:clamp(42px,6vw,76px);line-height:1.08;letter-spacing:-.05em;margin:0 0 25px">${escapeHtml(page.heading)}</h1>${page.paragraphs.map((paragraph) => `<p style="color:#c7d8dc;max-width:660px">${escapeHtml(paragraph)}</p>`).join('')}<p style="margin-top:30px"><a href="/sign-up" style="display:inline-block;background:#bff7e9;color:#073c3c;padding:12px 20px;border-radius:7px;text-decoration:none;font-weight:800">Get started</a></p></main></div>
      <nav aria-label="Explore Pravaah" style="display:grid;gap:10px;padding:45px max(24px,5vw);font:15px/1.5 system-ui,sans-serif;background:#f4f8f6">${links}</nav>`;
    let html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
        .replace(
            /<meta name="description"[\s\S]*?\/>/,
            `<meta name="description" content="${escapeHtml(page.description)}" />`
        )
        .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
        .replace(
            /<meta property="og:title"[^>]*>/,
            `<meta property="og:title" content="${escapeHtml(page.title)}" />`
        )
        .replace(
            /<meta property="og:description"[\s\S]*?\/>/,
            `<meta property="og:description" content="${escapeHtml(page.description)}" />`
        )
        .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
        .replace(
            /<meta name="twitter:title"[^>]*>/,
            `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`
        )
        .replace(
            /<meta name="twitter:description"[\s\S]*?\/>/,
            `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`
        )
        .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    const schema = {
        '@context': 'https://schema.org',
        '@type': page.path === '/' ? 'SoftwareApplication' : 'WebPage',
        name: page.path === '/' ? 'Pravaah' : page.heading,
        url,
        description: page.description,
        ...(page.path === '/' ? { applicationCategory: 'BusinessApplication' } : {}),
    };
    html = html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    );
    const destination = join(distPath, page.path.slice(1), 'index.html');
    await mkdir(join(distPath, page.path.slice(1)), { recursive: true });
    await writeFile(destination, html);
}

console.log(`Generated ${pages.length} public HTML entry points.`);
