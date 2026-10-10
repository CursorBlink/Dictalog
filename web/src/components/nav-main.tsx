"use client";

import { ChevronRightIcon } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: React.ReactNode;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						defaultOpen={item.isActive}
						render={<SidebarMenuItem />}
					>
						<SidebarMenuButton
							render={
								<a href={item.url}>
									{item.icon}
									<span>{item.title}</span>
								</a>
							}
							tooltip={item.title}
						/>
						{item.items?.length ? (
							<>
								<CollapsibleTrigger
									render={
										<SidebarMenuAction className="data-panel-open:rotate-90">
											<ChevronRightIcon />
											<span className="sr-only">Toggle</span>
										</SidebarMenuAction>
									}
								/>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													render={
														<a href={subItem.url}>
															<span>{subItem.title}</span>
														</a>
													}
												/>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</>
						) : null}
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
