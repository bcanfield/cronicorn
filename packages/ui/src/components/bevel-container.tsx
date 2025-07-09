import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@cronicorn/ui/lib/utils";

export const bevelVariants = cva("w-full h-full", {
	variants: {
		variant: {
			out: "border-2 border-solid border-t-[var(--bevel-light)] border-l-[var(--bevel-light)] border-r-[var(--bevel-dark)] border-b-[var(--bevel-dark)]",
			in: "border-2 border-solid border-t-[var(--bevel-dark)] border-l-[var(--bevel-dark)] border-r-[var(--bevel-light)] border-b-[var(--bevel-light)]",
			flat: "border border-solid border-[var(--color-border)]",
		},
	},
	defaultVariants: {
		variant: "out",
	},
});

interface BevelContainerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bevelVariants> {
	innerClassName?: string;
}

const BevelContainer = React.forwardRef<HTMLDivElement, BevelContainerProps>(
	({ className, innerClassName, children, variant, ...props }, ref) => {
		return (
			<div ref={ref} className={cn(bevelVariants({ variant }), className)} {...props}>
				<div className={cn("w-full h-full border border-border/40 p-2", innerClassName)}>{children}</div>
			</div>
		);
	},
);

BevelContainer.displayName = "BevelContainer";

export { BevelContainer };
