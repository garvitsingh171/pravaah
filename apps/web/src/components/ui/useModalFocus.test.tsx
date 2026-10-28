import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import useModalFocus from './useModalFocus';

function TestDialog({ removeTriggerOnClose = false }: { removeTriggerOnClose?: boolean }) {
    const [open, setOpen] = useState(false);
    const [showTrigger, setShowTrigger] = useState(true);
    const close = () => {
        setOpen(false);
        if (removeTriggerOnClose) setShowTrigger(false);
    };
    return (
        <main id="main-content" tabIndex={-1}>
            {showTrigger ? <button onClick={() => setOpen(true)}>Open details</button> : null}
            <button>Background action</button>
            {open ? <Dialog onClose={close} /> : null}
        </main>
    );
}

function Dialog({ onClose }: { onClose: () => void }) {
    const ref = useModalFocus(onClose);
    return (
        <section ref={ref} role="dialog" aria-label="Details" tabIndex={-1}>
            <button>First action</button>
            <button>Last action</button>
        </section>
    );
}

describe('useModalFocus', () => {
    it('contains keyboard focus and restores the surviving trigger', async () => {
        const user = userEvent.setup();
        render(<TestDialog />);
        const trigger = screen.getByRole('button', { name: 'Open details' });
        await user.click(trigger);
        expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
        await user.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
        screen.getByRole('button', { name: 'Background action' }).focus();
        expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it('moves focus to main content when the trigger is removed', async () => {
        const user = userEvent.setup();
        render(<TestDialog removeTriggerOnClose />);
        await user.click(screen.getByRole('button', { name: 'Open details' }));
        await user.keyboard('{Escape}');
        expect(screen.getByRole('main')).toHaveFocus();
    });
});
