"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minRows = 4,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set initial value on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. loading initial data) without resetting cursor
  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execFormat = (command: string) => {
    editorRef.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(command, false);
    handleInput();
  };

  return (
    <div className="rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0">
      {/* Toolbar */}
      <div className="flex gap-1 border-b border-input bg-muted/40 px-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 font-bold text-sm"
          onClick={() => execFormat("bold")}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execFormat("underline")}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[6rem] px-3 py-2 text-sm outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
        style={{ minHeight: `${minRows * 1.5}rem` }}
      />
    </div>
  );
}
