"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { AddStockDialog } from "@/components/AddStockDialog"
import { BackupManager } from "@/components/BackupManager"

export function SiteHeader() {
    const pathname = usePathname()

    // Helper to get the page title based on URL
    const getPageTitle = (path: string) => {
        if (path === "/") return "Overview"
        if (path.startsWith("/transactions")) return "Transaction History"
        if (path.startsWith("/customers")) return "Customers"
        if (path.startsWith("/debt")) return "Debt Book"
        if (path.startsWith("/consignment")) return "Consignment"
        if (path.startsWith("/restock")) return "Restock Advice"
        if (path.startsWith("/reports")) return "Financial Reports"
        if (path.startsWith("/stock")) return "Product Details"
        return "Page"
    }

    const currentTitle = getPageTitle(pathname)

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 sticky top-0 z-10">

            {/* LEFT SIDE: Trigger & Breadcrumbs */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">StockPro</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* RIGHT SIDE: Actions */}
            <div className="flex items-center gap-2">
                    <BackupManager />
                <AddStockDialog />
            </div>

        </header>
    )
}