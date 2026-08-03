import { useId } from 'react';

export type PravaahLogoLayout = 'mark' | 'horizontal' | 'stacked';
export type PravaahLogoSurface = 'light' | 'dark';
export type PravaahLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type PravaahLogoProps = {
    layout?: PravaahLogoLayout;
    surface?: PravaahLogoSurface;
    size?: PravaahLogoSize;
    className?: string;
};

const markSizeClassNames: Record<PravaahLogoSize, string> = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-20 w-20',
};

const wordmarkSizeClassNames: Record<PravaahLogoSize, string> = {
    xs: 'text-sm',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
};

const gapClassNames: Record<PravaahLogoSize, string> = {
    xs: 'gap-1.5',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-5',
};

function PravaahMark({ gradientId, size }: { gradientId: string; size: PravaahLogoSize }) {
    return (
        <svg
            className={markSizeClassNames[size]}
            viewBox="0 0 447 507"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="34"
                    y1="24"
                    x2="414"
                    y2="454"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#4FE5D2" />
                    <stop offset="1" stopColor="#14B8A6" />
                </linearGradient>
            </defs>
            <path fill={`url(#${gradientId})`} d="M0 169h129v338H0z" />
            <path
                fill={`url(#${gradientId})`}
                d="M0 128 160 0h132c86 0 155 70 155 156 0 13-2 26-5 38-7-41-31-66-61-66H0Z"
            />
            <path
                fill={`url(#${gradientId})`}
                d="M228 220h213c-15 74-68 128-139 128H164v-48c0-45 24-80 64-80Z"
            />
        </svg>
    );
}

function PravaahWordmark({ surface, size }: { surface: PravaahLogoSurface; size: PravaahLogoSize }) {
    return (
        <span
            className={`${wordmarkSizeClassNames[size]} font-bold leading-none tracking-normal ${
                surface === 'dark' ? 'text-slate-50' : 'text-slate-950'
            }`}
        >
            Pravaah
        </span>
    );
}

function PravaahLogo({
    layout = 'horizontal',
    surface = 'light',
    size = 'md',
    className = '',
}: PravaahLogoProps) {
    const reactId = useId();
    const gradientId = `pravaah-logo-gradient-${reactId.replace(/:/g, '')}`;

    if (layout === 'mark') {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <PravaahMark gradientId={gradientId} size={size} />
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center ${gapClassNames[size]} ${
                layout === 'stacked' ? 'flex-col text-center' : ''
            } ${className}`}
        >
            <PravaahMark gradientId={gradientId} size={size} />
            <PravaahWordmark surface={surface} size={size} />
        </span>
    );
}

export default PravaahLogo;
