import Ajv from "ajv";
import addFormats from "ajv-formats";

// Configure AJV with Draft-07 and formats
export const ajvInstance = new Ajv({ strict: false, allErrors: true });
addFormats(ajvInstance);
