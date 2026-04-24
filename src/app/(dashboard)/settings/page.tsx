'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Wallet, Tag, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAccounts, deleteAccount } from '@/lib/actions/accounts'
import { getCategories, deleteCategory } from '@/lib/actions/categories'
import { ACCOUNT_TYPE_LABELS, CATEGORY_TYPE_LABELS } from '@/lib/constants'
import { CATEGORY_TYPES } from '@/lib/constants'
import { DEMO_ACCOUNTS, DEMO_CATEGORIES } from '@/lib/demo-data'
import { useAuthStore } from '@/stores/auth-store'
import { AccountForm } from '@/components/settings/account-form'
import { CategoryForm } from '@/components/settings/category-form'

import type { Account } from '@/lib/actions/accounts'
import type { Category } from '@/lib/actions/categories'

// Currency formatter
function formatBalance(amount: number, currency: string): string {
  try {
    const locale = currency === 'COP' ? 'es-CO' : currency === 'EUR' ? 'es-ES' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'COP' ? 0 : 2,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

export default function SettingsPage() {
  // State
  const [activeTab, setActiveTab] = useState<'accounts' | 'categories'>('accounts')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Account form state
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  // Category form state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Category type filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  // Fetch data
  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      setAccounts(DEMO_ACCOUNTS.map(a => ({ ...a })))
      setCategories(DEMO_CATEGORIES.map(c => ({ ...c })))
      return
    }

    setIsLoading(true)
    try {
      const [accountsResult, categoriesResult] = await Promise.all([
        getAccounts(),
        getCategories(),
      ])

      if (accountsResult.success && accountsResult.data) {
        setAccounts(accountsResult.data)
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (error) {
      console.error('Error fetching settings data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Account handlers
  const handleOpenAccountForm = (account?: Account) => {
    setEditingAccount(account ?? null)
    setIsAccountFormOpen(true)
  }

  const handleCloseAccountForm = () => {
    setIsAccountFormOpen(false)
    setEditingAccount(null)
  }

  const handleAccountSaved = () => {
    fetchData()
  }

  const handleDeleteAccount = async (account: Account) => {
    if (isDemoMode) {
      setAccounts(prev => prev.filter(a => a.id !== account.id))
      toast.success('Cuenta eliminada (demo)')
      return
    }

    const result = await deleteAccount(account.id)
    if (result.success) {
      toast.success('Cuenta eliminada exitosamente')
      fetchData()
    } else {
      toast.error(result.error || 'Error al eliminar la cuenta')
    }
  }

  // Category handlers
  const handleOpenCategoryForm = (category?: Category) => {
    setEditingCategory(category ?? null)
    setIsCategoryFormOpen(true)
  }

  const handleCloseCategoryForm = () => {
    setIsCategoryFormOpen(false)
    setEditingCategory(null)
  }

  const handleCategorySaved = () => {
    fetchData()
  }

  const handleDeleteCategory = async (category: Category) => {
    if (isDemoMode) {
      setCategories(prev => prev.filter(c => c.id !== category.id))
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

  // Determine income vs expense types for filter
  const incomeTypes: string[] = [CATEGORY_TYPES.INCOME]
  const expenseTypes: string[] = [
    CATEGORY_TYPES.COST,
    CATEGORY_TYPES.ADMIN_EXPENSE,
    CATEGORY_TYPES.COMMERCIAL_EXPENSE,
    CATEGORY_TYPES.FINANCIAL_EXPENSE,
  ]

  // Filter categories
  const filteredCategories = categoryFilter === 'all'
    ? categories
    : categoryFilter === 'income'
      ? categories.filter(c => incomeTypes.includes(c.type))
      : categoryFilter === 'expense'
        ? categories.filter(c => expenseTypes.includes(c.type))
        : categories.filter(c => c.type === categoryFilter)

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Demo mode banner */}
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Administra las cuentas y categorías de tu empresa
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'accounts' | 'categories')}>
        <TabsList>
          <TabsTrigger value="accounts">
            <Wallet className="mr-2 h-4 w-4" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="mr-2 h-4 w-4" />
            Categorías
          </TabsTrigger>
        </TabsList>

        {/* ==================== ACCOUNTS TAB ==================== */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Cuentas</CardTitle>
              <Button
                onClick={() => handleOpenAccountForm()}
                size="sm"
                className="bg-[#7B68EE] hover:bg-[#7B68EE]/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Nueva Cuenta
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No hay cuentas registradas</p>
                  <p className="text-xs mt-1">Crea tu primera cuenta para comenzar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{account.currency}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatBalance(account.balance, account.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-sm" />
                              }
                            >
                              ···
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenAccountForm(account)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteAccount(account)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CATEGORIES TAB ==================== */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Categorías</CardTitle>
              <div className="flex items-center gap-2">
                {/* Filter buttons */}
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
                      // Filter for all expense types
                      if (categoryFilter === 'expense') {
                        setCategoryFilter('all')
                      } else {
                        setCategoryFilter('expense')
                      }
                    }}
                    className={categoryFilter === 'expense' ? 'bg-[#7B68EE] hover:bg-[#7B68EE]/90 text-primary-foreground' : ''}
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
                  Nueva Categoría
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
                  <p className="text-xs mt-1">Crea tu primera categoría para comenzar</p>
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
                      const isIncome = (incomeTypes as string[]).includes(category.type)
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
                              {CATEGORY_TYPE_LABELS[category.type] || category.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm" />
                                }
                              >
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
        </TabsContent>
      </Tabs>

      {/* Account Form Sheet */}
      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={handleCloseAccountForm}
        onSaved={handleAccountSaved}
        account={editingAccount}
      />

      {/* Category Form Sheet */}
      <CategoryForm
        isOpen={isCategoryFormOpen}
        onClose={handleCloseCategoryForm}
        onSaved={handleCategorySaved}
        category={editingCategory}
      />
    </div>
  )
}
