"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  ScenarioForm,
  type ScenarioFormData,
} from "../_components/scenario-form";

export default function NewScenarioPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "teacher" && role !== "admin") {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  async function handleSubmit(data: ScenarioFormData) {
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error ?? "Failed to create scenario");
    }
  }

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return <ScenarioForm onSubmit={handleSubmit} submitLabel="Create Scenario" />;
}
