"use client";

import { useRouteContext } from "@tanstack/react-router";
import {
	LayoutDashboard,
	ScrollText,
	Settings2,
	TerminalIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
	navMain: [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: <LayoutDashboard />,
		},
		{
			title: "Settings",
			url: "/settings/sources",
			icon: <Settings2 />,
			items: [
				{
					title: "Sources",
					url: "/settings/sources",
				},
			],
		},
		{
			title: "Log",
			url: "/log",
			icon: <ScrollText />,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useRouteContext({ from: "/_authenticated" });
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={
								<a href="#">
									<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
										<TerminalIcon className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">Dictalog</span>
										<span className="truncate text-xs">Free</span>
									</div>
								</a>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
