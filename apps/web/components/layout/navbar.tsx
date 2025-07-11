"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, LogOut, Briefcase } from "lucide-react";
import Image from "next/image";

export function Navbar({ withUserMenu = true }: { withUserMenu?: boolean }) {
	return (
		<nav className="bg-background h-11 pt-1 px-1">
			<div className="flex  items-center px-4 bg-primary h-full">
				<div className="flex items-center space-x-4">
					<Link href="/" className="flex items-center space-x-2">
						<div className="bg-primary-foreground  p-0.5">
							<Image alt="Cronicorn Logo" width={12} height={12} src="/cronicorn.png"></Image>
						</div>

						{/* <span className="  text-sm font-family-app-header! text-primary-foreground">Cronicorn</span> */}
						<span className=" text-base font-family-heading text-primary-foreground font-semibold">Cronicorn.com</span>
					</Link>
				</div>
				{/* {withUserMenu && <UserMenu />} */}
			</div>
		</nav>
	);
}

// const UserMenu = () => {
// 	const { data: session } = useAuthSession();

// 	return (
// 		<div className="ml-auto flex items-center space-x-2">
// 			<Link href="/dashboard/jobs" className={buttonVariants({ variant: "outline", size: "xs" })}>
// 				<Briefcase className="size-3" />
// 				Jobs
// 			</Link>
// 			<Link href="/dashboard/settings/api-keys" className={buttonVariants({ variant: "outline", size: "xs" })}>
// 				<Settings className="size-3" />
// 				Settings
// 			</Link>

// 			{session?.user && (
// 				<DropdownMenu>
// 					<DropdownMenuTrigger asChild>
// 						<Button variant="outline" size={"xs"} className="relative">
// 							<Avatar className="size-3 rounded-none p-1">
// 								<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
// 								<AvatarFallback>
// 									<User className="h-4 w-4" />
// 								</AvatarFallback>
// 							</Avatar>
// 						</Button>
// 					</DropdownMenuTrigger>
// 					<DropdownMenuContent className="w-56" align="end" forceMount>
// 						<DropdownMenuItem onClick={() => signOut()}>
// 							<LogOut className="mr-2 h-4 w-4" />
// 							<span>Log out</span>
// 						</DropdownMenuItem>
// 					</DropdownMenuContent>
// 				</DropdownMenu>
// 			)}
// 		</div>
// 	);
// };
