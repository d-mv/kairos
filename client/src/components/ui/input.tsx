import * as React from "react";
import { cn } from "../../lib/utils.js";

export interface InputProps extends React.InputHTMLAttributes<
  HTMLInputElement | HTMLTextAreaElement
> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "block h-[32px] w-full min-w-0 rounded-[10px] border border-input bg-transparent px-[10px] py-[4px] text-[14px] leading-[20px] transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke] duration-150 outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

const TextArea = React.forwardRef<HTMLTextAreaElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-[10px] border border-input bg-transparent px-[10px] py-[8px] text-[14px] leading-[20px] transition-[color,background-color,border-color,outline-color,text-decoration-color,fill,stroke] duration-150 outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className,
        )}
        {...props}
      />
    );
  },
);
TextArea.displayName = "TextArea";

export { Input, TextArea };
