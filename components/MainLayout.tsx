"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/AppSidebar"
import { SiteHeader } from "@/components/SiteHeader"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // CHECK: Is this the Cashier page?
  const isCashier = pathname === "/cashier"

  // SCENARIO 1: Cashier Page (Full Screen, No Sidebar)
  if (isCashier) {
    return <>{children}</>
  }

  // SCENARIO 2: All Other Pages (Show Sidebar & Header)
return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* 1. Header is INSIDE the Inset */}
        <SiteHeader />
        
        {/* 2. Page Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
           {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
)
}