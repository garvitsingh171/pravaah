export type StructuredAddress = {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
};

const getAddressComponents = (address: StructuredAddress): string[] => {
    return [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.pincode,
        address.country,
    ].flatMap((component) => {
        if (component === null || component === undefined) {
            return [];
        }

        const trimmedComponent = component.trim();

        return trimmedComponent ? [trimmedComponent] : [];
    });
};

/**
 * Builds a deterministic display/search string only. It does not validate or
 * parse an address and does not imply that a geocoder will accept it.
 */
export const buildCanonicalAddress = (address: StructuredAddress): string => {
    return getAddressComponents(address).join(', ');
};

/**
 * Indicates that enough structured fields exist to attempt future geocoding.
 * It does not prove that the address exists or that geocoding will succeed.
 */
export const hasGeocodableAddress = (address: StructuredAddress): boolean => {
    return [address.addressLine1, address.city, address.state, address.country].every(
        (component) => typeof component === 'string' && component.trim().length > 0
    );
};
