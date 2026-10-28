import { useEffect, useRef } from 'react';

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const modalStack: HTMLElement[] = [];

export default function useModalFocus(onClose: () => void, isBusy = false) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const isBusyRef = useRef(isBusy);

    useEffect(() => {
        onCloseRef.current = onClose;
        isBusyRef.current = isBusy;
    }, [onClose, isBusy]);

    useEffect(() => {
        const previouslyFocusedElement =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousBodyOverflow = document.body.style.overflow;
        const workspaceScrollContainer = document.querySelector<HTMLElement>(
            '[data-workspace-scroll-container="true"]'
        );
        const previousWorkspaceOverflow = workspaceScrollContainer?.style.overflow;
        const dialog = dialogRef.current;
        if (dialog) modalStack.push(dialog);
        document.body.style.overflow = 'hidden';
        if (workspaceScrollContainer) workspaceScrollContainer.style.overflow = 'hidden';

        const getFocusableElements = () =>
            Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
            ).filter(
                (element) =>
                    !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
                    getComputedStyle(element).visibility !== 'hidden' &&
                    getComputedStyle(element).display !== 'none'
            );
        (getFocusableElements()[0] ?? dialogRef.current)?.focus();

        const handleFocusIn = (event: FocusEvent) => {
            if (modalStack.at(-1) !== dialog) return;
            if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) {
                (getFocusableElements()[0] ?? dialogRef.current)?.focus();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (modalStack.at(-1) !== dialog) return;
            if (event.key === 'Escape' && !isBusyRef.current) {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (!first || !last) {
                event.preventDefault();
                dialogRef.current?.focus();
            } else if (!dialogRef.current?.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', handleFocusIn);

        return () => {
            const stackIndex = dialog ? modalStack.indexOf(dialog) : -1;
            if (stackIndex >= 0) modalStack.splice(stackIndex, 1);
            document.body.style.overflow = previousBodyOverflow;
            if (workspaceScrollContainer) {
                workspaceScrollContainer.style.overflow = previousWorkspaceOverflow ?? '';
            }
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', handleFocusIn);
            if (previouslyFocusedElement?.isConnected) {
                previouslyFocusedElement.focus({ preventScroll: true });
            } else {
                document
                    .querySelector<HTMLElement>('#main-content')
                    ?.focus({ preventScroll: true });
            }
        };
    }, []);

    return dialogRef;
}
