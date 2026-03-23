"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Eye, EyeOff, Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import Image from "next/image";

interface Suspect {
  name: string;
  background: string;
  imageUrl?: string;
}

export interface ScenarioFormData {
  title: string;
  crimeDescription: string;
  suspects: Suspect[];
  clues: string[];
  correctCulprit: string;
  difficulty: number;
  published: boolean;
}

interface ScenarioFormProps {
  initialData?: ScenarioFormData;
  onSubmit: (data: ScenarioFormData) => Promise<void>;
  submitLabel: string;
}

export function ScenarioForm({
  initialData,
  onSubmit,
  submitLabel,
}: ScenarioFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [crimeDescription, setCrimeDescription] = useState(
    initialData?.crimeDescription ?? ""
  );
  const [suspects, setSuspects] = useState<Suspect[]>(
    initialData?.suspects ?? [{ name: "", background: "" }]
  );
  const [clues, setClues] = useState<string[]>(initialData?.clues ?? [""]);
  const [correctCulprit, setCorrectCulprit] = useState(
    initialData?.correctCulprit ?? ""
  );
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 1);
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function addSuspect() {
    setSuspects([...suspects, { name: "", background: "" }]);
  }

  function removeSuspect(index: number) {
    if (suspects.length <= 1) return;
    setSuspects(suspects.filter((_, i) => i !== index));
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function updateSuspect(index: number, field: keyof Suspect, value: string) {
    setSuspects(
      suspects.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSuspectImage(index: number) {
    setSuspects(
      suspects.map((s, i) => {
        if (i !== index) return s;
        const { imageUrl: _, ...rest } = s;
        return rest;
      })
    );
  }

  async function handleImageChange(index: number, file: File) {
    setUploadingIndex(index);
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Upload failed");
      }
      setSuspects((prev) =>
        prev.map((s, i) =>
          i === index ? { name: s.name, background: s.background, imageUrl: json.url! } : s
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadErrors((prev) => ({ ...prev, [index]: msg }));
    } finally {
      setUploadingIndex(null);
    }
  }

  function addClue() {
    setClues([...clues, ""]);
  }

  function removeClue(index: number) {
    if (clues.length <= 1) return;
    setClues(clues.filter((_, i) => i !== index));
  }

  function updateClue(index: number, value: string) {
    setClues(clues.map((c, i) => (i === index ? value : c)));
  }

  function validate(): string | null {
    if (!title.trim()) return "Title is required";
    if (!crimeDescription.replace(/<[^>]+>/g, "").trim())
      return "Crime description is required";
    if (suspects.some((s) => !s.name.trim() || !s.background.trim())) {
      return "All suspects must have a name and background";
    }
    if (clues.some((c) => !c.trim())) {
      return "All clues must be filled in";
    }
    if (!correctCulprit.trim()) return "Correct culprit is required";
    if (!suspects.some((s) => s.name.trim() === correctCulprit.trim())) {
      return "Correct culprit must match one of the suspect names";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        crimeDescription: crimeDescription.trim(),
        suspects: suspects.map((s) => ({
          name: s.name.trim(),
          background: s.background.trim(),
          ...(s.imageUrl ? { imageUrl: s.imageUrl } : {}),
        })),
        clues: clues.map((c) => c.trim()),
        correctCulprit: correctCulprit.trim(),
        difficulty,
        published,
      });
      router.push("/teacher/scenarios");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Preview (Student View)</h2>
          <Button variant="outline" onClick={() => setPreview(false)}>
            <EyeOff className="mr-2 h-4 w-4" />
            Exit Preview
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title || "Untitled Scenario"}</CardTitle>
            <CardDescription>
              Difficulty:{" "}
              {"*".repeat(difficulty)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Crime Description</h3>
              {crimeDescription.replace(/<[^>]+>/g, "").trim() ? (
                <div
                  className="text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: crimeDescription }}
                />
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Suspects</h3>
              <ul className="space-y-2">
                {suspects.map((s, i) => (
                  <li key={i} className="p-3 border rounded-lg flex gap-3 items-start">
                    <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {s.imageUrl ? (
                        <Image
                          src={s.imageUrl}
                          alt={s.name || "Suspect"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">
                        {s.name || "Unnamed"}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.background || "No background."}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Clues</h3>
              <ol className="list-decimal list-inside space-y-1">
                {clues.map((c, i) => (
                  <li key={i} className="text-muted-foreground">
                    {c || "Empty clue"}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="container mx-auto p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{submitLabel}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The Mystery of the Missing Diamond"
            required
          />
        </div>

        {/* Crime Description */}
        <div className="space-y-2">
          <Label>Crime Description</Label>
          <RichTextEditor
            value={crimeDescription}
            onChange={setCrimeDescription}
            placeholder="Describe the crime scene and events..."
            minRows={4}
          />
        </div>

        {/* Suspects */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Suspects</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSuspect}>
              <Plus className="mr-1 h-3 w-3" />
              Add Suspect
            </Button>
          </div>
          {suspects.map((suspect, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Suspect {index + 1}
                  </span>
                  {suspects.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSuspect(index)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Image upload */}
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded overflow-hidden border bg-muted flex items-center justify-center">
                      {suspect.imageUrl ? (
                        <Image
                          src={suspect.imageUrl}
                          alt={suspect.name || "Suspect"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingIndex === index}
                        onClick={() => fileInputRefs.current[index]?.click()}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {uploadingIndex === index
                          ? "Uploading…"
                          : suspect.imageUrl
                          ? "Replace"
                          : "Upload Photo"}
                      </Button>
                      {suspect.imageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSuspectImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP or GIF · max 5 MB · 1:1 recommended
                    </p>
                    {uploadErrors[index] && (
                      <p className="text-xs text-destructive">{uploadErrors[index]}</p>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageChange(index, file);
                    e.target.value = "";
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor={`suspect-name-${index}`}>Name</Label>
                  <Input
                    id={`suspect-name-${index}`}
                    value={suspect.name}
                    onChange={(e) =>
                      updateSuspect(index, "name", e.target.value)
                    }
                    placeholder="Suspect name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`suspect-bg-${index}`}>Background</Label>
                  <Textarea
                    id={`suspect-bg-${index}`}
                    value={suspect.background}
                    onChange={(e) =>
                      updateSuspect(index, "background", e.target.value)
                    }
                    placeholder="Suspect background and alibi..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clues */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Clues</Label>
            <Button type="button" variant="outline" size="sm" onClick={addClue}>
              <Plus className="mr-1 h-3 w-3" />
              Add Clue
            </Button>
          </div>
          {clues.map((clue, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={clue}
                onChange={(e) => updateClue(index, e.target.value)}
                placeholder={`Clue ${index + 1}`}
              />
              {clues.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeClue(index)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Correct Culprit */}
        <div className="space-y-2">
          <Label htmlFor="correctCulprit">
            Correct Culprit (must match a suspect name)
          </Label>
          <Input
            id="correctCulprit"
            value={correctCulprit}
            onChange={(e) => setCorrectCulprit(e.target.value)}
            placeholder="Name of the actual culprit"
            required
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex gap-4">
            {[1, 2, 3].map((level) => (
              <label
                key={level}
                className={`flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-lg transition-colors ${
                  difficulty === level
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                  className="sr-only"
                />
                {"*".repeat(level)} ({level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard"})
              </label>
            ))}
          </div>
        </div>

        {/* Published */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <Label htmlFor="published">Publish immediately</Label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
