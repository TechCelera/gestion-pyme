'use client'

import { Card, CardContent } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  change?: string
  icon: LucideIcon
  gradient: string
}

export function KpiCard({ title, value, change, icon: Icon, gradient }: KpiCardProps) {
  const isPositive = change ? change.startsWith('+') : true

  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
      <CardContent className="p-4 md:p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-xl md:text-3xl font-bold font-mono mt-1 md:mt-2 tracking-tight">{value}</p>
            {change && (
              <p className={`text-xs md:text-sm font-semibold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {change} vs mes anterior
              </p>
            )}
          </div>
          <div className={`h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
