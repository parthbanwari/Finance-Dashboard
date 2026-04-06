import { Calendar as CalendarIcon } from "lucide-react";
import { startOfDay } from "date-fns";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatYmdDisplay, parseYmd, formatYmd } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} props.value YYYY-MM-DD or ""
 * @param {(next: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 * @param {Date} [props.minDate] inclusive
 * @param {Date} [props.maxDate] inclusive
 * @param {string} [props.className]
 */
export function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const selected = parseYmd(value);
  const display = formatYmdDisplay(value);

  const commitDraft = React.useCallback(() => {
    const raw = String(draft).trim();
    if (raw === "") {
      onChange("");
      return;
    }
    const d = parseYmd(raw);
    if (!d) {
      setDraft(value);
      return;
    }
    let next = d;
    const minD = minDate ? startOfDay(minDate) : null;
    const maxD = maxDate ? startOfDay(maxDate) : null;
    if (minD && next < minD) next = minD;
    if (maxD && next > maxD) next = maxD;
    onChange(formatYmd(next));
    setDraft(formatYmd(next));
  }, [draft, value, onChange, minDate, maxDate]);

  const disabledDays = React.useCallback(
    (date) => {
      const d = startOfDay(date);
      if (minDate && d < startOfDay(minDate)) return true;
      if (maxDate && d > startOfDay(maxDate)) return true;
      return false;
    },
    [minDate, maxDate],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-foreground">
        {label}
      </Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={`${id}-trigger`}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-start gap-2 border-input bg-background text-left font-normal shadow-sm",
                "hover:bg-accent/80 hover:text-accent-foreground",
                !display && "text-muted-foreground",
              )}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <CalendarIcon className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{display || "Pick a date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-border p-0 shadow-xl" align="start">
            <Calendar
              mode="single"
              required={false}
              selected={selected}
              onSelect={(d) => {
                if (d) {
                  const minD = minDate ? startOfDay(minDate) : null;
                  const maxD = maxDate ? startOfDay(maxDate) : null;
                  let next = d;
                  if (minD && next < minD) next = minD;
                  if (maxD && next > maxD) next = maxD;
                  onChange(formatYmd(next));
                }
                setOpen(false);
              }}
              disabled={disabledDays}
              defaultMonth={selected ?? new Date()}
            />
          </PopoverContent>
        </Popover>

        <div className="relative flex min-w-0 flex-1">
          <Input
            id={id}
            type="text"
            inputMode="text"
            placeholder="YYYY-MM-DD"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commitDraft()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
            }}
            className="font-mono text-sm tabular-nums placeholder:text-muted-foreground/70"
            aria-label={`${label} (type date)`}
          />
        </div>
      </div>
    </div>
  );
}
