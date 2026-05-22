'use client'

import { useCallback, useEffect, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BarChart3, Pencil, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getProjects, type Project } from '@/lib/actions/projects'
import { formatCurrency } from '@/lib/format/currency'
import { useCompanyOperatingCurrency } from '@/hooks/use-company-operating-currency'
import { ProjectForm } from '@/components/projects/project-form'

export function ProyectosPageContent() {
  const { currency } = useCompanyOperatingCurrency(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    const result = await getProjects()
    if (result.success && result.data) {
      setProjects(result.data)
    } else {
      toast.error(result.error ?? 'No se pudieron cargar los proyectos')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadProjects()
    })
  }, [loadProjects])

  const handleOpenCreate = () => {
    setEditingProject(null)
    setIsProjectFormOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsProjectFormOpen(true)
  }

  const renderRows = (items: Project[], depth = 0): ReactElement[] => {
    return items.flatMap((project) => {
      const usage = project.budgetAmount > 0
        ? ((project.spentAmount ?? 0) / project.budgetAmount) * 100
        : 0

      const currentRow = (
        <TableRow key={project.id}>
          <TableCell className="font-medium">{`${'— '.repeat(depth)}${project.name}`}</TableCell>
          <TableCell>{formatCurrency(project.budgetAmount, currency)}</TableCell>
          <TableCell>{formatCurrency(project.spentAmount ?? 0, currency)}</TableCell>
          <TableCell className={usage > 100 ? 'text-red-600 font-medium' : ''}>{usage.toFixed(1)}%</TableCell>
          <TableCell className="text-right">
            <div className="inline-flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/proyectos/${project.id}`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análisis
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )

      const childrenRows = project.children && project.children.length > 0
        ? renderRows(project.children, depth + 1)
        : []

      return [currentRow, ...childrenRows]
    })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Proyectos"
        description="Administra proyectos y subproyectos con presupuesto y plazo."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Consumo Presupuestario</CardTitle>
          <Button size="sm" className="bg-[#7B68EE] hover:bg-[#7B68EE]/90" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo proyecto
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando proyectos...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay proyectos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Ejecutado</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderRows(projects)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false)
          setEditingProject(null)
        }}
        onSaved={loadProjects}
        project={editingProject}
        projects={projects}
      />
    </div>
  )
}

