'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  Scatter,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Zap, Target, Activity, BarChart3, PieChart, Radar } from 'lucide-react'

// Vibrant color palette for "wow" effect
const COLORS = {
  primary: ['#7B68EE', '#00C9FF', '#92FE9D', '#FF6B6B', '#FFE66D', '#FF9F43'],
  gradients: [
    ['#7B68EE', '#00C9FF'],
    ['#FF6B6B', '#FFE66D'],
    ['#00C9FF', '#92FE9D'],
    ['#FF9F43', '#FF6B6B'],
  ],
}

// Mock data with impressive numbers
const revenueData = [
  { month: 'Ene', actual: 45000, projected: 42000, growth: 12 },
  { month: 'Feb', actual: 52000, projected: 48000, growth: 18 },
  { month: 'Mar', actual: 48000, projected: 51000, growth: -5 },
  { month: 'Abr', actual: 61000, projected: 55000, growth: 28 },
  { month: 'May', actual: 58000, projected: 62000, growth: -8 },
  { month: 'Jun', actual: 75000, projected: 68000, growth: 42 },
  { month: 'Jul', actual: 82000, projected: 75000, growth: 35 },
  { month: 'Ago', actual: 78000, projected: 80000, growth: 15 },
  { month: 'Sep', actual: 91000, projected: 85000, growth: 48 },
  { month: 'Oct', actual: 88000, projected: 90000, growth: 22 },
  { month: 'Nov', actual: 95000, projected: 92000, growth: 55 },
  { month: 'Dic', actual: 105000, projected: 98000, growth: 62 },
]

const expenseBreakdown = [
  { name: 'Personal', value: 35, color: '#7B68EE' },
  { name: 'Operaciones', value: 25, color: '#00C9FF' },
  { name: 'Marketing', value: 15, color: '#92FE9D' },
  { name: 'Infraestructura', value: 12, color: '#FF6B6B' },
  { name: 'Otros', value: 13, color: '#FFE66D' },
]

const kpiData = [
  { metric: 'Ventas', value: 85, fullMark: 100 },
  { metric: 'Clientes', value: 92, fullMark: 100 },
  { metric: 'Retencion', value: 78, fullMark: 100 },
  { metric: 'Eficiencia', value: 88, fullMark: 100 },
  { metric: 'Calidad', value: 95, fullMark: 100 },
  { metric: 'Innovacion', value: 72, fullMark: 100 },
]

const cashFlowData = [
  { day: 'Lun', entrada: 12000, salida: 8500 },
  { day: 'Mar', entrada: 15000, salida: 9200 },
  { day: 'Mie', entrada: 13500, salida: 7800 },
  { day: 'Jue', entrada: 18000, salida: 11000 },
  { day: 'Vie', entrada: 22000, salida: 13500 },
  { day: 'Sab', entrada: 8500, salida: 4200 },
  { day: 'Dom', entrada: 3200, salida: 1800 },
]

const scatterData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
  { x: 200, y: 350, z: 600 },
  { x: 180, y: 320, z: 450 },
  { x: 160, y: 180, z: 300 },
  { x: 130, y: 220, z: 250 },
]

export function WowDashboardCharts() {
  const [activeTab, setActiveTab] = useState('revenue')

  return (
    <div className="space-y-6">
      {/* KPI Cards with animations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Ventas"
          value="$1.2M"
          change="+28.4%"
          icon={TrendingUp}
          color="from-[#7B68EE] to-[#00C9FF]"
        />
        <KPICard
          title="Clientes"
          value="2,847"
          change="+12.8%"
          icon={Zap}
          color="from-[#FF6B6B] to-[#FFE66D]"
        />
        <KPICard
          title="Conversion"
          value="68.5%"
          change="+5.2%"
          icon={Target}
          color="from-[#00C9FF] to-[#92FE9D]"
        />
        <KPICard
          title="Actividad"
          value="94.2%"
          change="+8.1%"
          icon={Activity}
          color="from-[#FF9F43] to-[#FF6B6B]"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-fit">
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Ingresos</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden md:inline">Gastos</span>
          </TabsTrigger>
          <TabsTrigger value="kpi" className="gap-2">
            <Radar className="h-4 w-4" />
            <span className="hidden md:inline">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Flujo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7B68EE] to-[#00C9FF] flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Proyeccion de Ingresos 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7B68EE" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7B68EE" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C9FF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00C9FF" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#7B68EE"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Real"
                    />
                    <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#00C9FF"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorProjected)"
                      name="Proyectado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FFE66D] flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-white" />
                </div>
                Distribucion de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {expenseBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-bold ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00C9FF] to-[#92FE9D] flex items-center justify-center">
                  <Radar className="h-4 w-4 text-white" />
                </div>
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={kpiData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar
                      name="Actual"
                      dataKey="value"
                      stroke="#7B68EE"
                      strokeWidth={3}
                      fill="#7B68EE"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Meta"
                      dataKey="fullMark"
                      stroke="#00C9FF"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="#00C9FF"
                      fillOpacity={0.1}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF9F43] to-[#FF6B6B] flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                Flujo de Caja Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashFlowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Bar dataKey="entrada" fill="#92FE9D" name="Entradas" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="salida" fill="#FF6B6B" name="Salidas" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="entrada" stroke="#7B68EE" strokeWidth={3} dot={{ r: 6 }} />
                    <Scatter dataKey="salida" fill="#FF9F43" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
}

function KPICard({ title, value, change, icon: Icon, color }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono mt-1">{value}</p>
            <p className="text-xs text-success mt-1">{change}</p>
          </div>
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
