import { useAuth } from '@clerk/react';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { setApiClientAuthTokenProvider } from '../lib';

function ApiAuthProvider({ children }: PropsWithChildren) {
    const { getToken } = useAuth();

    useEffect(() => {
        setApiClientAuthTokenProvider(() => getToken());

        return () => {
            setApiClientAuthTokenProvider(undefined);
        };
    }, [getToken]);

    return children;
}

export default ApiAuthProvider;
