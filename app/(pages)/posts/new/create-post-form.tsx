"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/onboarding/chip-input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import {
  createPost,
  type PostFormState,
} from "@/app/(pages)/posts/actions";

export interface CreatePostFormProps {
  initialValue?: {
    kind: "journal" | "news";
    title: string;
    body: string;
    tags: string[];
  };
  /** When provided, the form submits via updatePost(postId, …). */
  postId?: string;
  submitLabel?: string;
  /** "create" = creates and redirects on success; "edit" = stays on page. */
  mode?: "create" | "edit";
}

const INITIAL: PostFormState = { status: "idle" };

export function CreatePostForm({
  initialValue,
  postId,
  submitLabel,
  mode = "create",
}: CreatePostFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initialValue?.tags ?? []);
  const [kind, setKind] = useState<"journal" | "news">(
    initialValue?.kind ?? "journal",
  );

  const [state, formAction] = useActionState<PostFormState, FormData>(
    async (prev, fd) => {
      if (mode === "edit" && postId) {
        const { updatePost } = await import("@/app/(pages)/posts/actions");
        return updatePost(postId, prev, fd);
      }
      return createPost(prev, fd);
    },
    INITIAL,
  );

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") {
      errorBannerRef.current?.focus();
    } else if (state.status === "success" && mode === "edit") {
      router.refresh();
    }
  }, [state, mode, router]);

  const errors =
    state.status === "error" ? state.fieldErrors : ({} as Record<string, string>);
  const kindError = errors.kind;
  const titleError = errors.title;
  const bodyError = errors.body;
  const tagsError = errors.tags;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Publish a new post" : "Edit post"}
        </CardTitle>
      </CardHeader>
      <form action={formAction} noValidate>
        <CardContent className="grid gap-5">
          {state.status === "error" && state.formMessage ? (
            <div
              ref={errorBannerRef}
              role="alert"
              tabIndex={-1}
              className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            >
              {state.formMessage}
            </div>
          ) : null}
          {state.status === "success" && mode === "edit" ? (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            >
              {state.message}
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label>Kind</Label>
            <RadioGroup
              value={kind}
              onValueChange={(v) => setKind(v === "news" ? "news" : "journal")}
              aria-invalid={kindError ? true : undefined}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="journal" id="kind-journal" />
                <Label htmlFor="kind-journal" className="font-normal">
                  Journal — long-form, reflective writing
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="news" id="kind-news" />
                <Label htmlFor="kind-news" className="font-normal">
                  News — short announcement or update
                </Label>
              </div>
            </RadioGroup>
            {/* Hidden input ensures the form submits even if the user never
                touched the radio (e.g. tabbed past it). */}
            <input type="hidden" name="kind" value={kind} />
            {kindError ? (
              <p className="text-xs text-destructive">{kindError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialValue?.title ?? ""}
              required
              minLength={3}
              aria-invalid={titleError ? true : undefined}
            />
            {titleError ? (
              <p className="text-xs text-destructive">{titleError}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={initialValue?.body ?? ""}
              rows={10}
              aria-invalid={bodyError ? true : undefined}
              placeholder="Share your story, update, or announcement. Plain text — line breaks are preserved."
            />
            {bodyError ? (
              <p className="text-xs text-destructive">{bodyError}</p>
            ) : null}
          </div>
          <ChipInput
            name="tags"
            label="Tags"
            value={tags}
            onChange={setTags}
            placeholder="Add a tag and press Enter"
            invalid={Boolean(tagsError)}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit">
            {submitLabel ?? (mode === "create" ? "Publish post" : "Save changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}