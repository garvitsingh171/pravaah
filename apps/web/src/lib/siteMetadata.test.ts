import { describe, expect, it } from 'vitest';
import {
    buildStructuredData,
    getAbsoluteSiteUrl,
    getMetadataForPath,
    publicRouteMetadata,
    routeMetadata,
} from './siteMetadata';

describe('siteMetadata', () => {
    it('keeps only public informational routes indexable', () => {
        expect(publicRouteMetadata.map((metadata) => metadata.path)).toEqual(['/']);
        expect(publicRouteMetadata.every((metadata) => metadata.indexable)).toBe(true);
        expect(getMetadataForPath('/dashboard').indexable).toBe(false);
        expect(getMetadataForPath('/queue').indexable).toBe(false);
        expect(getMetadataForPath('/login').indexable).toBe(false);
        expect(getMetadataForPath('/missing-route').indexable).toBe(false);
    });

    it('has unique configured route metadata paths', () => {
        const routePaths = routeMetadata.map((metadata) => metadata.path);

        expect(new Set(routePaths).size).toBe(routePaths.length);
    });

    it('builds canonical public URLs from the configured site origin', () => {
        expect(getAbsoluteSiteUrl('/')).toBe('https://pravaah.garvitsingh171.com/');
        expect(getMetadataForPath('/').canonicalPath).toBe('/');
    });

    it('builds truthful structured data for the public product page', () => {
        const structuredData = buildStructuredData(getMetadataForPath('/'));

        expect(structuredData).toMatchObject({
            '@type': 'SoftwareApplication',
            name: 'Pravaah',
            applicationCategory: 'BusinessApplication',
        });
        expect(JSON.stringify(structuredData)).not.toMatch(/rating|review|medical/i);
    });
});
