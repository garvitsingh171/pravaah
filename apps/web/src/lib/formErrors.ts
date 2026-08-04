export type BackendValidationDetail = {
    field: string;
    message: string;
};

export const getBackendValidationDetails = (details: unknown): BackendValidationDetail[] => {
    if (!Array.isArray(details)) {
        return [];
    }

    return details.reduce<BackendValidationDetail[]>((validationDetails, detail) => {
        if (
            typeof detail !== 'object' ||
            detail === null ||
            !('field' in detail) ||
            !('message' in detail) ||
            typeof detail.field !== 'string' ||
            typeof detail.message !== 'string'
        ) {
            return validationDetails;
        }

        validationDetails.push({
            field: detail.field,
            message: detail.message,
        });

        return validationDetails;
    }, []);
};

export const getBackendFieldErrors = <TField extends string>(
    details: unknown,
    fieldMap: Partial<Record<string, TField>>
): Partial<Record<TField, string>> => {
    return getBackendValidationDetails(details).reduce<Partial<Record<TField, string>>>(
        (errors, detail) => {
            const field = fieldMap[detail.field];

            if (field) {
                errors[field] = detail.message;
            }

            return errors;
        },
        {}
    );
};
