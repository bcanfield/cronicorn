import type { JSONSchema7 } from "ai";
import { ajvInstance } from "./ajv";

// Simple JSON-Schema validator using AJV
export function validateJson(schema: JSONSchema7, data: any) {
	const validate = ajvInstance.compile(schema);
	if (!validate(data)) {
		const errs = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join(", ");
		throw new Error(`Validation error: ${errs}`);
	}
}
