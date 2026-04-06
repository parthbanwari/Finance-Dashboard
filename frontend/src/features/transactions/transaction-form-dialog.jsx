import { useEffect, useState } from "react";
import { Info, Loader2 } from "lucide-react";

import * as transactionApi from "@/api/transactionApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RupeeIcon } from "@/components/currency/rupee-icon";
import { getAxiosErrorMessage } from "@/lib/errors";
import { APP_CURRENCY } from "@/lib/format";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeAmountInput(value) {
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  mode,
  transaction,
  categories: categoriesProp,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  /** Fresh list when modal opens (fixes empty dropdown if parent list failed to parse or was stale). */
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCategoriesError(null);
    setCategories(Array.isArray(categoriesProp) ? categoriesProp : []);
    let cancelled = false;
    setCategoriesLoading(true);
    (async () => {
      try {
        const list = await transactionApi.listAllCategories();
        if (cancelled) return;
        setCategories(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setCategoriesError(getAxiosErrorMessage(e));
          setCategories([]);
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, categoriesProp]);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (mode === "edit" && transaction) {
      setAmount(transaction.amount);
      setType(transaction.type);
      setCategoryId(String(transaction.category.id));
      setTransactionDate(transaction.transaction_date);
      setDescription(transaction.description ?? "");
      return;
    }
    if (mode === "create") {
      setAmount("");
      setType("expense");
      setCategoryId("");
      setTransactionDate(todayIsoDate());
      setDescription("");
    }
  }, [open, mode, transaction]);

  /** When categories load after open, default selection for create mode */
  useEffect(() => {
    if (!open || mode !== "create" || categoriesLoading) return;
    if (categories.length && !categoryId) {
      setCategoryId(String(categories[0].id));
    }
  }, [open, mode, categories, categoriesLoading, categoryId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const amt = amount.trim();
    if (!amt || Number.parseFloat(amt) <= 0) {
      setFormError("Enter a positive amount.");
      return;
    }
    const cat = categoryId.trim();
    if (!cat) {
      setFormError("Select a category.");
      return;
    }
    const payload = {
      amount: amt,
      currency: APP_CURRENCY,
      type,
      category_id: cat,
      transaction_date: transactionDate,
      description: description.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        await transactionApi.createTransaction(payload);
      } else if (transaction) {
        await transactionApi.patchTransaction(transaction.id, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setFormError(getAxiosErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const noCategories = !categoriesLoading && categories.length === 0;
  const amountKeyAllowed = (key) =>
    /^[0-9]$/.test(key) ||
    [".", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(key);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New transaction" : "Edit transaction"}</DialogTitle>
          <DialogDescription>
            Amounts are positive magnitudes; type determines income vs expense.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {categoriesLoading ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Loading categories…
            </div>
          ) : null}

          {categoriesError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {categoriesError}
            </p>
          ) : null}

          {mode === "create" && !categoriesLoading && noCategories && !categoriesError ? (
            <div
              className="flex gap-3 rounded-lg border border-border bg-muted/50 px-3 py-3 text-sm leading-snug text-foreground shadow-sm"
              role="status"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-medium text-foreground">No categories yet</p>
                <p className="mt-1 text-muted-foreground">
                  Add at least one category on the Transactions page first (Analyst or Admin), then open this
                  form again.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="tx-amount" className="inline-flex items-center gap-1.5">
              <RupeeIcon className="size-3.5" />
              Amount (Rs)
            </Label>
            <Input
              id="tx-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (!amountKeyAllowed(e.key)) {
                  e.preventDefault();
                  return;
                }
                if (e.key === "." && amount.includes(".")) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData?.getData("text") ?? "";
                const input = e.currentTarget;
                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? input.value.length;
                const nextRaw = `${amount.slice(0, start)}${pasted}${amount.slice(end)}`;
                setAmount(sanitizeAmountInput(nextRaw));
              }}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-type">Type</Label>
            <select
              id="tx-type"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-category">Category</Label>
            <select
              id="tx-category"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={categoriesLoading || noCategories}
            >
              <option value="">{categoriesLoading ? "Loading…" : "Select…"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Description</Label>
            <Input
              id="tx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || categoriesLoading || noCategories}>
              {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
