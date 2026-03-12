import { EntityType } from "@kairos/shared";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useAtom } from "jotai";
import { renameEntityAtom } from "../atoms/renameEntity.atom.js";

type Props = {
  onRename: (name: string, entityId: string, type: EntityType) => Promise<void>;
};

export function RenameEntityDialog({ onRename }: Props) {
  const [renameEntityState, setRenameEntityState] = useAtom(renameEntityAtom);

  if (!renameEntityState) return null;

  const { entityLabel, loading, entityId, currentName, type, errorMessage } = renameEntityState;

  const setError = (v: string | null) => setRenameEntityState((s) => ({ ...s!, errorMessage: v }));
  const setName = (v: string) => setRenameEntityState((s) => ({ ...s!, currentName: v }));
  const cancelDialog = () => setRenameEntityState(null);

  function handleRename() {
    const trimmed = currentName.trim();
    if (!trimmed) {
      setError(`${entityLabel} name is required`);
      return;
    }
    onRename(trimmed, entityId, type).then(cancelDialog, (err: unknown) =>
      setError(err instanceof Error ? err.message : `Failed to rename ${entityLabel.toLowerCase()}`),
    );
  }

  return (
    <Modal
      opened={true}
      onClose={() => {
        if (loading) return;
        cancelDialog();
      }}
      title={`Rename ${entityLabel}`}
      size="sm"
    >
      <Stack gap="sm">
        <TextInput
          label={entityLabel}
          placeholder="Type here"
          value={currentName}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleRename();
            }
          }}
          disabled={Boolean(loading)}
          error={errorMessage}
          autoFocus
        />
        <Group justify="flex-end" mt="xs">
          <Button
            variant="subtle"
            onClick={() => {
              if (loading) return;
              cancelDialog();
            }}
          >
            Cancel
          </Button>
          <Button disabled={Boolean(loading)} onClick={handleRename}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
