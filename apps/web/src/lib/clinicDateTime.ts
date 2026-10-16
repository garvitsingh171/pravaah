export function getClinicDateInputValue(timezone?: string | null, now = new Date()): string {
    if (timezone) {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(now);
        const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

        return `${value.year}-${value.month}-${value.day}`;
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatClinicDateTime(value: string, timezone?: string | null): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone ?? undefined,
    }).format(date);
}
