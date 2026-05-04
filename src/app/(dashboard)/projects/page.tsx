'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
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
import { ProjectForm } from '@/components/projects/project-form'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const loadProjects = async () => {
    setIsLoading(true)
    const result = await getProjects()
    if (result.success && result.data) {
      setProjects(result.data)
    } else {
      toast.error(result.error ?? 'No se pudieron cargar los proyectos')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleOpenCreate = () => {
    setEditingProject(null)
    setIsProjectFormOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsProjectFormOpen(true)
  }

  const renderRows = (items: Project[], depth = 0): JSX.Element[] => {
    return items.flatMap((project) => {
      const usage = project.budgetAmount > 0
        ? ((project.spentAmount ?? 0) / project.budgetAmount) * 100
        : 0

      const currentRow = (
        <TableRow key={project.id}>
          <TableCell className="font-medium">{`${'— '.repeat(depth)}${project.name}`}</TableCell>
          <TableCell>{project.budgetAmount.toLocaleString('es-AR')}</TableCell>
          <TableCell>{(project.spentAmount ?? 0).toLocaleString('es-AR')}</TableCell>
          <TableCell className={usage > 100 ? 'text-red-600 font-medium' : ''}>{usage.toFixed(1)}%</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
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
