export const getSafeInternalRedirectPath = (
    redirectUrl: string | null,
    fallbackPath: string
): string => {
    if (
        !redirectUrl ||
        !redirectUrl.startsWith('/') ||
        redirectUrl.startsWith('//') ||
        redirectUrl.startsWith('/\\')
    ) {
        return fallbackPath;
    }

    try {
        const parsedUrl = new URL(redirectUrl, window.location.origin);

        if (parsedUrl.origin !== window.location.origin) {
            return fallbackPath;
        }

        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return fallbackPath;
    }
};
