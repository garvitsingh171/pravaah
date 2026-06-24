import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { ErrorMessage } from '../components/feedback';
import {
    ACTIVE_CLINIC_MISSING_ERROR_CODE,
    ACTIVE_CLINIC_MISSING_MESSAGE,
    ACTIVE_CLINIC_STORAGE_KEY,
    getActiveClinicContext,
} from '../lib';
import { ActiveClinicReactContext } from './activeClinicContext';

function MissingActiveClinicState() {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <div className="mx-auto max-w-2xl">
                <ErrorMessage
                    title="Active clinic is not configured"
                    message={ACTIVE_CLINIC_MISSING_MESSAGE}
                    code={ACTIVE_CLINIC_MISSING_ERROR_CODE}
                    details={[
                        'Set VITE_DEFAULT_CLINIC_ID in apps/web/.env for MVP/demo usage.',
                        `Or store an active clinic ID in localStorage using ${ACTIVE_CLINIC_STORAGE_KEY}.`,
                    ]}
                />
            </div>
        </div>
    );
}

function ActiveClinicProvider({ children }: PropsWithChildren) {
    const activeClinic = useMemo(() => getActiveClinicContext(), []);

    if (!activeClinic) {
        return <MissingActiveClinicState />;
    }

    return (
        <ActiveClinicReactContext.Provider value={activeClinic}>
            {children}
        </ActiveClinicReactContext.Provider>
    );
}

export default ActiveClinicProvider;
