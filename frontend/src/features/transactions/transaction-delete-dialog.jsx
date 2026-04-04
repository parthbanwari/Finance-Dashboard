import { useState } from "react";

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
import { RupeeIcon } from "@/components/currency/rupee-icon";
import { getAxiosErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";

export function TransactionDeleteDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleDelete() {
    if (!transaction) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await transactionApi.deleteTransaction(transaction.id);
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setFormError(getAxiosErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete transaction</DialogTitle>
          <DialogDescription>
            This soft-deletes the row (Admin only).{" "}
            {transaction ? (
              <>
                <span className="inline-flex flex-wrap items-center gap-1 font-mono">
                  {transaction.transaction_date} · {transaction.category.name} ·
                  <RupeeIcon className="size-3.5" />
                  {formatMoney(transaction.amount)} {transaction.currency}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting || !transaction}
            onClick={() => void handleDelete()}
          >
            {submitting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
