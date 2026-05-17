"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

type ToolbarAction = {
  label: string;
  icon: ReactNode;
  prefix: string;
  suffix: string;
  block?: boolean;
  placeholder?: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "Gras", icon: <Bold className="size-4" />, prefix: "**", suffix: "**" },
  { label: "Italique", icon: <Italic className="size-4" />, prefix: "*", suffix: "*" },
  { label: "Titre 2", icon: <Heading2 className="size-4" />, prefix: "## ", suffix: "", block: true },
  { label: "Titre 3", icon: <Heading3 className="size-4" />, prefix: "### ", suffix: "", block: true },
  { label: "Liste", icon: <List className="size-4" />, prefix: "- ", suffix: "", block: true },
  {
    label: "Lien",
    icon: <Link className="size-4" />,
    prefix: "[",
    suffix: "](url)",
    placeholder: "texte du lien",
  },
];

function applyMarkdownAction(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: ToolbarAction,
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);

  if (action.block) {
    const lineStart = before.lastIndexOf("\n") + 1;
    const nextNewline = after.indexOf("\n");
    const lineEndIndex =
      nextNewline === -1 ? value.length : selectionEnd + nextNewline;
    const line = value.slice(lineStart, lineEndIndex);
    const insertion =
      action.prefix + (selected || line.replace(/^[-#*\s]+/, "") || "élément");
    const newValue =
      value.slice(0, lineStart) + insertion + value.slice(lineEndIndex);
    const cursor = lineStart + insertion.length;
    return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
  }

  const inner = selected || action.placeholder || "texte";
  const insertion = action.prefix + inner + action.suffix;
  const newValue = before + insertion + after;
  const start = selectionStart + action.prefix.length;
  const end = start + inner.length;
  return { value: newValue, selectionStart: start, selectionEnd: end };
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 7,
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const runAction = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      const result = applyMarkdownAction(value, selectionStart, selectionEnd, action);
      onChange(result.value);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [onChange, value],
  );

  return (
    <div className={cn("overflow-hidden rounded-md border border-input shadow-sm", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-2 py-1">
        <div className="flex flex-wrap items-center gap-0.5">
          {TOOLBAR_ACTIONS.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              title={action.label}
              disabled={mode === "preview"}
              onClick={() => runAction(action)}
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center rounded-md border bg-background p-0.5">
          <Button
            type="button"
            variant={mode === "write" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5"
            onClick={() => setMode("write")}
          >
            <Pencil className="size-3.5" />
            Éditer
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2.5"
            onClick={() => setMode("preview")}
          >
            <Eye className="size-3.5" />
            Aperçu
          </Button>
        </div>
      </div>

      {mode === "write" ? (
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="min-h-[158px] resize-y rounded-none border-0 shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-[158px] px-3 py-2">
          {value.trim() ? (
            <MarkdownContent
              content={value}
              className="space-y-2 text-sm leading-relaxed"
            />
          ) : (
            <p className="text-sm text-muted-foreground/60">
              L&apos;aperçu Markdown apparaîtra ici.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
