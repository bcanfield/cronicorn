import "@cronicorn/ui/globals.css";
import type { Metadata } from "next";
import { Press_Start_2P, Rajdhani, Share_Tech_Mono, JetBrains_Mono } from "next/font/google";
import type React from "react";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
	variable: "--font-jetbrains-mono",
});

const pressStart = Press_Start_2P({
	subsets: ["latin"],
	weight: "400",
	display: "swap",
	variable: "--font-press-start",
});

const rajdhani = Rajdhani({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	display: "swap",
	variable: "--font-rajdhani",
});

const shareTechMono = Share_Tech_Mono({
	subsets: ["latin"],
	weight: ["400"],
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
