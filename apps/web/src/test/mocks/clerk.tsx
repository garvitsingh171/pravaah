import type { PropsWithChildren, ReactNode } from 'react';
import { vi } from 'vitest';

type ClerkAuthState = {
    isLoaded: boolean;
    isSignedIn: boolean;
    getToken: () => Promise<string | null>;
};

const defaultToken = 'test-clerk-token';

let authState: ClerkAuthState = {
    isLoaded: true,
    isSignedIn: false,
    getToken: vi.fn(async () => null),
};

export const setClerkLoading = () => {
    authState = {
        isLoaded: false,
        isSignedIn: false,
        getToken: vi.fn(async () => null),
    };
};

export const setClerkSignedOut = () => {
    authState = {
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(async () => null),
    };
};

export const setClerkSignedIn = (token = defaultToken) => {
    authState = {
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn(async () => token),
    };
};

export const getClerkAuthState = () => authState;

export const resetClerkMock = () => {
    setClerkSignedOut();
};

export function MockClerkProvider({ children }: PropsWithChildren) {
    return children;
}

export function MockSignIn() {
    return (
        <div role="group" aria-label="Mock Clerk sign-in">
            Mock Clerk SignIn
        </div>
    );
}

export function MockSignUp() {
    return (
        <div role="group" aria-label="Mock Clerk sign-up">
            Mock Clerk SignUp
        </div>
    );
}

export function MockSignOutButton({ children }: { children?: ReactNode }) {
    return children ?? <button type="button">Sign out</button>;
}
