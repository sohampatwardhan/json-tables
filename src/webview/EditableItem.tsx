import { useState, useRef, useEffect } from "preact/hooks";
import type { JsonNode } from "../shared/types.ts";
import { parseInputValue } from "../shared/valueParser.ts";

export function formatScalarText(node: JsonNode): string {
  if (node.kind === "string") return `"${String(node.value)}"`;
  return String(node.value);
}

interface EditableKeyProps {
  path: string[];
  currentKey: string;
  onRenameKey: (path: string[], newKey: string) => void;
  className?: string;
}

export function EditableKey({ path, currentKey, onRenameKey, className }: EditableKeyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentKey);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(currentKey);
  }, [currentKey]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== currentKey) {
      onRenameKey(path, trimmed);
    } else {
      setDraft(currentKey);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(currentKey);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        class="inline-edit-input inline-edit-key"
        value={draft}
        onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span
      class={`key-editable ${className ?? ""}`}
      onDblClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Double click to rename key"
    >
      {currentKey}
    </span>
  );
}

interface EditableValueProps {
  node: JsonNode;
  onEditValue: (path: string[], value: any) => void;
  className?: string;
}

export function EditableValue({ node, onEditValue, className }: EditableValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => (node.value !== undefined ? String(node.value) : ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(node.value !== undefined ? String(node.value) : "");
  }, [node.value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function commit() {
    const parsed = parseInputValue(draft);
    if (parsed !== node.value) {
      onEditValue(node.path, parsed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(node.value !== undefined ? String(node.value) : "");
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        class="inline-edit-input inline-edit-val"
        value={draft}
        onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span
      class={`val-mono val-editable ${className ?? ""}`}
      data-kind={node.kind}
      onDblClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Double click to edit value"
    >
      {formatScalarText(node)}
    </span>
  );
}
