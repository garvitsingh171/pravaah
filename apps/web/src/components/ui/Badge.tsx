import type { HTMLAttributes } from 'react';
import { cx } from './classNames';

export type BadgeTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
type BadgeSize = 'sm' | 'md';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
    size?: BadgeSize;
};

const toneClassNames: Record<BadgeTone, string> = {
    brand: 'bg-brand-subtle text-brand-foreground ring-brand-soft',
    info: 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info-text)] ring-[var(--color-status-info-border)]',
    success:
        'bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] ring-[var(--color-status-success-border)]',
    warning:
        'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)] ring-[var(--color-status-warning-border)]',
    danger: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-text)] ring-[var(--color-status-danger-border)]',
    neutral:
        'bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-text)] ring-[var(--color-status-neutral-border)]',
};

const sizeClassNames: Record<BadgeSize, string> = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
};

function Badge({ children, className, size = 'sm', tone = 'neutral', ...badgeProps }: BadgeProps) {
    return (
        <span
            {...badgeProps}
            className={cx(
                'inline-flex w-fit items-center rounded-full font-semibold ring-1',
                toneClassNames[tone],
                sizeClassNames[size],
                className
            )}
        >
            {children}
        </span>
    );
}

export default Badge;
