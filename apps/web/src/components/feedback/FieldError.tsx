type FieldErrorProps = {
    id?: string;
    message?: string;
};

function FieldError({ id, message }: FieldErrorProps) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="mt-1 text-sm text-[var(--color-status-danger-text)]">
            {message}
        </p>
    );
}

export default FieldError;
