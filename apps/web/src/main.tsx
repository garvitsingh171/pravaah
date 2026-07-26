import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import './index.css';
import ApiAuthProvider from './app/ApiAuthProvider.tsx';
import App from './App.tsx';
import { ToastProvider } from './components/feedback';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const signInUrl = '/login';
const signUpUrl = '/sign-up';
const signInFallbackRedirectUrl = '/dashboard';
const signUpFallbackRedirectUrl = '/';
const afterSignOutUrl = '/login?signout=success';

if (!clerkPublishableKey) {
    throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not configured.');
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={clerkPublishableKey}
            signInUrl={signInUrl}
            signUpUrl={signUpUrl}
            signInFallbackRedirectUrl={signInFallbackRedirectUrl}
            signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
            afterSignOutUrl={afterSignOutUrl}
        >
            <ApiAuthProvider>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </ApiAuthProvider>
        </ClerkProvider>
    </StrictMode>
);
