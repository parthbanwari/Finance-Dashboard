import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@tremor/react";

import { TransactionAmount } from "@/components/currency/transaction-amount";
import { cn } from "@/lib/utils";

/**
 * Recent activity as a Tremor table — borders and typography follow dark Tremor tokens + app accents.
 *
 * @param {object} props
 * @param {unknown[]} props.transactions
 * @param {boolean} [props.analyticsForbidden]
 */
export function RecentTransactionsTable({ transactions, analyticsForbidden }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border/60 bg-muted/10",
        "[&_.tremor-TableRoot]:border-0",
        "[&_table]:min-w-[40rem] [&_table]:text-sm",
        "[&_.tremor-TableHeaderCell]:bg-secondary/40 [&_.tremor-TableHeaderCell]:text-muted-foreground",
        "[&_.tremor-TableCell]:border-border/50 [&_.tremor-TableRow:hover]:bg-accent/25",
      )}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="font-medium">Date</TableHeaderCell>
            <TableHeaderCell className="font-medium">Category</TableHeaderCell>
            <TableHeaderCell className="font-medium">Type</TableHeaderCell>
            <TableHeaderCell className="font-medium">Note</TableHeaderCell>
            <TableHeaderCell className="text-right font-medium">Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-foreground/90">{t.transaction_date}</TableCell>
              <TableCell className="max-w-[10rem] truncate text-foreground/90">
                {t.category?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  size="xs"
                  color={t.type === "income" ? "emerald" : "rose"}
                  className="font-medium"
                >
                  {t.type === "income" ? "Income" : "Expense"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[14rem] truncate text-muted-foreground">
                {t.description?.trim() || "—"}
              </TableCell>
              <TableCell className="text-right">
                <TransactionAmount transaction={t} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {analyticsForbidden ? (
        <p className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
          Showing your latest transactions; summary charts need Analyst or Admin access.
        </p>
      ) : null}
    </div>
  );
}
