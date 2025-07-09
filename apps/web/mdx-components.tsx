import type React from "react";
import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@cronicorn/ui/lib/utils";
import Image, { type ImageProps as NextImageProps } from "next/image";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type ParagraphProps = ComponentPropsWithoutRef<"p">;
type ListProps = ComponentPropsWithoutRef<"ul">;
type ListItemProps = ComponentPropsWithoutRef<"li">;
type AnchorProps = ComponentPropsWithoutRef<"a">;
type BlockquoteProps = ComponentPropsWithoutRef<"blockquote">;
type CodeProps = ComponentPropsWithoutRef<"code">;
type PreProps = ComponentPropsWithoutRef<"pre">;

const components = {
	h1: (props: HeadingProps) => (
		<h1 className="scroll-m-20 text-3xl font-bold tracking-tight first:mt-0 mt-4" {...props} />
	),
	h2: (props: HeadingProps) => (
		<h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mt-4 first:mt-0" {...props} />
	),
	h3: (props: HeadingProps) => (
		<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4" {...props} />
	),
	h4: (props: HeadingProps) => <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props} />,
	h5: (props: HeadingProps) => <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2" {...props} />,
	h6: (props: HeadingProps) => (
		<h6 className="scroll-m-20 text-base font-semibold tracking-tight mt-4 mb-2" {...props} />
	),
	p: (props: ParagraphProps) => <p className="leading-7 [&:not(:first-child)]:mt-6 text-muted-foreground" {...props} />,
	ol: (props: ListProps) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 text-muted-foreground" {...props} />,
	ul: (props: ListProps) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2 text-muted-foreground" {...props} />,
	li: (props: ListItemProps) => <li className="leading-7" {...props} />,
	em: (props: ComponentPropsWithoutRef<"em">) => <em className="italic" {...props} />,
	strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold" {...props} />,
	a: ({ href, children, ...props }: AnchorProps) => {
		const className = "font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors";

		if (href?.startsWith("/")) {
			return (
				<Link href={href} className={className} {...props}>
					{children}
				</Link>
			);
		}
		if (href?.startsWith("#")) {
			return (
				<a href={href} className={className} {...props}>
					{children}
				</a>
			);
		}
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>
				{children}
			</a>
		);
	},
	blockquote: (props: BlockquoteProps) => (
		<blockquote className="mt-6 border-l-2 border-border pl-6 italic text-muted-foreground" {...props} />
	),
	code: ({ className, children, ...props }: CodeProps) => (
		<code
			className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", className)}
			{...props}
		>
			{children}
		</code>
	),
	pre: ({ className, children, ...props }: PreProps) => (
		<pre className={cn("mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4", className)} {...props}>
			{children}
		</pre>
	),
	img: (props: NextImageProps) => (
		<Image sizes="100vw" style={{ width: "100%", height: "auto" }} {...(props as NextImageProps)} />
	),
	table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
		<div className="my-6 w-full overflow-y-auto">
			<Table {...props}>{children}</Table>
		</div>
	),
	thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
		<TableHeader {...props}>{children}</TableHeader>
	),
	tbody: ({ children, ...props }: ComponentPropsWithoutRef<"tbody">) => <TableBody {...props}>{children}</TableBody>,
	tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => <TableRow {...props}>{children}</TableRow>,
	th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => <TableHead {...props}>{children}</TableHead>,
	td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => <TableCell {...props}>{children}</TableCell>,
	// Custom components for enhanced MDX experience
	Card: ({
		title,
		description,
		children,
		...props
	}: {
		title?: string;
		description?: string;
		children: React.ReactNode;
	}) => (
		<Card className="my-6" {...props}>
			{(title || description) && (
				<CardHeader>
					{title && <CardTitle>{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent>{children}</CardContent>
		</Card>
	),

	Badge: ({
		variant = "default",
		children,
		...props
	}: {
		variant?: "default" | "secondary" | "destructive" | "outline";
		children: React.ReactNode;
	}) => (
		<Badge variant={variant} {...props}>
			{children}
		</Badge>
	),
	Button: ({
		variant = "default",
		size = "default",
		children,
		...props
	}: {
		variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
		size?: "default" | "sm" | "lg" | "icon";
		children: React.ReactNode;
	}) => (
		<Button variant={variant} size={size} className="my-2" {...props}>
			{children}
		</Button>
	),
};

declare global {
	type MDXProvidedComponents = typeof components;
}

export function useMDXComponents(): MDXProvidedComponents {
	return components;
}
