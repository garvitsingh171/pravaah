import { createContext, useContext } from 'react';
import type { ActiveClinicContext } from '../lib';

export const ActiveClinicReactContext = createContext<ActiveClinicContext | null>(null);

export const useActiveClinic = (): ActiveClinicContext => {
    const activeClinic = useContext(ActiveClinicReactContext);

    if (!activeClinic) {
        throw new Error('useActiveClinic must be used within ActiveClinicProvider.');
    }

    return activeClinic;
};
