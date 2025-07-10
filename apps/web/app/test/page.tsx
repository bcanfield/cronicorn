"use client";

import { useEffect, useState } from "react";

export default function Home() {
	const [data, setData] = useState(null);
	const [isLoading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/hono/hello")
			.then((res) => res.json())
			.then((data) => {
				setData(data);
				setLoading(false);
			});
	}, []);

	if (isLoading) return <p>Loading...</p>;
	if (!data) return <p>No profile data</p>;
	return <div>test page: {JSON.stringify(data)}</div>;
}
