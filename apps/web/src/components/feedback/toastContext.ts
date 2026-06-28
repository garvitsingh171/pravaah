import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error';

export type ToastInput = {
    message: string;
    type?: ToastType;
};

export type ToastContextValue = {
    showToast: (toast: ToastInput) => void;
    showSuccessToast: (message: string) => void;
    showErrorToast: (message: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used inside ToastProvider.');
    }

    return context;
};
