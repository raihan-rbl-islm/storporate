"use client";

import * as React from "react";
import { useId, useRef } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ChipInputProps {
  name: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  describedById?: string;
  invalid?: boolean;
}

export function ChipInput({
  name,
  label,
  value,
  onChange,
  placeholder,
  maxItems = 20,
  describedById,
  invalid,
}: ChipInputProps) {
  const inputId = useId();
  // The visible text input is uncontrolled so that:
  //   - we never need React state to mirror it
  //   - commit logic can read the latest DOM value via `e.target.value`
  //     directly inside `onKeyDown`/`onChange`, which avoids stale-closure
  //     bugs around `fireEvent.change` → `fireEvent.keyDown` in tests.
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (value.length >= maxItems) return;
    if (
      value.some((existing) => existing.toLowerCase() === v.toLowerCase())
    )
      return;
    onChange([...value, v]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const current = e.currentTarget.value;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(current);
    } else if (e.key === "Backspace" && current === "" && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  }

  // Commit-on-space at the end. Uses the typed `onChange` handler so we
  // don't have to attach a raw DOM `oninput` listener.
  function onDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.endsWith(" ")) {
      // commit() will clear the DOM input on its own.
      commit(v);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring",
          invalid && "border-destructive",
        )}
      >
        {value.map((chip, idx) => (
          <span
            key={`${chip}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
          >
            {chip}
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => removeAt(idx)}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          name={`${name}__draft`}
          defaultValue=""
          onChange={onDraftChange}
          onKeyDown={onKeyDown}
          onBlur={(e) => commit(e.currentTarget.value)}
          placeholder={
            value.length === 0
              ? (placeholder ?? `Add ${label.toLowerCase()}…`)
              : ""
          }
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedById}
          className="min-w-[8ch] flex-1 bg-transparent text-sm outline-none"
        />
        {/* hidden serialized chips (one per chip, named `${name}[]`) */}
        {value.map((chip, idx) => (
          <input
            key={`hidden-${idx}`}
            type="hidden"
            name={`${name}[]`}
            value={chip}
          />
        ))}
      </div>
      {value.length === 0 ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid={`${name}-empty`}
        >
          No {label.toLowerCase()} added yet. Type and press Enter to add.
        </p>
      ) : null}
    </div>
  );
}

export default ChipInput;