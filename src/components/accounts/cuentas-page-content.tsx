'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TableRowActions } from '@/components/ui/table-row-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { PageTabs, PageTabsContent } from '@/components/ui/page-tabs'
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
import {
  listChartOfAccountsWithBalances,
  type ChartOfAccountsSnapshot,
} from '@/lib/actions/chart-of-accounts'
import type { ChartAccountWithBalance } from '@/lib/chart-of-accounts-balances'
import { cuentasTabHref, parseCuentasTab, type CuentasTabKey } from '@/lib/accounts/cuentas-tab'
import { formatCurrency } from '@/lib/format/currency'
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants'

interface CuentasPageContentProps {
  tab: string | null
}

export function CuentasPageContent({ tab: tabParam }: CuentasPageContentProps) {
  const router = useRouter()
  const tab = parseCuentasTab(tabParam)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [chartRows, setChartRows] = useState<ChartAccountWithBalance[]>([])
  const [chartCurrency, setChartCurrency] = useState('ARS')
  const [chartAsOf, setChartAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  const setTab = (next: CuentasTabKey) => {
    router.replace(cuentasTabHref(next))
  }

  const fetchAccounts = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAccounts()
    })
  }, [fetchAccounts])

  const applyChartSnapshot = useCallback((snapshot: ChartOfAccountsSnapshot) => {
    setChartRows(snapshot.rows)
    setChartCurrency(snapshot.currency)
    setChartAsOf(snapshot.asOf)
  }, [])

  const loadChartOfAccounts = useCallback(async () => {
    setChartLoading(true)
    setChartError(null)
    try {
      const res = await listChartOfAccountsWithBalances()
      if (res.success && res.data) {
        applyChartSnapshot(res.data)
      } else {
        setChartError(res.error ?? 'No se pudo cargar el plan de cuentas')
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
      setChartError('Error al cargar el plan de cuentas')
    } finally {
      setChartLoading(false)
    }
  }, [applyChartSnapshot])

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
      <PageHeader
        title="Mis cuentas"
        description="Caja y bancos para el día a día, y el plan de cuentas de la empresa (solo lectura)."
      />

      <PageTabs
        value={tab}
        onValueChange={(v) => setTab(parseCuentasTab(v))}
        tabs={[
          { value: 'accounts', label: 'Cuentas', icon: Wallet },
          { value: 'chart', label: 'Plan de cuentas', icon: BookOpen },
        ]}
      >
        <PageTabsContent value="accounts" className="space-y-4">
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
                  <p className="text-sm">Todavía no tienes cuentas</p>
                  <p className="text-xs mt-1">Agrega caja, banco u otra cuenta cuando quieras empezar</p>
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
                          {formatCurrency(account.balance, account.currency)}
                        </TableCell>
                        <TableCell className="text-center">
                          <TableRowActions
                            actions={[
                              {
                                key: 'edit',
                                label: 'Editar',
                                icon: Pencil,
                                onClick: () => handleOpenAccountForm(account),
                              },
                              {
                                key: 'delete',
                                label: 'Eliminar',
                                icon: Trash2,
                                destructive: true,
                                onClick: () => handleDeleteAccount(account),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </PageTabsContent>

        <PageTabsContent value="chart" className="space-y-4">
          {chartLoading ? (
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
            <ChartOfAccountsTree rows={chartRows} currency={chartCurrency} asOf={chartAsOf} />
          )}
        </PageTabsContent>
      </PageTabs>

      <AccountForm
        isOpen={isAccountFormOpen}
        onClose={handleCloseAccountForm}
        onSaved={fetchAccounts}
        account={editingAccount}
      />
    </div>
  )
}
