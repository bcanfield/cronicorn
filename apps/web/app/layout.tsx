import "@cronicorn/ui/globals.css";
import type { Metadata } from "next";
import { Press_Start_2P, Rajdhani, Source_Code_Pro, JetBrains_Mono, Orbitron } from "next/font/google";
import type React from "react";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	variable: "--font-jetbrains-mono",
});

const rajdhani = Rajdhani({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	variable: "--font-rajdhani",
});

const pressStart = Orbitron({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	variable: "--font-press-start",
});

const shareTechMono = Source_Code_Pro({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	variable: "--font-share-tech-mono",
});

export const metadata: Metadata = {
	title: "API Key Manager",
	description: "Manage your API keys",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${jetbrainsMono.variable} ${rajdhani.variable} ${shareTechMono.variable} ${pressStart.variable}  font-sans antialiased`}
		>
			<body className="font-family-body antialiased">{children}</body>
		</html>
	);
}
