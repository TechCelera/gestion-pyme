'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wallet, Plus, Pencil, Trash2, Info, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AccountForm } from '@/components/settings/account-form'
import { ChartOfAccountsTree } from '@/components/accounts/chart-of-accounts-tree'
import { getAccounts, deleteAccount, type Account } from '@/lib/actions/accounts'
import { listChartOfAccounts, type ChartAccountRow } from '@/lib/actions/chart-of-accounts'
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants'
import { DEMO_ACCOUNTS } from '@/lib/demo-data'
import { useAuthStore } from '@/stores/auth-store'

function formatBalance(amount: number, currency: string): string {
  try {
    const locale =
      currency === 'ARS' ? 'es-AR' :
      currency === 'COP' ? 'es-CO' :
      currency === 'EUR' ? 'es-ES' :
      'en-US'
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [tab, setTab] = useState('accounts')
  const [chartRows, setChartRows] = useState<ChartAccountRow[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)
  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  const fetchAccounts = useCallback(async () => {
    if (isDemoMode) {
      setAccounts(DEMO_ACCOUNTS.map((account) => ({ ...account })))
      return
    }

    setIsLoading(true)
    try {
      const accountsResult = await getAccounts()
      if (accountsResult.success && accountsResult.data) {
        setAccounts(accountsResult.data)
      } else {
        toast.error(accountsResult.error || 'Error al cargar cuentas')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Error al cargar las cuentas')
    } finally {
      setIsLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAccounts()
    })
  }, [fetchAccounts])

  const loadChartOfAccounts = useCallback(async () => {
    if (isDemoMode) {
      setChartRows([])
      setChartError(null)
      return
    }
    setChartLoading(true)
    setChartError(null)
    try {
      const res = await listChartOfAccounts()
      if (res.success && res.data) {
        setChartRows(res.data)
      } else {
        setChartError(res.error ?? 'No se pudo cargar el plan de cuentas')
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
      setChartError('Error al cargar el plan de cuentas')
    } finally {
      setChartLoading(false)
    }
  }, [isDemoMode])

  useEffect(() => {
    if (tab === 'chart') {
      queueMicrotask(() => {
        void loadChartOfAccounts()
      })
    }
  }, [tab, loadChartOfAccounts])

  const handleOpenAccountForm = (account?: Account) => {
    setEditingAccount(account ?? null)
    setIsAccountFormOpen(true)
  }

  const handleCloseAccountForm = () => {
    setIsAccountFormOpen(false)
    setEditingAccount(null)
  }

  const handleDeleteAccount = async (account: Account) => {
    if (isDemoMode) {
      setAccounts((prev) => prev.filter((a) => a.id !== account.id))
      toast.success('Cuenta eliminada (demo)')
      return
    }

    const result = await deleteAccount(account.id)
    if (result.success) {
      toast.success('Cuenta eliminada exitosamente')
      fetchAccounts()
    } else {
      toast.error(result.error || 'Error al eliminar la cuenta')
    }
  }

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
        title="Mis cuentas"
        description="Administra tus cuentas financieras y consulta el plan de cuentas de la empresa."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="chart" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Plan de cuentas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Listado de Cuentas</CardTitle>
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
                  <TableHead className="text-center">Nombre</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Moneda</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="text-center font-medium">{account.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="mx-auto">
                        {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{account.currency}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatBalance(account.balance, account.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAccountForm(account)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          {isDemoMode ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  En modo demo no hay plan de cuentas cargado desde el servidor.
                </p>
              </CardContent>
            </Card>
          ) : chartLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chartError ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-destructive">{chartError}</p>
              </CardContent>
            </Card>
          ) : (
            <ChartOfAccountsTree rows={chartRows} />
          )}
        </TabsContent>
      </Tabs>

      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={handleCloseAccountForm}
        onSaved={fetchAccounts}
        account={editingAccount}
      />
    </div>
  )
}
