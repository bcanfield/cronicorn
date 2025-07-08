"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, User, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuthSession } from "@/lib/client-auth-wrapper";

export function Navbar() {
	const { data: session } = useAuthSession();

	return (
		<nav className="bg-background h-16 pt-1 px-1">
			<div className="flex  items-center px-4 bg-primary h-full">
				<div className="flex items-center space-x-4">
					<Link href="/dashboard" className="flex items-center space-x-2">
						<div className="bg-background">
							<Image alt="Cronicorn Logo" width={24} height={24} src="/cronicorn.png"></Image>
						</div>

						<span className="  text-sm font-family-app-header! text-primary-foreground">Cronicorn</span>
					</Link>
				</div>

				<div className="ml-auto flex items-center space-x-2">
					<Link href="/dashboard/jobs">
						<Button variant="outline">Jobs</Button>
					</Link>
					<Link href="/dashboard/settings/api-keys">
						<Button variant="outline">
							<Settings className="h-4 w-4" />
							Settings
						</Button>
					</Link>

					{session?.user && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size={"icon"} className="relative">
									<Avatar className="h-8 w-8 rounded-none p-1">
										<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
										<AvatarFallback>
											<User className="h-4 w-4" />
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuItem onClick={() => signOut()}>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Log out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</nav>
	);
}
