
'use client';

import { Header } from "@/components/layout/header";
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <DashboardTabs />
        {children}
      </main>
    </div>
  )
}
