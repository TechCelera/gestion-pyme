'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <Tabs value="resultados">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 lg:w-fit">
          <TabsTrigger value="resultados" disabled>
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Resultados</span>
          </TabsTrigger>
          <TabsTrigger value="gastos" disabled>
            <PieChart className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Gastos</span>
          </TabsTrigger>
          <TabsTrigger value="radar" disabled>
            <Target className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="flujo" disabled>
            <Activity className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Flujo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resultados" className="mt-4">
          <ChartCardSkeleton />
        </TabsContent>
      </Tabs>
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
