import { useState } from "react";

import * as transactionApi from "@/api/transactionApi";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/feedback/api-state";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionDeleteDialog } from "@/features/transactions/transaction-delete-dialog";
import { TransactionFormDialog } from "@/features/transactions/transaction-form-dialog";
import { RupeeIcon } from "@/components/currency/rupee-icon";
import { TransactionAmount } from "@/components/currency/transaction-amount";
import { cn } from "@/lib/utils";
import { getAxiosErrorMessage } from "@/lib/errors";

export function TransactionsPage() {
  const { user } = useAuth();
  const { refetch: refetchDashboard } = useDashboardData();
  const {
    data,
    loading,
    error,
    page,
    setPage,
    filters,
    setFilters,
    clearFilters,
    refetch,
  } = useTransactions(1, 25);
  const {
    categories,
    loading: catLoading,
    error: catError,
    refetch: refetchCategories,
  } = useCategories();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const canWrite = user?.role === "analyst" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  function onMutationSuccess() {
    void refetch();
    void refetchDashboard();
    void refetchCategories();
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryFormError("Enter a category name.");
      return;
    }
    setCategorySaving(true);
    setCategoryFormError(null);
    try {
      await transactionApi.createCategory({ name });
      setNewCategoryName("");
      await refetchCategories();
      void refetchDashboard();
    } catch (err) {
      setCategoryFormError(getAxiosErrorMessage(err));
    } finally {
      setCategorySaving(false);
    }
  }

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t) {
    setFormMode("edit");
    setEditing(t);
    setFormOpen(true);
  }

  function openDelete(t) {
    setDeleting(t);
    setDeleteOpen(true);
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / 25))
    : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Transactions</h2>
          <p className="text-muted-foreground">
            List, filter, and manage your transactions in one place.
          </p>
        </div>
        {canWrite ? (
          <Button
            type="button"
            onClick={openCreate}
            disabled={catLoading}
            title={
              !catLoading && categories.length === 0
                ? "Open form to add a transaction — you need at least one category first."
                : undefined
            }
          >
            New transaction
          </Button>
        ) : null}
      </div>

      {catError ? (
        <p className="text-sm text-destructive">Categories: {catError}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
          <CardDescription>
            Labels used for transactions and filters. Each name must be unique for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {catLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : null}
          {!catLoading && categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet — add one below (Analyst/Admin).</p>
          ) : null}
          {categories.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm text-foreground"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          ) : null}
          {canWrite ? (
            <form onSubmit={handleAddCategory} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="new-category-name">New category</Label>
                <Input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    setCategoryFormError(null);
                  }}
                  placeholder="e.g. Groceries, Salary"
                  maxLength={64}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={categorySaving || catLoading}>
                {categorySaving ? "Adding…" : "Add category"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your role can use categories in filters; only Analyst or Admin can add new ones.
            </p>
          )}
          {categoryFormError ? (
            <p className="text-sm text-destructive" role="alert">
              {categoryFormError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Narrow the list by date range, category, or whether the entry is income or expense.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="f-from">From</Label>
            <Input
              id="f-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-to">To</Label>
            <Input
              id="f-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-cat">Category</Label>
            <select
              id="f-cat"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={filters.categoryId}
              onChange={(e) => setFilters({ categoryId: e.target.value })}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-type">Type</Label>
            <select
              id="f-type"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value })}
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorBlock message={error} /> : null}

      {loading ? <LoadingBlock label="Loading transactions…" /> : null}

      {!loading && !error && data ? (
        <>
          {data.results.length === 0 ? (
            <EmptyBlock title="No transactions" description="Adjust filters or create a transaction." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <RupeeIcon className="size-3.5" />
                        Amount
                      </span>
                    </th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    {(canWrite || canDelete) && (
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((t) => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {t.transaction_date}
                      </td>
                      <td className="px-3 py-2">{t.category.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-medium",
                            t.type === "income"
                              ? "bg-primary/15 text-primary"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <TransactionAmount transaction={t} />
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                        {t.description || "—"}
                      </td>
                      {(canWrite || canDelete) && (
                        <td className="space-x-2 px-3 py-2 text-right">
                          {canWrite ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(t)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDelete(t)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.results.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {data.count} total
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        transaction={editing}
        categories={categories}
        onSuccess={onMutationSuccess}
      />

      <TransactionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        transaction={deleting}
        onSuccess={onMutationSuccess}
      />
    </div>
  );
}
