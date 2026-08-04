import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './classNames';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    loadingText?: string;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
    primary:
        'border-transparent bg-action text-white shadow-sm hover:bg-action-hover focus-visible:outline-action',
    secondary:
        'border-brand-soft bg-brand-subtle text-brand-foreground hover:bg-brand-soft focus-visible:outline-action',
    outline:
        'border-app-border-strong bg-white text-app-muted hover:bg-app-surface-muted focus-visible:outline-action',
    ghost: 'border-transparent bg-transparent text-app-muted hover:bg-app-surface-muted focus-visible:outline-action',
    danger:
        'border-transparent bg-[var(--color-status-danger-text)] text-white shadow-sm hover:brightness-95 focus-visible:outline-[var(--color-status-danger-text)]',
};

const sizeClassNames: Record<ButtonSize, string> = {
    sm: 'min-h-8 px-3 py-1.5 text-xs',
    md: 'min-h-10 px-4 py-2 text-sm',
    lg: 'min-h-11 px-5 py-2.5 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        children,
        className,
        disabled,
        isLoading = false,
        loadingText,
        leadingIcon,
        trailingIcon,
        size = 'md',
        type = 'button',
        variant = 'primary',
        ...buttonProps
    },
    ref
) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            {...buttonProps}
            ref={ref}
            type={type}
            disabled={isDisabled}
            className={cx(
                'inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-app-border disabled:bg-app-surface-muted disabled:text-app-subtle disabled:shadow-none',
                variantClassNames[variant],
                sizeClassNames[size],
                className
            )}
        >
            {isLoading ? (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            ) : (
                leadingIcon
            )}
            <span>{isLoading && loadingText ? loadingText : children}</span>
            {!isLoading ? trailingIcon : null}
        </button>
    );
});

export default Button;
