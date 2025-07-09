import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@cronicorn/ui/components/card";
import { BevelContainer } from "@cronicorn/ui/components/bevel-container";

import { cn } from "@cronicorn/ui/lib/utils";
import Image from "next/image";

export function WindowsCard({
	className,
	children,
	footer,
	title,
	...props
}: React.ComponentProps<"div"> & { title: string; footer?: React.ReactNode }) {
	return (
		<BevelContainer variant={"out"} innerClassName="p-0" className={cn("  space-y-0", className)}>
			<Card {...props} className={" w-full py-0 space-y-0 border-none"}>
				<CardHeader className="bg-primary text-primary-foreground px-0 flex items-center p-1">
					<CardTitle className="flex items-center  gap-2">
						<div className="bg-primary-foreground  p-0.5">
							<Image alt="Cronicorn Logo" width={12} height={12} src="/cronicorn.png"></Image>
						</div>
						<h3 className="text-base">{title}</h3>
					</CardTitle>
				</CardHeader>
				<CardContent className="px-2">
					{children}
					{/* <BevelContainer innerClassName="p-4" variant="in">
						{children}
					</BevelContainer> */}
				</CardContent>
				{footer ? (
					<CardFooter className="bg-background py-2 border border-x-0 border-b-0">{footer}</CardFooter>
				) : (
					<div className="h-2 w-full"></div>
				)}
			</Card>
		</BevelContainer>
	);
}
