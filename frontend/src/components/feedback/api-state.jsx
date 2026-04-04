import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div
      className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-8"
      role="status"
      aria-live="polite"
    >
      <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message }) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-destructive">Something went wrong</CardTitle>
        <CardDescription className="text-destructive/90">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function EmptyBlock({ title, description, children }) {
  return (
    <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
