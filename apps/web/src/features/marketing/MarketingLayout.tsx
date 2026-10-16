import { useAuth } from '@clerk/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { PravaahLogo } from '../../components/brand';
import { featureLinks } from './links';
import './marketing.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const primaryLinks = [
    { to: '/product', label: 'Product' },
    { to: '/solutions', label: 'Solutions' },
    { to: '/how-it-works', label: 'How it works' },
    { to: '/faq', label: 'FAQ' },
    { to: '/about', label: 'About' },
];

export function ArrowLink({
    to,
    children,
    light = false,
}: {
    to: string;
    children: ReactNode;
    light?: boolean;
}) {
    return (
        <Link className={`m-arrow-link ${light ? 'm-arrow-link-light' : ''}`} to={to}>
            {children}
            <span aria-hidden="true">↗</span>
        </Link>
    );
}

export function Actions({ light = false }: { light?: boolean }) {
    const { isLoaded, isSignedIn } = useAuth();
    return (
        <div className="m-actions">
            <Link
                className={`m-button ${light ? 'm-button-light' : ''}`}
                to={isLoaded && isSignedIn ? '/dashboard' : '/sign-up'}
            >
                {isLoaded && isSignedIn ? 'Open workspace' : 'Get started'}{' '}
                <span aria-hidden="true">↗</span>
            </Link>
            <Link
                className={`m-button m-button-outline ${light ? 'm-button-outline-light' : ''}`}
                to="/contact"
            >
                Contact the team
            </Link>
        </div>
    );
}

export function SectionIntro({
    eyebrow,
    title,
    children,
    centered = false,
}: {
    eyebrow: string;
    title: string;
    children?: ReactNode;
    centered?: boolean;
}) {
    return (
        <div className={`m-section-intro ${centered ? 'm-center' : ''}`} data-reveal>
            <span className="m-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            {children && <p>{children}</p>}
        </div>
    );
}

export function PageHero({
    eyebrow,
    title,
    children,
    visual,
    actions = true,
}: {
    eyebrow: string;
    title: string;
    children: ReactNode;
    visual?: ReactNode;
    actions?: boolean;
}) {
    return (
        <section className={`m-page-hero ${visual ? 'm-page-hero-split' : ''}`}>
            <div className="m-container m-page-hero-grid">
                <div className="m-page-hero-copy" data-hero>
                    <span className="m-eyebrow m-eyebrow-light">{eyebrow}</span>
                    <h1>{title}</h1>
                    <p>{children}</p>
                    {actions && (
                        <div className="m-hero-actions">
                            <Actions light />
                        </div>
                    )}
                </div>
                {visual && (
                    <div className="m-page-hero-visual" data-hero>
                        {visual}
                    </div>
                )}
            </div>
        </section>
    );
}

export function EndCta({
    title = 'Make every clinic day flow better.',
    copy = 'Bring bookings, arrivals and the live queue into one connected staff workflow.',
}: {
    title?: string;
    copy?: string;
}) {
    return (
        <section className="m-end-cta">
            <div className="m-container m-end-inner" data-reveal>
                <div>
                    <span className="m-eyebrow m-eyebrow-light">YOUR NEXT CLINIC DAY</span>
                    <h2>{title}</h2>
                    <p>{copy}</p>
                </div>
                <Actions light />
            </div>
        </section>
    );
}

