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
});
