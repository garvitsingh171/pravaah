type FieldErrorProps = {
    message?: string;
};

function FieldError({ message }: FieldErrorProps) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-sm text-red-700">{message}</p>;
}

export default FieldError;
