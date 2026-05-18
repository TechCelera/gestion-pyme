'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTabs, PageTabsContent } from '@/components/ui/page-tabs'
import { BarChart3, PieChart, Target, Activity } from 'lucide-react'

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* KPI Cards skeleton - matches grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-10 w-10 md:h-14 md:w-14 rounded-xl shrink-0 ml-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Tabs skeleton */}
      <PageTabs
        value="resultados"
        onValueChange={() => {}}
        tabs={[
          { value: 'resultados', label: 'Resultados', icon: BarChart3 },
          { value: 'gastos', label: 'Gastos', icon: PieChart },
          { value: 'radar', label: 'KPIs', icon: Target },
          { value: 'flujo', label: 'Flujo', icon: Activity },
        ]}
      >
        <PageTabsContent value="resultados">
          <ChartCardSkeleton />
        </PageTabsContent>
      </PageTabs>
    </div>
  )
}

function ChartCardSkeleton() {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  )
}
