import { ActionIcon, Button as MantineButton } from "@mantine/core";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

function toMantineVariant(variant: ButtonProps["variant"]) {
  switch (variant) {
    case "outline":
      return "outline" as const;
    case "ghost":
      return "subtle" as const;
    case "destructive":
      return "filled" as const;
    default:
      return "filled" as const;
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", children, ...props }, ref) => {
    if (size === "icon") {
      return (
        <ActionIcon
          ref={ref}
          variant={toMantineVariant(variant)}
          size="md"
          color={variant === "destructive" ? "red" : undefined}
          {...(props as React.ComponentPropsWithoutRef<"button">)}
        >
          {children}
        </ActionIcon>
      );
    }

    const mantineSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "sm";

    return (
      <MantineButton
        ref={ref}
        variant={toMantineVariant(variant)}
        size={mantineSize}
        color={variant === "destructive" ? "red" : undefined}
        {...props}
      >
        {children}
      </MantineButton>
    );
  },
);

Button.displayName = "Button";

export { Button };
