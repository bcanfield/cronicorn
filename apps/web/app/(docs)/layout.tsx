import { Navbar } from "@/components/layout/navbar";
import { BevelContainer } from "@/components/ui/bevel-container";
import type React from "react";

export default async function MdxLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-vh bg-background space-y-8">
			<Navbar withUserMenu={false} />
			<main className=" prose prose-sm  lg:prose-base   w-full max-w-5xl mx-auto  pb-20 sm:pb-28">
				<BevelContainer innerClassName="p-2 bg-popover" variant="in">
					{children}
				</BevelContainer>
			</main>
		</div>
	);
}
