import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    buildStructuredData,
    defaultSocialImagePath,
    getAbsoluteAssetUrl,
    getAbsoluteSiteUrl,
    getMetadataForPath,
    siteName,
} from '../lib/siteMetadata';

const managedAttribute = 'data-pravaah-managed-metadata';

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);

    if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
    }

    Object.entries(attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
    });
    element.setAttribute(managedAttribute, 'true');
};

const upsertCanonical = (href: string | null) => {
    const existingCanonicals = document.head.querySelectorAll<HTMLLinkElement>(
        'link[rel="canonical"]'
    );

    existingCanonicals.forEach((canonical, index) => {
        if (href && index === 0) {
            canonical.setAttribute('href', href);
            canonical.setAttribute(managedAttribute, 'true');
            return;
        }

        canonical.remove();
    });

    if (!href || existingCanonicals.length > 0) {
        return;
    }

    const canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', href);
    canonical.setAttribute(managedAttribute, 'true');
    document.head.appendChild(canonical);
};

const replaceStructuredData = (json: unknown | null) => {
    document.head
        .querySelectorAll<HTMLScriptElement>(`script[type="application/ld+json"][${managedAttribute}]`)
        .forEach((script) => script.remove());

    if (!json) {
        return;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(json);
    script.setAttribute(managedAttribute, 'true');
    document.head.appendChild(script);
};

function RouteMetadata() {
    const location = useLocation();

    useEffect(() => {
        const metadata = getMetadataForPath(location.pathname);
        const robots = metadata.indexable ? 'index,follow' : 'noindex,nofollow';
        const canonicalUrl =
            metadata.indexable && metadata.canonicalPath
                ? getAbsoluteSiteUrl(metadata.canonicalPath)
                : null;
        const socialImageUrl = getAbsoluteAssetUrl(
            metadata.socialImagePath ?? defaultSocialImagePath
        );
        const pageUrl = getAbsoluteSiteUrl(metadata.canonicalPath ?? location.pathname);

        document.title = metadata.title;
        upsertMeta('meta[name="description"]', {
            name: 'description',
            content: metadata.description,
        });
        upsertMeta('meta[name="robots"]', {
            name: 'robots',
            content: robots,
        });
        upsertCanonical(canonicalUrl);
        upsertMeta('meta[property="og:title"]', {
            property: 'og:title',
            content: metadata.title,
        });
        upsertMeta('meta[property="og:description"]', {
            property: 'og:description',
            content: metadata.description,
        });
        upsertMeta('meta[property="og:url"]', {
            property: 'og:url',
            content: pageUrl,
        });
        upsertMeta('meta[property="og:type"]', {
            property: 'og:type',
            content: metadata.ogType ?? 'website',
        });
        upsertMeta('meta[property="og:site_name"]', {
            property: 'og:site_name',
            content: siteName,
        });
        upsertMeta('meta[property="og:image"]', {
            property: 'og:image',
            content: socialImageUrl,
        });
        upsertMeta('meta[property="og:image:alt"]', {
            property: 'og:image:alt',
            content: 'Pravaah clinic flow and operations platform',
        });
        upsertMeta('meta[name="twitter:card"]', {
            name: 'twitter:card',
            content: 'summary_large_image',
        });
        upsertMeta('meta[name="twitter:title"]', {
            name: 'twitter:title',
            content: metadata.title,
        });
        upsertMeta('meta[name="twitter:description"]', {
            name: 'twitter:description',
            content: metadata.description,
        });
        upsertMeta('meta[name="twitter:image"]', {
            name: 'twitter:image',
            content: socialImageUrl,
        });
        replaceStructuredData(buildStructuredData(metadata));
    }, [location.pathname]);

    return null;
}

export default RouteMetadata;
