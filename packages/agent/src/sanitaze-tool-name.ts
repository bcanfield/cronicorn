/**
 * Removes all characters except letters, numbers, underscore and hyphen.
 */
export function sanitizeToolName(input: string): string {
	return input.replace(/[^a-zA-Z0-9_-]/g, "");
}
