import type {
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
} from 'react';
import { cx } from './classNames';

type FormFieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
    label: string;
    error?: string;
    hint?: ReactNode;
};

export const fieldControlClassName =
    'mt-2 w-full rounded-md border border-app-border-strong bg-white px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-subtle focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:cursor-not-allowed disabled:bg-app-surface-muted disabled:text-app-subtle';

export function FormField({
    children,
    className,
    error,
    hint,
    label,
    ...labelProps
}: FormFieldProps) {
    return (
        <label
            {...labelProps}
            className={cx('block text-sm font-medium text-app-muted', className)}
        >
            {label}
            {children}
            {hint ? (
                <span className="mt-1 block text-xs font-normal text-app-subtle">{hint}</span>
            ) : null}
            {error ? (
                <span className="mt-1 block text-xs font-medium text-[var(--color-status-danger-text)]">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

export function Input({ className, ...inputProps }: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...inputProps} className={cx(fieldControlClassName, className)} />;
}

export function Select({ className, ...selectProps }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...selectProps} className={cx(fieldControlClassName, className)} />;
}
