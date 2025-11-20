"use client"

import { StockTable } from "@/components/StockTable"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"

// Look how clean this is now! No SidebarProvider, No Header.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

      {/* 2. Interactive Chart */}
      <div className="px-4 lg:px-6">
        <DashboardAnalytics />
      </div>

      {/* 3. Data Table */}
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-1">
          <StockTable />
        </div>
      </div>
    </div>
  )
}