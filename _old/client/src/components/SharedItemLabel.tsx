import { Box, Text } from "@mantine/core";
import { UserGroupIcon } from "./ui/heroicons.js";

type Props = {
  label: string;
  shared: boolean;
};

export function SharedItemLabel({ label, shared }: Props) {
  return (
    <Box
      component="span"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <Text component="span" inherit truncate>
        {label}
      </Text>
      {shared ? (
        <UserGroupIcon
          width={14}
          height={14}
          style={{ flexShrink: 0, color: "var(--mantine-color-dimmed)" }}
        />
      ) : null}
    </Box>
  );
}
