import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

/**
 * Themed calendar (react-day-picker v9). Requires `react-day-picker/style.css` in globals.
 *
 * @param {import("react-day-picker").DayPickerProps} props
 */
function Calendar({ className, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-2", className)}
      {...props}
    />
  );
}

export { Calendar };
