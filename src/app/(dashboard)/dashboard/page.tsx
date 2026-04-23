'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, ArrowDownRight, DollarSign, Zap, 
  BarChart3, PieChart, Activity, Plus,
  ArrowRightLeft, Wallet, Sparkles
} from 'lucide-react'
import { getDashboardStats } from '@/lib/actions/transactions'
import { useAuthStore } from '@/stores/auth-store'
import type { DashboardStats } from '@/lib/actions/transactions'
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Line
} from 'recharts'

// Data para DEMO
const DEMO_REVENUE_DATA = [
  { month: 'Ene', ingresos: 45000, gastos: 32000, utilidad: 13000 },
  { month: 'Feb', ingresos: 52000, gastos: 38000, utilidad: 14000 },
  { month: 'Mar', ingresos: 48000, gastos: 35000, utilidad: 13000 },
  { month: 'Abr', ingresos: 61000, gastos: 42000, utilidad: 19000 },
  { month: 'May', ingresos: 58000, gastos: 40000, utilidad: 18000 },
  { month: 'Jun', ingresos: 75000, gastos: 48000, utilidad: 27000 },
  { month: 'Jul', ingresos: 82000, gastos: 52000, utilidad: 30000 },
  { month: 'Ago', ingresos: 78000, gastos: 49000, utilidad: 29000 },
  { month: 'Sep', ingresos: 91000, gastos: 58000, utilidad: 33000 },
  { month: 'Oct', ingresos: 88000, gastos: 55000, utilidad: 33000 },
  { month: 'Nov', ingresos: 95000, gastos: 60000, utilidad: 35000 },
  { month: 'Dic', ingresos: 105000, gastos: 65000, utilidad: 40000 },
]

const DEMO_EXPENSE_DATA = [
  { name: 'Personal', value: 35, color: '#7B68EE' },
  { name: 'Operaciones', value: 25, color: '#00C9FF' },
  { name: 'Marketing', value: 15, color: '#92FE9D' },
  { name: 'Infraestructura', value: 12, color: '#FF6B6B' },
  { name: 'Otros', value: 13, color: '#FFE66D' },
]

const DEMO_KPI_DATA = [
  { metric: 'Ventas', actual: 85, meta: 100 },
  { metric: 'Clientes', actual: 92, meta: 100 },
  { metric: 'Retencion', actual: 78, meta: 100 },
  { metric: 'Eficiencia', actual: 88, meta: 100 },
  { metric: 'Calidad', actual: 95, meta: 100 },
  { metric: 'Innovacion', actual: 72, meta: 100 },
]

const DEMO_CASHFLOW_DATA = [
  { dia: 'Lun', entradas: 12000, salidas: 8500 },
  { dia: 'Mar', entradas: 15000, salidas: 9200 },
  { dia: 'Mie', entradas: 13500, salidas: 7800 },
  { dia: 'Jue', entradas: 18000, salidas: 11000 },
  { dia: 'Vie', entradas: 22000, salidas: 13500 },
  { dia: 'Sab', entradas: 8500, salidas: 4200 },
  { dia: 'Dom', entradas: 3200, salidas: 1800 },
]

