"use client";

import { useEffect, useState } from "react";

import { Textarea } from "@cronicorn/ui/components/textarea";

interface JSONEditorProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
}

export function JSONEditor({ value = "", onChange, placeholder }: JSONEditorProps) {
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (value.trim()) {
			try {
				JSON.parse(value);
				setError(null);
			} catch (err) {
				setError("Invalid JSON format");
			}
		} else {
			setError(null);
		}
	}, [value]);

	return (
		<div className="space-y-2">
			<Textarea
				value={value}
				onChange={(e) => onChange?.(e.target.value)}
				placeholder={placeholder || "Enter JSON schema..."}
				className="font-mono text-sm min-h-[120px]"
			/>
			{error && <span>{error}</span>}
		</div>
	);
}