function MarketingHeader() {
    const { isLoaded, isSignedIn } = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    useEffect(() => {
        if (!open) return;
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onEscape);
        return () => window.removeEventListener('keydown', onEscape);
    }, [open]);
    return (
        <header className={`m-header ${scrolled ? 'm-header-scrolled' : ''}`}>
            <div className="m-container m-header-inner">
                <Link
                    className="m-brand"
                    to="/"
                    aria-label="Pravaah home"
                    onClick={() => setOpen(false)}
                >
                    <PravaahLogo surface="dark" size="sm" />
                </Link>
                <button
                    ref={buttonRef}
                    type="button"
                    className="m-menu-button"
                    aria-expanded={open}
                    aria-controls="marketing-navigation"
                    onClick={() => setOpen(!open)}
                >
                    {open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '×' : '☰'}</span>
                </button>
                <nav
                    id="marketing-navigation"
                    className={`m-navigation ${open ? 'm-navigation-open' : ''}`}
                    aria-label="Main navigation"
                >
                    {primaryLinks.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                isActive ||
                                (item.to === '/product' &&
                                    location.pathname.startsWith('/features/'))
                                    ? 'active'
                                    : ''
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    <Link className="m-mobile-contact" to="/contact" onClick={() => setOpen(false)}>
                        Contact
                    </Link>
                    <div className="m-mobile-auth">
                        <Link
                            to={isLoaded && isSignedIn ? '/dashboard' : '/login'}
                            onClick={() => setOpen(false)}
                        >
                            {isLoaded && isSignedIn ? 'Workspace' : 'Sign in'}
                        </Link>
                        <Link to="/sign-up" onClick={() => setOpen(false)}>
                            Get started
                        </Link>
                    </div>
                </nav>
                <div className="m-header-actions">
                    <Link to={isLoaded && isSignedIn ? '/dashboard' : '/login'}>
                        {isLoaded && isSignedIn ? 'Workspace' : 'Sign in'}
                    </Link>
                    <Link className="m-header-cta" to="/sign-up">
                        Get started <span aria-hidden="true">↗</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}

function MarketingFooter() {
    return (
        <footer className="m-footer">
            <div className="m-container">
                <div className="m-footer-grid">
                    <div className="m-footer-about">
                        <Link className="m-brand" to="/" aria-label="Pravaah home">
                            <PravaahLogo surface="dark" size="md" />
                        </Link>
                        <p>
                            A clearer path from appointment to completed visit. Built for the people
                            keeping clinics moving.
                        </p>
                    </div>
                    <div>
                        <h2>Explore</h2>
                        <Link to="/product">Product</Link>
                        <Link to="/solutions">Solutions</Link>
                        <Link to="/how-it-works">How it works</Link>
                        <Link to="/about">About</Link>
                    </div>
                    <div>
                        <h2>Features</h2>
                        {featureLinks.map((link) => (
                            <Link key={link.to} to={link.to}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div>
                        <h2>Connect</h2>
                        <Link to="/faq">FAQ</Link>
                        <Link to="/contact">Contact</Link>
                        <Link to="/login">Sign in</Link>
                        <Link to="/sign-up">Get started</Link>
                    </div>
                </div>
                <div className="m-footer-bottom">
                    <span>© {new Date().getFullYear()} Pravaah</span>
                    <span>Clinic flow, thoughtfully connected.</span>
                </div>
            </div>
        </footer>
    );
}

function MarketingMotion() {
    const location = useLocation();
    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const context = gsap.context(() => {
                gsap.from('[data-hero]', {
                    y: 28,
                    duration: 0.8,
                    stagger: 0.12,
                    ease: 'power2.out',
                    clearProps: 'all',
                });
                gsap.from('.m-header-inner', {
                    y: -12,
                    duration: 0.5,
                    ease: 'power2.out',
                    clearProps: 'all',
                });
                gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
                    gsap.from(element, {
                        y: 30,
                        duration: 0.7,
                        ease: 'power2.out',
                        clearProps: 'all',
                        scrollTrigger: { trigger: element, start: 'top 92%', once: true },
                    });
                });
                gsap.utils.toArray<HTMLElement>('.m-flow-art').forEach((flow) => {
                    const line = flow.querySelector('.m-flow-line');
                    if (line)
                        gsap.fromTo(
                            line,
                            { filter: 'brightness(1)' },
                            {
                                filter: 'brightness(1.7)',
                                duration: 0.8,
                                repeat: 1,
                                yoyo: true,
                                scrollTrigger: { trigger: flow, start: 'top 85%', once: true },
                            }
                        );
                    gsap.from(flow.querySelectorAll('.m-flow-step'), {
                        y: 10,
                        duration: 0.45,
                        stagger: 0.1,
                        ease: 'power2.out',
                        clearProps: 'all',
                        scrollTrigger: { trigger: flow, start: 'top 85%', once: true },
                    });
                });
            });
            return () => context.revert();
        },
        { dependencies: [location.pathname] }
    );
    return null;
}

export default function MarketingLayout() {
    return (
        <div className="marketing-site">
            <a className="m-skip" href="#marketing-main">
                Skip to content
            </a>
            <MarketingHeader />
            <main id="marketing-main">
                <Outlet />
            </main>
            <MarketingFooter />
            <MarketingMotion />
        </div>
    );
}
