export const siteOrigin = (import.meta.env.VITE_SITE_URL ?? 'https://pravaah.garvitsingh171.com')
    .trim()
    .replace(/\/+$/, '');

export const siteName = 'Pravaah';
export const defaultSocialImagePath = '/brand/pravaah-social-card.png';

export type RouteIndexingType =
    | 'public'
    | 'auth'
    | 'onboarding'
    | 'protected'
    | 'fallback';

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
        title: 'Pravaah | Clinic Appointment and Queue Management',
        description:
            'Pravaah helps clinic Admin and Staff users manage appointments, daily queues, and explainable no-show assistance while keeping final decisions human-controlled.',
        indexingType: 'public',
        indexable: true,
        canonicalPath: '/',
        ogType: 'website',
        socialImagePath: defaultSocialImagePath,
        structuredData: 'softwareApplication',
    },
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
