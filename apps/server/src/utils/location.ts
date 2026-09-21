import { createHash, randomUUID } from 'node:crypto';

export type StructuredAddress = {
    addressLine1?: string | null | undefined;
    addressLine2?: string | null | undefined;
    city?: string | null | undefined;
    state?: string | null | undefined;
    pincode?: string | null | undefined;
    country?: string | null | undefined;
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

/**
 * Identifies the exact normalized address version used for a geocoding attempt.
 * It is a concurrency fingerprint, not a secret or an authorization mechanism.
 */
export const createGeocodingSourceHash = (address: StructuredAddress): string => {
    return createHash('sha256').update(buildCanonicalAddress(address)).digest('hex');
};

export const createGeocodingAttemptId = (): string => randomUUID();
