type Props = {
  entityId: string;
  isLast: boolean;
  isActive: boolean;
  isListItem?: boolean;
};

export function Indent({ entityId, isActive, isListItem }: Props) {
  function renderHorizontalIndent() {
    if (!isActive) return null;

    return (
      <span
        id={`indent-h-${entityId}`}
      />
    );
  }
  function renderVerticalIndent() {
    if (isListItem) return null;

    return (
      <span
        id={`indent-v-${entityId}`}
      />
    );
  }

  return (
    <div
      id={`indent-container-${entityId}`}
    >
      {renderVerticalIndent()}
      {renderHorizontalIndent()}
    </div>
  );
}
