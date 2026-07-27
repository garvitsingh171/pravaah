export const isSupportedClinicTimezone = (timezone: string): boolean => {
    const trimmedTimezone = timezone.trim();

    if (!trimmedTimezone) {
        return false;
    }

    try {
        new Intl.DateTimeFormat('en-US', {
            timeZone: trimmedTimezone,
        }).format(new Date());

        return true;
    } catch {
        return false;
    }
};
