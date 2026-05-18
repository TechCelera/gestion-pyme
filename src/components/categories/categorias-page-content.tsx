'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TableRowActions } from '@/components/ui/table-row-actions'
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
import { getCategories, deleteCategory, type Category } from '@/lib/actions/categories'
import { CATEGORY_TYPES, getCategoryTypeLabel, isCategoryIncomeType } from '@/lib/constants'
import { parseCategoriasFilter } from '@/lib/categories/categorias-filter'
import { CategoriasFilterTabs } from '@/components/categories/categorias-filter-tabs'
import { CategoryForm } from '@/components/settings/category-form'

interface CategoriasPageContentProps {
  tipo: string | null
}

export function CategoriasPageContent({ tipo }: CategoriasPageContentProps) {
  const categoryFilter = parseCategoriasFilter(tipo)

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [])

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
      <PageHeader
        title="Categorías"
        description="Clasifica cada movimiento como ingreso o gasto. Tú eliges los nombres; el tipo define en qué informes entra."
      />

      <CategoriasFilterTabs value={categoryFilter} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Listado</CardTitle>
          <Button onClick={() => handleOpenCategoryForm()} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nueva categoría
          </Button>
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
              <p className="text-xs mt-1">Crea tu primera categoría para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
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
                      <TableCell className="text-center">
                        <TableRowActions
                          actions={[
                            {
                              key: 'edit',
                              label: 'Editar',
                              icon: Pencil,
                              onClick: () => handleOpenCategoryForm(category),
                            },
                            {
                              key: 'delete',
                              label: 'Eliminar',
                              icon: Trash2,
                              destructive: true,
                              onClick: () => handleDeleteCategory(category),
                            },
                          ]}
                        />
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