export default function DashboardPage() {
  const [tab, setTab] = useState('resumen')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  useEffect(() => {
    if (!isDemoMode) {
      async function loadStats() {
        const result = await getDashboardStats()
        if (result.success && result.data) {
          setStats(result.data)
        }
        setIsLoading(false)
      }
      loadStats()
    } else {
      setIsLoading(false)
    }
  }, [isDemoMode])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // ==================== MODO DEMO ====================
  if (isDemoMode) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen de la situación de tu empresa</p>
        </div>

        {/* Demo Banner */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3">
            <p className="text-sm text-yellow-700 font-medium">🎪 Modo Demo — Estos son datos de prueba para que explores la app</p>
          </CardContent>
        </Card>

        {/* KPI Cards - Demo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Ventas del Mes" value="$1.2M" change="+28.4%" icon={TrendingUp} gradient="from-[#7B68EE] to-[#00C9FF]" />
          <KpiCard title="Gastos del Mes" value="$875K" change="-3.2%" icon={ArrowDownRight} gradient="from-[#FF6B6B] to-[#FFE66D]" />
          <KpiCard title="Resultado Neto" value="$375K" change="+42.1%" icon={DollarSign} gradient="from-[#00C9FF] to-[#92FE9D]" />
          <KpiCard title="Flujo de Caja" value="$520K" change="+15.8%" icon={Zap} gradient="from-[#FF9F43] to-[#FF6B6B]" />
        </div>

        {/* Charts Tabs - Demo */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 lg:w-fit">
            <TabsTrigger value="resumen"><BarChart3 className="h-4 w-4 mr-2" />Resultados</TabsTrigger>
            <TabsTrigger value="gastos"><PieChart className="h-4 w-4 mr-2" />Gastos</TabsTrigger>
            <TabsTrigger value="radar"><Activity className="h-4 w-4 mr-2" />KPIs</TabsTrigger>
            <TabsTrigger value="flujo"><TrendingUp className="h-4 w-4 mr-2" />Flujo</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-4">
            <ChartCard icon={BarChart3} title="Estado de Resultados 2024" subtitle="Ingresos, gastos y utilidad mensual" gradient="from-[#7B68EE] to-[#00C9FF]">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={DEMO_REVENUE_DATA}>
                  <defs>
                    <linearGradient id="ingresos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7B68EE" stopOpacity={0.8}/><stop offset="95%" stopColor="#7B68EE" stopOpacity={0.1}/></linearGradient>
                    <linearGradient id="gastos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/><stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/></linearGradient>
                    <linearGradient id="utilidad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#92FE9D" stopOpacity={0.8}/><stop offset="95%" stopColor="#92FE9D" stopOpacity={0.1}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff'}} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="ingresos" stroke="#7B68EE" strokeWidth={3} fill="url(#ingresos)" name="Ingresos" />
                  <Area type="monotone" dataKey="gastos" stroke="#FF6B6B" strokeWidth={3} fill="url(#gastos)" name="Gastos" />
                  <Area type="monotone" dataKey="utilidad" stroke="#92FE9D" strokeWidth={3} fill="url(#utilidad)" name="Utilidad" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="gastos" className="mt-4">
            <ChartCard icon={PieChart} title="Distribución de Gastos" subtitle="Por categoría — Total: $875,000" gradient="from-[#FF6B6B] to-[#FFE66D]">
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie data={DEMO_EXPENSE_DATA} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={4} dataKey="value">
                      {DEMO_EXPENSE_DATA.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={2} stroke="#fff" />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff'}} formatter={(v, n) => [`${v}% - $${((Number(v)/100)*875000).toLocaleString()}`, n]} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex flex-col justify-center">
                  {DEMO_EXPENSE_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">${((item.value/100)*875000).toLocaleString()}</div>
                      </div>
                      <div className="text-xl font-bold font-mono" style={{ color: item.color }}>{item.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </TabsContent>

          <TabsContent value="radar" className="mt-4">
            <ChartCard icon={Activity} title="Performance Radar" subtitle="Indicadores clave vs metas" gradient="from-[#00C9FF] to-[#92FE9D]">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={DEMO_KPI_DATA}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#6B7280', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Actual" dataKey="actual" stroke="#7B68EE" strokeWidth={3} fill="#7B68EE" fillOpacity={0.4} />
                  <Radar name="Meta" dataKey="meta" stroke="#00C9FF" strokeWidth={2} strokeDasharray="5 5" fill="#00C9FF" fillOpacity={0.1} />
                  <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff'}} formatter={(v, n) => [`${v}%`, n]} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          <TabsContent value="flujo" className="mt-4">
            <ChartCard icon={TrendingUp} title="Flujo de Caja Semanal" subtitle="Entradas vs salidas por día" gradient="from-[#FF9F43] to-[#FF6B6B]">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={DEMO_CASHFLOW_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="dia" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff'}} formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n]} />
                  <Bar dataKey="entradas" fill="#92FE9D" name="Entradas" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="salidas" fill="#FF6B6B" name="Salidas" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="entradas" stroke="#7B68EE" strokeWidth={3} dot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <SummaryBox label="Entradas Semana" value="$88,200" color="text-green-500" bg="bg-green-500/10" />
                <SummaryBox label="Salidas Semana" value="$56,000" color="text-red-500" bg="bg-red-500/10" />
                <SummaryBox label="Saldo Neto" value="+$32,200" color="text-[#7B68EE]" bg="bg-[#7B68EE]/10" />
              </div>
            </ChartCard>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ==================== CUENTA REAL ====================

  // Empty state — no transactions yet
  if (!isLoading && stats?.totalTransactions === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen de la situación de tu empresa</p>
        </div>

        {/* Welcome Card */}
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-[#7B68EE]/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-[#7B68EE]" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-semibold">¡Bienvenido a Gestion PYME Pro!</h2>
              <p className="text-muted-foreground text-sm">
                Aún no tienes transacciones registradas. Empieza creando tu primera transacción 
                para ver el resumen financiero de tu empresa aquí.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push('/transactions')}
                className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear mi primera transacción
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Configurar cuentas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">1. Crea tus cuentas</h3>
                <p className="text-sm text-muted-foreground">
                  Registra tus cuentas bancarias y de efectivo en Configuración.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">2. Registra transacciones</h3>
                <p className="text-sm text-muted-foreground">
                  Graba ingresos, egresos y transferencias de tu empresa.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">3. Visualiza resultados</h3>
                <p className="text-sm text-muted-foreground">
                  Tu dashboard se llenará automáticamente con gráficas y métricas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Real dashboard with data
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de la situación de tu empresa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          title="Ingresos" 
          value={formatCurrency(stats?.totalIncome ?? 0)} 
          change="" 
          icon={TrendingUp} 
          gradient="from-[#7B68EE] to-[#00C9FF]" 
        />
        <KpiCard 
          title="Gastos" 
          value={formatCurrency(stats?.totalExpenses ?? 0)} 
          change="" 
          icon={ArrowDownRight} 
          gradient="from-[#FF6B6B] to-[#FFE66D]" 
        />
        <KpiCard 
          title="Resultado Neto" 
          value={formatCurrency(stats?.netBalance ?? 0)} 
          change="" 
          icon={DollarSign} 
          gradient="from-[#00C9FF] to-[#92FE9D]" 
        />
        <KpiCard 
          title="Total Transacciones" 
          value={String(stats?.totalTransactions ?? 0)} 
          change="" 
          icon={Zap} 
          gradient="from-[#FF9F43] to-[#FF6B6B]" 
        />
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Pendientes" value={stats?.pendingCount ?? 0} color="text-yellow-600" />
        <StatBox label="Aprobadas" value={stats?.approvedCount ?? 0} color="text-[#7B68EE]" />
        <StatBox label="Contabilizadas" value={stats?.postedCount ?? 0} color="text-green-600" />
      </div>

      {/* Charts placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gráficas</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Las gráficas se habilitarán cuando tengas más transacciones registradas.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Components
function KpiCard({ title, value, change, icon: Icon, gradient }: { title: string; value: string; change: string; icon: React.ElementType; gradient: string }) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
      <CardContent className="p-4 md:p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-xl md:text-2xl font-bold font-mono mt-1 md:mt-2 tracking-tight">{value}</p>
            {change && <p className="text-xs md:text-sm font-semibold mt-1 text-muted-foreground">{change}</p>}
          </div>
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ icon: Icon, title, subtitle, gradient, children }: { icon: React.ElementType; title: string; subtitle: string; gradient: string; children: React.ReactNode }) {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div>{title}</div>
            <div className="text-sm font-normal text-muted-foreground">{subtitle}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SummaryBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-lg ${bg} text-center`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
