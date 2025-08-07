/**
 * Utility functions for calculating sizes of data
 */

/**
 * Calculate the size of a string in bytes
 * @param str - String to calculate size for
 * @returns Size in bytes
 */
export function calculateStringSizeBytes(str: string): number {
    // Each character in JavaScript is UTF-16 encoded (2 bytes per character)
    // This is a reasonable approximation for most strings
    return str.length * 2;
}

/**
 * Calculate the size of any object in bytes
 * @param obj - Object to calculate size for
 * @returns Size in bytes
 */
export function calculateObjectSizeBytes(obj: unknown): number {
    // Convert to JSON string and calculate size
    try {
        const jsonString = JSON.stringify(obj);
        return calculateStringSizeBytes(jsonString);
    }
    catch {
        // If stringify fails, provide a best effort estimate
        return estimateObjectSize(obj);
    }
}

/**
 * Estimate object size for objects that cannot be stringified
 * @param obj - Object to estimate size for
 * @returns Estimated size in bytes
 */
function estimateObjectSize(obj: unknown): number {
    if (obj === null || obj === undefined) {
        return 0;
    }

    // Handle primitive types
    if (typeof obj === "boolean")
        return 4;
    if (typeof obj === "number")
        return 8;
    if (typeof obj === "string")
        return calculateStringSizeBytes(obj as string);

    // Handle arrays
    if (Array.isArray(obj)) {
        return (obj as unknown[]).reduce((total: number, item) => total + estimateObjectSize(item), 0);
    }

    // Handle objects
    if (typeof obj === "object") {
        let size = 0;
        for (const key in obj as Record<string, unknown>) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Add size of the key
                size += calculateStringSizeBytes(key);
                // Add size of the value
                size += estimateObjectSize((obj as Record<string, unknown>)[key]);
            }
        }
        return size;
    }

    // Default for other types
    return 8;
}

/**
 * Format bytes into a human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 KB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0)
        return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / (k ** i)).toFixed(decimals))} ${sizes[i]}`;
}
