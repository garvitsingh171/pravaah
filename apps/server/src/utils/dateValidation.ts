export const calendarDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const isValidCalendarDate = (value: string): boolean => {
    const [yearText, monthText, dayText] = value.split('-');

    if (yearText === undefined || monthText === undefined || dayText === undefined) {
        return false;
    }

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};
