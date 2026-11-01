import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { appRoutePaths, type AppRoute } from '../../routes/dashboardRoutes';
import useModalFocus from '../ui/useModalFocus';

type Props = { navigationItems: AppRoute[]; onClose: () => void };

// Commands reference existing routes. No patient data is queried or stored here.
export default function CommandPalette({ navigationItems, onClose }: Props) {
    const navigate = useNavigate();
    const dialogRef = useModalFocus(onClose);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const id = useId();
    const commands = [
        {
            label: 'Book appointment',
            detail: 'Create a visit',
            to: `${appRoutePaths.appointments}#book-appointment`,
            group: 'Quick actions',
        },
        {
            label: 'Add patient',
            detail: 'Create a clinic record',
            to: appRoutePaths.newPatient,
            group: 'Quick actions',
        },
        {
            label: 'Add doctor',
            detail: 'Register a provider',
            to: appRoutePaths.newDoctor,
            group: 'Quick actions',
        },
        ...navigationItems.map((route) => ({
            label: route.navigationLabel ?? route.title,
            detail: route.navigationDescription,
            to: route.path,
            group: 'Go to',
        })),
    ].filter((command) =>
        `${command.label} ${command.detail ?? ''}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
    );
    const run = (to: string) => {
        onClose();
        navigate(to);
    };
    return createPortal(
        <div
            className="command-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
                className="command-dialog"
                tabIndex={-1}
            >
                <div className="flex items-center justify-between gap-3 px-5 pt-4">
                    <h2 id={`${id}-title`} className="text-sm font-semibold text-app-text">
                        Find a page or action
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-10 rounded-md px-3 text-xs font-semibold text-app-muted"
                        aria-label="Close command palette"
                    >
                        Esc
                    </button>
                </div>
                <input
                    aria-label="Search pages and actions"
                    role="combobox"
                    aria-expanded="true"
                    aria-autocomplete="list"
                    aria-controls={`${id}-results`}
                    aria-activedescendant={
                        commands.length ? `${id}-option-${activeIndex}` : undefined
                    }
                    className="command-search"
                    placeholder="Where would you like to go?"
                    value={query}
                    ref={inputRef}
                    data-autofocus="true"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                            event.preventDefault();
                            if (!commands.length) return;
                            const next =
                                (activeIndex +
                                    (event.key === 'ArrowDown' ? 1 : -1) +
                                    commands.length) %
                                commands.length;
                            setActiveIndex(next);
                            resultsRef.current?.children[next]?.scrollIntoView?.({
                                block: 'nearest',
                            });
                        }
                        if (
                            event.key === 'Enter' &&
                            !event.nativeEvent.isComposing &&
                            commands[activeIndex]
                        ) {
                            event.preventDefault();
                            run(commands[activeIndex].to);
                        }
                    }}
                />
                <div
                    ref={resultsRef}
                    id={`${id}-results`}
                    role="listbox"
                    aria-label="Pages and actions"
                    className="command-results"
                >
                    {commands.map((command, index) => (
                        <div
                            key={command.to}
                            id={`${id}-option-${index}`}
                            role="option"
                            aria-selected={activeIndex === index}
                            className="command-option"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => run(command.to)}
                            onMouseMove={() => setActiveIndex(index)}
                        >
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold">{command.label}</span>
                                <span className="block text-xs text-app-muted">
                                    {command.detail}
                                </span>
                            </span>
                            <span className="shrink-0 text-[11px] text-app-muted">
                                {command.group}
                            </span>
                        </div>
                    ))}
                </div>
                {!commands.length && (
                    <p role="status" className="p-6 text-sm text-app-muted">
                        No matching pages or actions. Try “queue” or “patient”.
                    </p>
                )}
                <p className="border-t border-app-border px-5 py-3 text-xs text-app-muted">
                    ↑ ↓ to browse · Enter to open · Esc to close
                </p>
            </div>
        </div>,
        document.body
    );
}
