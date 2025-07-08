"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { deleteApiKey } from "@/lib/api-key-management/actions";

interface ApiKey {
	id: string;
	name: string;
	key: string;
	createdAt: Date;
	lastUsed: Date | null;
}

interface ApiKeyListProps {
	apiKeys: ApiKey[];
}

export function ApiKeyList({ apiKeys }: ApiKeyListProps) {
	const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
	const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const toggleKeyVisibility = (keyId: string) => {
		const newVisibleKeys = new Set(visibleKeys);
		if (newVisibleKeys.has(keyId)) {
			newVisibleKeys.delete(keyId);
		} else {
			newVisibleKeys.add(keyId);
		}
		setVisibleKeys(newVisibleKeys);
	};

	const maskKey = (key: string) => {
		return key.substring(0, 8) + "..." + key.substring(key.length - 4);
	};

	const handleDelete = async (keyId: string) => {
		setDeletingKeys((prev) => new Set(prev).add(keyId));
		try {
			const formData = new FormData();
			formData.append("keyId", keyId);
			await deleteApiKey(formData);
		} catch (error) {
			console.error("Failed to delete API key:", error);
		} finally {
			setDeletingKeys((prev) => {
				const newSet = new Set(prev);
				newSet.delete(keyId);
				return newSet;
			});
		}
	};

	return (
		<div className="space-y-4">
			{apiKeys.map((apiKey) => (
				<div key={apiKey.id} className="border rounded-lg p-4">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h3 className="font-medium">{apiKey.name}</h3>
							<div className="flex items-center space-x-2 mt-2">
								<code className="bg-muted px-2 py-1 rounded text-sm font-mono">
									{visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
								</code>
								<Button variant="ghost" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
									{visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</Button>
								<Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								Created: {apiKey.createdAt.toLocaleDateString()}
								{apiKey.lastUsed && <span className="ml-4">Last used: {apiKey.lastUsed.toLocaleDateString()}</span>}
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => handleDelete(apiKey.id)}
							disabled={deletingKeys.has(apiKey.id)}
						>
							{deletingKeys.has(apiKey.id) ? (
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}
