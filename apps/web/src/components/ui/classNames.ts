export const cx = (...classNames: Array<string | false | null | undefined>): string => {
    return classNames.filter(Boolean).join(' ');
};
