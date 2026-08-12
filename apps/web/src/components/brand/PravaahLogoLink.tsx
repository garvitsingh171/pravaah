import { useAuth } from '@clerk/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PravaahLogo, {
    type PravaahLogoLayout,
    type PravaahLogoSize,
    type PravaahLogoSurface,
} from './PravaahLogo';

type PravaahLogoLinkProps = {
    layout?: PravaahLogoLayout;
    surface?: PravaahLogoSurface;
    size?: PravaahLogoSize;
    className?: string;
    children?: ReactNode;
    onNavigate?: () => void;
};

function PravaahLogoLink({
    children,
    className = '',
    layout = 'horizontal',
    onNavigate,
    size = 'md',
    surface = 'light',
}: PravaahLogoLinkProps) {
    const { isLoaded, isSignedIn } = useAuth();
    const destination = isLoaded && isSignedIn ? '/dashboard' : '/';

    return (
        <Link
            to={destination}
            aria-label="Pravaah home"
            aria-disabled={!isLoaded}
            className={`inline-flex min-w-0 items-center gap-3 rounded-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action ${
                !isLoaded ? 'pointer-events-none opacity-80' : ''
            } ${className}`}
            onClick={onNavigate}
        >
            <PravaahLogo layout={layout} surface={surface} size={size} />
            {children}
        </Link>
    );
}

export default PravaahLogoLink;
