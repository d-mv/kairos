import type { AreaDTO } from "@kairos/shared";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { Button as Btn, type ButtonProps } from "./ui/button.js";

interface CreateAreaButtonProps {
  label: string;
  navigateToArea?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function CreateAreaButton({
  label,
  navigateToArea = false,
  variant = "ghost",
  size = "default",
}: CreateAreaButtonProps) {
  const setAreas = useSetAtom(areasAtom);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateArea = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Area name is required");
      return;
    }

    setLoading(true);
    setError(null);
    const optimisticArea: AreaDTO = {
      id: createOptimisticId("area"),
      name: trimmed,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAreas((prev) => [...prev, optimisticArea]);

    try {
      const area = await api.areas.create(trimmed);
      setAreas((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticArea.id);
        if (withoutOptimistic.some((item) => item.id === area.id)) return withoutOptimistic;
        return [...withoutOptimistic, area];
      });
      setOpen(false);
      setName("");
      if (navigateToArea) navigate(`/area/${area.id}`);
    } catch (err) {
      setAreas((prev) => prev.filter((item) => item.id !== optimisticArea.id));
      setError(err instanceof Error ? err.message : "Failed to create area");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Btn type="button" onClick={() => setOpen(true)} variant={variant} size={size}>
        {label}
      </Btn>
      <Modal
        opened={open}
        onClose={() => {
          if (loading) return;
          setOpen(false);
          setError(null);
        }}
        title="Create Area"
      >
        <Stack gap="sm">
          <TextInput
            label="Area"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateArea();
              }
            }}
            placeholder="e.g. Product"
            disabled={loading}
            error={error}
            autoFocus
          />
          <Group justify="flex-end" mt="xs">
            <Button
              variant="subtle"
              onClick={() => {
                if (loading) return;
                setOpen(false);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateArea} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
