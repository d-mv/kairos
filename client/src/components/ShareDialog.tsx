import type { ShareEntityType } from "@kairos/shared";
import { Alert, Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { useAtom } from "jotai";
import { useState } from "react";
import { shareDialogAtom } from "../atoms/shareDialog.js";
import { api } from "../lib/api.js";

const LABELS: Record<ShareEntityType, string> = {
  project: "project",
  task: "task",
  brain_folder: "brain folder",
  brain_page: "brain page",
};

export function ShareDialog() {
  const [shareTarget, setShareTarget] = useAtom(shareDialogAtom);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setShareTarget(null);
    setEmail("");
    setError(null);
    setSaving(false);
  };

  const handleShare = async () => {
    if (!shareTarget) return;

    try {
      setSaving(true);
      setError(null);
      await api.collaboration.createInvite({
        recipientEmail: email.trim(),
        entityType: shareTarget.entityType,
        entityId: shareTarget.entityId,
      });
      handleClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create invite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={shareTarget !== null} onClose={handleClose} title="Share" size="md">
      {shareTarget ? (
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            Share this {LABELS[shareTarget.entityType]}: {shareTarget.entityLabel}
          </Text>
          {error ? <Alert color="red">{error}</Alert> : null}
          <TextInput
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            label="Collaborator email"
            placeholder="name@example.com"
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => void handleShare()} loading={saving} disabled={!email.trim()}>
              Send invite
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
