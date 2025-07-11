// 1) Define a little union for “allowed” param values:
type Primitive = string | number | boolean;
type ParamValue = Primitive | Primitive[];

// 2) Now constrain your helper to only accept those:
export function stringifyQuery<T extends Record<string, ParamValue | undefined>>(params: T): Record<string, string> {
	return Object.entries(params)
		.filter(([, v]) => v != null)
		.reduce(
			(acc, [key, val]) => {
				// if it’s an array, join by comma (or whatever your API expects)
				if (Array.isArray(val)) {
					acc[key] = val.map(String).join(",");
				} else {
					acc[key] = String(val);
				}
				return acc;
			},
			{} as Record<string, string>,
		);
}
