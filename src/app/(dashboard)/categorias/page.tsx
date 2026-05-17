'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCategories, deleteCategory } from '@/lib/actions/categories'
import { CATEGORY_TYPES, getCategoryTypeLabel, isCategoryIncomeType } from '@/lib/constants'
import { DEMO_CATEGORIES } from '@/lib/demo-data'
import { useAuthStore } from '@/stores/auth-store'
import { CategoryForm } from '@/components/settings/category-form'

import type { Category } from '@/lib/actions/categories'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      setCategories(DEMO_CATEGORIES.map((c) => ({ ...c })))
      return
    }

    setIsLoading(true)
    try {
      const categoriesResult = await getCategories()
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error al cargar las categorías')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  const handleOpenCategoryForm = (category?: Category) => {
    setEditingCategory(category ?? null)
    setIsCategoryFormOpen(true)
  }

  const handleCloseCategoryForm = () => {
    setIsCategoryFormOpen(false)
    setEditingCategory(null)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (isDemoMode) {
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      toast.success('Categoría eliminada (demo)')
      return
    }

    const result = await deleteCategory(category.id)
    if (result.success) {
      toast.success('Categoría eliminada exitosamente')
      fetchData()
    } else {
      toast.error(result.error || 'Error al eliminar la categoría')
    }
  }

  const filteredCategories =
    categoryFilter === 'all'
      ? categories
      : categoryFilter === 'income'
        ? categories.filter((c) => c.type === CATEGORY_TYPES.INCOME)
        : categoryFilter === 'expense'
          ? categories.filter((c) => c.type === CATEGORY_TYPES.EXPENSE)
          : categories

  return (
    <div className="p-4 md:p-8 space-y-6">
      {isDemoMode && (
        <Card className="border-[#7B68EE]/30 bg-[#7B68EE]/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Info className="h-5 w-5 text-[#7B68EE] shrink-0" />
            <p className="text-sm text-foreground">
              Estás en modo demo. Los cambios no se guardarán.
            </p>
          </CardContent>
        </Card>
      )}

      <PageHeader
        title="Categorías"
        description="Clasificá cada movimiento como ingreso o gasto. Los nombres los elegís vos; el tipo define en qué informes entra."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Listado</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
                className={categoryFilter === 'all' ? 'bg-[#7B68EE] hover:bg-[#7B68EE]/90' : ''}
              >
                Todas
              </Button>
              <Button
                variant={categoryFilter === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('income')}
                className={categoryFilter === 'income' ? 'bg-[#7B68EE] hover:bg-[#7B68EE]/90' : ''}
              >
                Ingresos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (categoryFilter === 'expense') {
                    setCategoryFilter('all')
                  } else {
                    setCategoryFilter('expense')
                  }
                }}
                className={
                  categoryFilter === 'expense'
                    ? 'bg-[#7B68EE] hover:bg-[#7B68EE]/90 text-primary-foreground'
                    : ''
                }
              >
                Gastos
              </Button>
            </div>
            <Button
              onClick={() => handleOpenCategoryForm()}
              size="sm"
              className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nueva categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">
                {categoryFilter === 'all'
                  ? 'No hay categorías registradas'
                  : 'No hay categorías con este filtro'}
              </p>
              <p className="text-xs mt-1">Creá tu primera categoría para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => {
                  const isIncome = isCategoryIncomeType(category.type)
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isIncome
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                          }
                        >
                          {getCategoryTypeLabel(category.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            ···
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenCategoryForm(category)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        isOpen={isCategoryFormOpen}
        onClose={handleCloseCategoryForm}
        onSaved={() => fetchData()}
        category={editingCategory}
      />
    </div>
  )
}
