import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

const hasGlobalCrypto = typeof globalThis !== "undefined" && !!globalThis.crypto;

export function cn(...inputs:ClassValue[]){
    return twMerge(clsx(inputs))
}

const getCrypto = (): Crypto | null => {
    if (hasGlobalCrypto) {
        return globalThis.crypto;
    }

    return null;
};

const fallbackUUID = () =>
    // Simplified RFC4122 v4 compliant UUID fallback using Math.random
    // eslint-disable-next-line no-bitwise
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        // eslint-disable-next-line no-bitwise
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

export const generateUUID = (): string => {
    const cryptoObj = getCrypto();

    if (cryptoObj?.randomUUID) {
        return cryptoObj.randomUUID();
    }

    if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);

        // per RFC 4122 section 4.4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

        return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join(""),
        ].join("-");
    }

    return fallbackUUID();
};

