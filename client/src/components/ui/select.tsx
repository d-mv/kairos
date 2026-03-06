import * as React from "react";
import { cn } from "../../lib/utils.js";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-[32px] w-full rounded-[10px] border border-input bg-transparent px-[10px] py-[4px] text-[14px] leading-[20px] transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke] duration-150 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
});
Select.displayName = "Select";

export { Select };
