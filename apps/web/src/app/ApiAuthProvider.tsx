import { useAuth } from '@clerk/react';
import type { PropsWithChildren } from 'react';
import { useLayoutEffect } from 'react';
import { setApiClientAuthTokenProvider } from '../lib';

function ApiAuthProvider({ children }: PropsWithChildren) {
    const { getToken } = useAuth();

    useLayoutEffect(() => {
        setApiClientAuthTokenProvider(() => getToken());

        return () => {
            setApiClientAuthTokenProvider(undefined);
        };
    }, [getToken]);

    return children;
}

export default ApiAuthProvider;
