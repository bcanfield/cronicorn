export function maskApiKey(key: string) {
	if (key.length <= 8) return key;
	return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
}
