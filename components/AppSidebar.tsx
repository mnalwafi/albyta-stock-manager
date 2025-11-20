"use client"

import * as React from "react"
import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Users,
    Truck,
    BarChart3,
    ShoppingBag,
    BookOpen,
    Settings,
    LifeBuoy,
    Search,
    Package,
    ChevronsUpDown,
    LogOut,
    LineChart
} from "lucide-react"

import { usePathname } from "next/navigation"
import Link from "next/link"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { PwaInstallButton } from "@/components/PwaInstallButton"

// --- DATA CONFIGURATION ---
const data = {
    user: {
        name: "Store Owner",
        email: "admin@stockpro.com",
        avatar: "", // Add image URL if you have one
    },
    // Primary Navigation
    navMain: [
        {
            title: "Overview",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "Cashier (POS)",
            url: "/cashier",
            icon: ShoppingCart,
        },
        {
            title: "History",
            url: "/transactions",
            icon: Receipt,
        },
        {
            title: "Reports",
            url: "/reports",
            icon: BarChart3,
        },
        {
            title: "Analytics",
            url: "/analytics",
            icon: LineChart, // or IconChartBar from tabler if you stick with that
        },
    ],
    // Operations Group
    navOperations: [
        {
            name: "Inventory Ops",
            items: [
                {
                    title: "Restock Advice",
                    url: "/restock",
                    icon: ShoppingBag,
                },
                {
                    title: "Consignment",
                    url: "/consignment",
                    icon: Truck,
                },
            ]
        }
    ],
    // CRM & Finance Group
    navFinance: [
        {
            name: "People & Debt",
            items: [
                {
                    title: "Customers",
                    url: "/customers",
                    icon: Users,
                },
                {
                    title: "Debt Book",
                    url: "/debt",
                    icon: BookOpen,
                },
            ]
        }
    ],
    // Bottom Secondary Items
    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: Settings,
        },
        {
            title: "Help",
            url: "#",
            icon: LifeBuoy,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" variant="inset" {...props} className="overflow-x-hidden">
            {/* HEADER: BRANDING */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                                    <Image
                                        src="/ngatur-stock-logo.png"
                                        alt="Ngatur Stock Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>

                                {/* Text Section */}
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold">Ngatur Stok</span>
                                    <span className="truncate text-xs">Aturin stokmu!</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* CONTENT: NAVIGATION GROUPS */}
            <SidebarContent>

                {/* 1. Main Platform */}
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 2. Operations (Restock / Consignment) */}
                {data.navOperations.map((group) => (
                    <SidebarGroup key={group.name} className="group-data-[collapsible=icon]:hidden">
                        <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                {/* 3. People (Customers / Debt) */}
                {data.navFinance.map((group) => (
                    <SidebarGroup key={group.name} className="group-data-[collapsible=icon]:hidden">
                        <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                <SidebarSeparator className="mx-0" />

                {/* 4. Secondary (Settings) */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navSecondary.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild size="sm">
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* FOOTER: USER PROFILE */}
            <SidebarFooter>
                <PwaInstallButton />
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}


// --- HELPER COMPONENT: NAV USER (Recreated inline) ---
function NavUser({ user }: { user: { name: string; email: string; avatar: string } }) {
    const { isMobile } = useSidebar()

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg bg-slate-200">SO</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">SO</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}