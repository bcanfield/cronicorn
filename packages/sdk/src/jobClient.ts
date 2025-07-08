export type JsonSerializable =
	| string
	| number
	| boolean
	| null
	| JsonSerializable[]
	| { [key: string]: JsonSerializable };

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: string,
	) {
		super(`API Error: ${status} ${statusText}`);
		this.name = "ApiError";
	}
}

import { BASE_URL } from "./config";

export async function postMessage<TRequest extends JsonSerializable, TResponse = unknown>(
	jobId: string,
	apiKey: string,
	body: TRequest,
	signal?: AbortSignal,
): Promise<TResponse> {
	if (!jobId || typeof jobId !== "string") {
		throw new TypeError("`jobId` must be a non-empty string");
	}
	if (!apiKey || typeof apiKey !== "string") {
		throw new TypeError("`apiKey` must be a non-empty string");
	}

	const url = `${BASE_URL.replace(/\/+$/, "")}/api/jobs/${encodeURIComponent(jobId)}/message`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(body),
		signal,
	});

	const text = await res.text();
	if (!res.ok) {
		throw new ApiError(res.status, res.statusText, text);
	}
	return text ? (JSON.parse(text) as TResponse) : (undefined as any);
}
