"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  ScenarioForm,
  type ScenarioFormData,
} from "../../_components/scenario-form";

interface ScenarioResponse {
  id: string;
  title: string;
  crimeDescription: string;
  suspects: { name: string; background: string }[];
  clues: string[];
  correctCulprit: string;
  difficulty: number;
  published: boolean;
  freeToView: boolean;
}

export default function EditScenarioPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [scenarioData, setScenarioData] = useState<ScenarioFormData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "teacher" && role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function fetchScenario() {
      try {
        const res = await fetch(`/api/scenarios/${params.id}`);
        if (!res.ok) {
          setFetchError("Failed to load scenario");
          return;
        }
        const data = (await res.json()) as ScenarioResponse;
        setScenarioData({
          title: data.title,
          crimeDescription: data.crimeDescription,
          suspects: data.suspects,
          clues: data.clues,
          correctCulprit: data.correctCulprit,
          difficulty: data.difficulty,
          published: data.published,
          freeToView: data.freeToView ?? false,
        });
      } catch {
        setFetchError("Failed to load scenario");
      } finally {
        setLoading(false);
      }
    }

    void fetchScenario();
  }, [session, isPending, router, params.id]);

  async function handleSubmit(data: ScenarioFormData) {
    const res = await fetch(`/api/scenarios/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "Failed to update scenario");
    }
  }

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg text-destructive">
          {fetchError}
        </div>
      </div>
    );
  }

  if (!scenarioData) {
    return null;
  }

  return (
    <ScenarioForm
      initialData={scenarioData}
      onSubmit={handleSubmit}
      submitLabel="Update Scenario"
    />
  );
}
