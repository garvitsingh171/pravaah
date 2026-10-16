export const siteOrigin = (import.meta.env.VITE_SITE_URL ?? 'https://pravaah.garvitsingh171.com')
    .trim()
    .replace(/\/+$/, '');

export const siteName = 'Pravaah';
export const defaultSocialImagePath = '/brand/pravaah-social-card.png';

export type RouteIndexingType = 'public' | 'auth' | 'onboarding' | 'protected' | 'fallback';

export type RouteMetadata = {
    path: string;
    title: string;
    description: string;
    indexingType: RouteIndexingType;
    indexable: boolean;
    canonicalPath?: string;
    ogType?: 'website';
    socialImagePath?: string;
    structuredData?: 'website' | 'softwareApplication';
};

export const publicRouteMetadata: RouteMetadata[] = [
    {
        path: '/',
        title: 'Pravaah | Clinic Flow and Operations Platform',
        description:
            'Pravaah helps small and medium clinics connect appointments, arrivals, queues, daily visibility, and explainable no-show assistance in one clinic operations workflow.',
        indexingType: 'public',
        indexable: true,
        canonicalPath: '/',
        ogType: 'website',
        socialImagePath: defaultSocialImagePath,
        structuredData: 'softwareApplication',
    },
    ...[
        [
            '/product',
            'Product | Pravaah Clinic Flow Management',
            'Explore how Pravaah connects clinic appointments, patient arrivals, live queues, no-show assistance, records and team access.',
        ],
        [
            '/features/appointments',
            'Clinic Appointment Management | Pravaah',
            'Book patients with available doctors, follow appointment status and keep scheduling connected to the clinic day.',
        ],
        [
            '/features/live-queue',
            'Live Patient Queue Management | Pravaah',
            'See arrivals, waiting patients and called visits in a staff-controlled live clinic queue.',
        ],
        [
            '/features/no-show-risk',
            'Explainable No-Show Assistance | Pravaah',
            'Review rule-based no-show risk levels, reasons and suggested actions while keeping clinic decisions in staff hands.',
        ],
        [
            '/features/clinic-management',
            'Clinic, Doctor and Patient Management | Pravaah',
            'Manage clinic details, doctor availability and patient records that support a connected daily workflow.',
        ],
        [
            '/features/team-management',
            'Clinic Team Management | Pravaah',
            'Learn how Admin and Staff access and clinic-scoped records help teams work together in Pravaah.',
        ],
        [
            '/features',
            'Clinic Management Features | Pravaah',
            'Explore Pravaah features for appointments, queues, explainable no-show assistance, clinic records and team access.',
        ],
        [
            '/solutions',
            'Solutions for Clinic Teams | Pravaah',
            'See how Pravaah helps clinic managers, reception staff and doctors coordinate the daily patient journey.',
        ],
        [
            '/how-it-works',
            'How Pravaah Works | Clinic Visit Workflow',
            'Follow the Pravaah clinic workflow from setup and booking through arrival, queue movement and visit completion.',
        ],
        [
            '/faq',
            'Frequently Asked Questions | Pravaah',
            'Clear answers about Pravaah setup, appointments, queues, no-show assistance and clinic access.',
        ],
        [
            '/about',
            'About Pravaah | Better Clinic Flow',
            'Learn why Pravaah focuses on the complete clinic visit, from booking to a completed consultation.',
        ],
        [
            '/contact',
            'Contact Pravaah | Ask About a Demo',
            'Ask the Pravaah team about clinic flow, product fit or a demonstration using a direct email draft.',
        ],
    ].map<RouteMetadata>(([path, title, description]) => ({
        path,
        title,
        description,
        indexingType: 'public',
        indexable: true,
        canonicalPath: path,
        ogType: 'website',
        socialImagePath: defaultSocialImagePath,
        structuredData: 'website',
    })),
];

const protectedRoutePaths = [
    '/dashboard',
    '/doctors',
    '/doctors/new',
    '/patients',
    '/patients/new',
    '/appointments',
    '/queue',
    '/clinic-settings',
    '/staff',
    '/profile',
];

export const routeMetadata: RouteMetadata[] = [
    ...publicRouteMetadata,
    {
        path: '/login',
        title: 'Sign In | Pravaah',
        description: 'Sign in to the protected Pravaah clinic workspace.',
        indexingType: 'auth',
        indexable: false,
    },
    {
        path: '/sign-up',
        title: 'Sign Up | Pravaah',
        description: 'Create a Pravaah account before clinic onboarding.',
        indexingType: 'auth',
        indexable: false,
    },
    {
        path: '/onboarding',
        title: 'Clinic Onboarding | Pravaah',
        description: 'Start Pravaah clinic onboarding after authentication.',
        indexingType: 'onboarding',
        indexable: false,
    },
    {
        path: '/onboarding/clinic',
        title: 'Create Clinic | Pravaah',
        description: 'Create the first clinic and Admin account in Pravaah.',
        indexingType: 'onboarding',
        indexable: false,
    },
    ...protectedRoutePaths.map<RouteMetadata>((path) => ({
        path,
        title: 'Clinic Workspace | Pravaah',
        description: 'Protected clinic operations workspace for Pravaah Admin and Staff users.',
        indexingType: 'protected',
        indexable: false,
    })),
    {
        path: '*',
        title: 'Page Not Found | Pravaah',
        description: 'The requested Pravaah page was not found.',
        indexingType: 'fallback',
        indexable: false,
    },
];

export const getAbsoluteSiteUrl = (path = '/'): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${siteOrigin}${normalizedPath}`;
};

export const getAbsoluteAssetUrl = (path: string): string => {
    return getAbsoluteSiteUrl(path);
};

const pathMatchesRoute = (pathname: string, routePath: string): boolean => {
    if (routePath === '*') {
        return false;
    }

    if (routePath === '/') {
        return pathname === '/';
    }

    return pathname === routePath || pathname.startsWith(`${routePath}/`);
};

export const getMetadataForPath = (pathname: string): RouteMetadata => {
    return (
        routeMetadata.find((metadata) => pathMatchesRoute(pathname, metadata.path)) ??
        routeMetadata.find((metadata) => metadata.path === '*')!
    );
};

export const buildStructuredData = (metadata: RouteMetadata) => {
    if (!metadata.structuredData) {
        return null;
    }

    if (metadata.structuredData === 'website') {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            url: getAbsoluteSiteUrl(metadata.canonicalPath ?? metadata.path),
        };
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: siteName,
        applicationCategory: 'BusinessApplication',
        url: getAbsoluteSiteUrl(metadata.canonicalPath ?? metadata.path),
        image: getAbsoluteAssetUrl(metadata.socialImagePath ?? defaultSocialImagePath),
        description: metadata.description,
    };
};
