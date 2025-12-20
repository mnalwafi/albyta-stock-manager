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
    LineChart,
    ChevronsUpDown,
    LogOut
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

// --- KONFIGURASI DATA (INDONESIA) ---
const data = {
    user: {
        name: "Pemilik Toko",
        email: "admin@ngaturstok.com",
        avatar: "",
    },
    // Menu Utama
    navMain: [
        {
            title: "Ringkasan", // Overview
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "Kasir (POS)", // Cashier
            url: "/cashier",
            icon: ShoppingCart,
        },
        {
            title: "Riwayat Transaksi", // History
            url: "/transactions",
            icon: Receipt,
        },
        {
            title: "Laporan", // Reports
            url: "/reports",
            icon: BarChart3,
        },
        {
            title: "Analitik", // Analytics
            url: "/analytics",
            icon: LineChart,
        },
    ],
    // Operasional
    navOperations: [
        {
            name: "Inventaris", // Inventory Ops
            items: [
                {
                    title: "Saran Restock", // Restock Advice
                    url: "/restock",
                    icon: ShoppingBag,
                },
                {
                    title: "Titip Jual (Konsinyasi)", // Consignment
                    url: "/consignment",
                    icon: Truck,
                },
            ]
        }
    ],
    // Keuangan & Kontak
    navFinance: [
        {
            name: "Kontak & Hutang", // People & Debt
            items: [
                {
                    title: "Pelanggan", // Customers
                    url: "/customers",
                    icon: Users,
                },
                {
                    title: "Buku Kasbon", // Debt Book
                    url: "/debt",
                    icon: BookOpen,
                },
            ]
        }
    ],
    // Menu Sekunder
    navSecondary: [
        {
            title: "Pengaturan", // Settings
            url: "#",
            icon: Settings,
        },
        {
            title: "Bantuan", // Help
            url: "#",
            icon: LifeBuoy,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" variant="inset" {...props} className="overflow-x-hidden">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                                    <Image
                                        src="/ngatur-stock-logo.png"
                                        alt="Logo Ngatur Stok"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold">Ngatur Stok</span>
                                    <span className="truncate text-xs">Aturin stokmu!</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* 1. Platform Utama */}
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
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

                {/* 2. Operasional */}
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

                {/* 3. Keuangan */}
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

                {/* 4. Sekunder */}
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

            <SidebarFooter>
                <PwaInstallButton />
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}

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
                                <AvatarFallback className="rounded-lg bg-slate-200">TO</AvatarFallback>
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
                                    <AvatarFallback className="rounded-lg">TO</AvatarFallback>
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
                                Pengaturan
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}