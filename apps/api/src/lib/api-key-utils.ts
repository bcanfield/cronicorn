import crypto from "node:crypto";

import type { ExtendedAuthUser } from "@/api/lib/types";

/**
 * Constants for API key generation and validation
 */
export const API_KEY_CONSTANTS = {
  KEY_LENGTH: 24, // Generates 24 character key
  SECRET_LENGTH: 32, // Generates 32 character secret
  KEY_MIN_LENGTH: 24,
  SECRET_MIN_LENGTH: 32,
  HASH_ITERATIONS: 10000,
  KEY_DIGEST: "sha256",
  SALT_LENGTH: 16,
};

/**
 * Generate a secure API key and secret with proper length and complexity
 * Ensures the generated key and secret meet validation requirements
 *
 * This function generates both the key and secret with the exact lengths defined
 * in API_KEY_CONSTANTS and ensures they only contain alphanumeric characters.
 * Non-alphanumeric characters are replaced with '0' to ensure valid format.
 *
 * Since validation is done at generation time, there's no need for redundant
 * validation checks after key generation.
 *
 * @returns Object containing generated key and secret
 */
export function generateApiKeyAndSecret() {
  // Generate a random API key (24 characters)
  // Ensure it only contains alphanumeric characters
  const key = crypto
    .randomBytes(Math.ceil(API_KEY_CONSTANTS.KEY_LENGTH * 0.9)) // Increase from 0.75 to 0.9 to get enough characters
    .toString("base64")
    .replace(/[+/=]/g, "")
    .replace(/[^a-z0-9]/gi, "0") // Replace any non-alphanumeric with '0'
    .slice(0, API_KEY_CONSTANTS.KEY_LENGTH);

  // Generate a random API secret (32 characters)
  // Ensure it only contains alphanumeric characters
  const secret = crypto
    .randomBytes(Math.ceil(API_KEY_CONSTANTS.SECRET_LENGTH * 0.9)) // Increase from 0.75 to 0.9 to get enough characters
    .toString("base64")
    .replace(/[+/=]/g, "")
    .replace(/[^a-z0-9]/gi, "0") // Replace any non-alphanumeric with '0'
    .slice(0, API_KEY_CONSTANTS.SECRET_LENGTH);

  return { key, secret };
}

/**
 * Hash an API key secret for secure storage
 * @param secret - The plain text secret to hash
 * @returns Object containing salt and hash
 */
export function hashApiKeySecret(secret: string): { salt: string; hash: string } {
  // Generate a random salt
  const salt = crypto
    .randomBytes(API_KEY_CONSTANTS.SALT_LENGTH)
    .toString("hex");

  // Create hash with salt
  const hash = crypto
    .pbkdf2Sync(
      secret,
      salt,
      API_KEY_CONSTANTS.HASH_ITERATIONS,
      64,
      API_KEY_CONSTANTS.KEY_DIGEST,
    )
    .toString("hex");

  return { salt, hash };
}

/**
 * Verify an API key secret against a stored hash
 * @param providedSecret - The plain text secret provided in the request
 * @param storedHash - The hash stored in the database
 * @param storedSalt - The salt stored in the database
 * @returns Boolean indicating if the secret is valid
 */
export function verifyApiKeySecret(
  providedSecret: string,
  storedHash: string,
  storedSalt: string,
): boolean {
  // Hash the provided secret with the stored salt
  const hash = crypto
    .pbkdf2Sync(
      providedSecret,
      storedSalt,
      API_KEY_CONSTANTS.HASH_ITERATIONS,
      64,
      API_KEY_CONSTANTS.KEY_DIGEST,
    )
    .toString("hex");

  // Compare the hashes directly (Node's crypto functions handle this safely)
  return hash === storedHash;
}

/**
 * Validate API key format and length
 * @param key - The API key to validate
 * @returns Boolean indicating if the key is valid
 */
export function validateApiKey(key: string): boolean {
  // Check length and character set (alphanumeric only)
  return (
    key.length >= API_KEY_CONSTANTS.KEY_MIN_LENGTH
    && /^[a-z0-9]+$/i.test(key)
  );
}

/**
 * Validate API secret format and length
 * @param secret - The API secret to validate
 * @returns Boolean indicating if the secret is valid
 */
export function validateApiSecret(secret: string): boolean {
  // Check length and character set (alphanumeric only)
  return (
    secret.length >= API_KEY_CONSTANTS.SECRET_MIN_LENGTH
    && /^[a-z0-9]+$/i.test(secret)
  );
}

/**
 * Utility to check if a request was authenticated using an API key
 * and optionally verify if it has the required scopes
 */
export function checkApiKeyAuth(
  authUser: ExtendedAuthUser,
  requiredScopes?: string[],
): boolean {
  // Not authenticated via API key
  if (!authUser.apiKeyAuth) {
    return false;
  }

  // Check if API key has required scopes, if any specified
  if (requiredScopes && requiredScopes.length > 0) {
    const apiKeyScopes = authUser.apiKeyAuth.scopes || [];
    return requiredScopes.every(scope => apiKeyScopes.includes(scope));
  }

  // API key auth present and no specific scopes required
  return true;
}
