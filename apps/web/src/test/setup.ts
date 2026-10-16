import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import {
    getClerkClient,
    getClerkAuthState,
    MockClerkProvider,
    MockSignIn,
    MockSignOutButton,
    MockSignUp,
    resetClerkMock,
} from './mocks/clerk';
import { setApiClientAuthTokenProvider } from '../lib';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

vi.mock('@clerk/react', () => ({
    ClerkProvider: MockClerkProvider,
    SignIn: MockSignIn,
    SignUp: MockSignUp,
    SignOutButton: MockSignOutButton,
    useAuth: () => getClerkAuthState(),
    useClerk: () => getClerkClient(),
}));

afterEach(() => {
    cleanup();
    resetClerkMock();
    setApiClientAuthTokenProvider(undefined);
    window.localStorage.clear();
    window.sessionStorage.clear();
});
