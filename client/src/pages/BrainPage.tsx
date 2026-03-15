import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brainPagesAtom } from "../atoms/brain.js";
import { pageMenuAtom } from "../atoms/pageMenu.atom.js";
import { api } from "../lib/api.js";
import {
  createBrainDocument,
  getBrainDocument,
  getBrainDocumentHtml,
} from "../lib/brain-content.js";
import { getBrainEditorShortcut } from "../lib/brain-editor.js";
import classes from "./BrainPage.module.css";

type EditorMode = "rich" | "json";

type FormatAction = {
  label: string;
  command: string;
  value?: string;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { label: "B", command: "bold" },
  { label: "I", command: "italic" },
  { label: "H1", command: "formatBlock", value: "<h1>" },
  { label: "H2", command: "formatBlock", value: "<h2>" },
  { label: "• List", command: "insertUnorderedList" },
];

export default function BrainPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pages = useAtomValue(brainPagesAtom);
  const setPages = useSetAtom(brainPagesAtom);
  const setPageMenu = useSetAtom(pageMenuAtom);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const page = pages.find((item) => item.id === id) ?? null;
  const [title, setTitle] = useState("");
  const [richHtml, setRichHtml] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("rich");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) return;
    const document = getBrainDocument(page.contentJson);
    setTitle(page.title);
    setRichHtml(getBrainDocumentHtml(document));
    setRawJson(JSON.stringify(document, null, 2));
    setEditorMode("rich");
    setIsEditingTitle(false);
    setError(null);
  }, [page?.id]);

  useEffect(() => {
    if (editorMode !== "rich" || !editorRef.current) return;
    if (editorRef.current.innerHTML !== richHtml) {
      editorRef.current.innerHTML = richHtml;
    }
  }, [editorMode, richHtml]);

  useEffect(() => {
    if (!isEditingTitle) return;
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!page) {
      setPageMenu([]);
      return;
    }

    const toggleMode = () => {
      if (editorMode === "rich") {
        setRawJson(JSON.stringify(createBrainDocument(richHtml), null, 2));
        setEditorMode("json");
        setError(null);
        return;
      }

      try {
        const parsed = JSON.parse(rawJson);
        const document = getBrainDocument(parsed);
        setRawJson(JSON.stringify(document, null, 2));
        setRichHtml(getBrainDocumentHtml(document));
        setEditorMode("rich");
        setError(null);
      } catch {
        setError("Content must be valid JSON before leaving raw mode");
      }
    };

    const deletePage = async () => {
      if (!window.confirm("Delete this page?")) return;

      try {
        await api.brain.deletePage(page.id);
        setPages((prev) => prev.filter((item) => item.id !== page.id));
        navigate("/inbox");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete page");
      }
    };

    setPageMenu([
      {
        label: editorMode === "rich" ? "Edit Raw JSON" : "Back to Editor",
        onClick: toggleMode,
      },
      {
        label: "Delete Page",
        onClick: () => void deletePage(),
      },
    ]);

    return () => setPageMenu([]);
  }, [editorMode, navigate, page, rawJson, richHtml, setPageMenu, setPages]);

  if (!page) {
    return (
      <Box p="md">
        <Text c="dimmed">Page not found.</Text>
      </Box>
    );
  }

  const handleSave = async () => {
    let contentJson: unknown;
    if (editorMode === "json") {
      try {
        contentJson = JSON.parse(rawJson);
      } catch {
        setError("Content must be valid JSON");
        return;
      }
    } else {
      const nextRichHtml = editorRef.current?.innerHTML ?? richHtml;
      setRichHtml(nextRichHtml);
      contentJson = createBrainDocument(nextRichHtml);
      setRawJson(JSON.stringify(contentJson, null, 2));
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await api.brain.updatePage(page.id, {
        title: title.trim() || "Untitled",
        contentJson,
      });
      setPages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = (action: FormatAction) => {
    editorRef.current?.focus();
    document.execCommand(action.command, false, action.value);
    setRichHtml(editorRef.current?.innerHTML ?? "");
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const shortcut = getBrainEditorShortcut(event);
    if (!shortcut) return;

    event.preventDefault();

    if (shortcut === "save") {
      void handleSave();
      return;
    }

    if (shortcut === "bold") {
      handleFormat({ label: "B", command: "bold" });
      return;
    }

    if (shortcut === "italic") {
      handleFormat({ label: "I", command: "italic" });
      return;
    }

    if (shortcut === "heading-1") {
      handleFormat({ label: "H1", command: "formatBlock", value: "<h1>" });
      return;
    }

    if (shortcut === "heading-2") {
      handleFormat({ label: "H2", command: "formatBlock", value: "<h2>" });
    }
  };

  return (
    <Stack p="md" gap="md" h="100%" style={{ overflow: "auto", paddingRight: "3.5rem" }}>
      <Stack gap={4}>
        {isEditingTitle ? (
          <TextInput
            ref={titleInputRef}
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setIsEditingTitle(false);
              if (event.key === "Escape") {
                setTitle(page.title);
                setIsEditingTitle(false);
              }
            }}
            size="lg"
            variant="unstyled"
            styles={{ input: { fontSize: "2rem", fontWeight: 700, padding: 0, lineHeight: 1.2 } }}
          />
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => setIsEditingTitle(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "text",
              padding: 0,
              textAlign: "left",
            }}
          >
            <Title order={1}>{title || "Untitled"}</Title>
          </Box>
        )}
        <Text size="sm" c="dimmed">
          Click the title to rename the page.
        </Text>
      </Stack>

      {editorMode === "rich" ? (
        <>
          <Group gap="xs">
            {FORMAT_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="light"
                size="compact-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleFormat(action)}
              >
                {action.label}
              </Button>
            ))}
            <Button variant="filled" onClick={() => void handleSave()} loading={saving}>
              Save
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            Shortcuts: Ctrl/Cmd+B bold, Ctrl/Cmd+I italic, Ctrl/Cmd+Alt+1 heading, Ctrl/Cmd+S save.
          </Text>
          <Box
            ref={editorRef}
            component="div"
            contentEditable
            suppressContentEditableWarning
            className={classes["editor"]}
            data-placeholder="Start writing..."
            onInput={(event) => setRichHtml(event.currentTarget.innerHTML)}
            onKeyDown={handleEditorKeyDown}
          />
        </>
      ) : (
        <>
          <Group gap="xs">
            <Button variant="filled" onClick={() => void handleSave()} loading={saving}>
              Save
            </Button>
          </Group>
          <Box
            component="textarea"
            value={rawJson}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setRawJson(event.currentTarget.value)
            }
            className={classes["rawEditor"]}
          />
        </>
      )}

      {error ? <Text c="red">{error}</Text> : null}
    </Stack>
  );
}
