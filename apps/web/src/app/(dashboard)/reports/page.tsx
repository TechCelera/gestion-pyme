import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Genera y visualiza reportes financieros
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard
          title="Estado de Resultados"
          description="Ingresos, gastos y utilidad del periodo"
          icon={BarChart3}
        />
        <ReportCard
          title="Flujo de Caja"
          description="Movimientos de efectivo detallados"
          icon={TrendingUp}
        />
        <ReportCard
          title="Balance General"
          description="Activos, pasivos y patrimonio"
          icon={PieChart}
        />
        <ReportCard
          title="Reporte Mensual"
          description="Resumen completo del mes"
          icon={Calendar}
        />
        <ReportCard
          title="Libro Diario"
          description="Registro de todas las transacciones"
          icon={FileText}
        />
        <ReportCard
          title="Libro Mayor"
          description="Movimientos por cuenta contable"
          icon={FileText}
        />
      </div>
    </div>
  )
}

interface ReportCardProps {
  title: string
  description: string
  icon: React.ElementType
}

function ReportCard({ title, description, icon: Icon }: ReportCardProps) {
  return (
    <Card className="cursor-pointer hover:border-primary transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
