import type React from "react";

import { Providers } from "../providers";
import { Navbar } from "@/components/layout/navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<Providers>
			<div className="min-h-screen bg-background ">
				<Navbar />
				<main className="mx-auto py-6 px-4 ">{children}</main>
			</div>
		</Providers>
	);
}
