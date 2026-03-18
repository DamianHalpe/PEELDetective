"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

interface Scenario {
  id: string;
  title: string;
  crimeDescription: string;
  difficulty: number;
  published: boolean;
  createdAt: string;
}

export default function TeacherScenariosPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch("/api/scenarios");
      if (res.ok) {
        const data = (await res.json()) as Scenario[];
        setScenarios(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
    void fetchScenarios();
  }, [session, isPending, router, fetchScenarios]);

  async function togglePublish(id: string, currentlyPublished: boolean) {
    const res = await fetch(`/api/scenarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !currentlyPublished }),
    });
    if (res.ok) {
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, published: !currentlyPublished } : s
        )
      );
    }
  }

  async function deleteScenario(id: string) {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
    if (res.ok) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function renderDifficultyStars(difficulty: number) {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < difficulty
            ? "fill-yellow-500 text-yellow-500"
            : "text-muted-foreground"
        }`}
      />
    ));
  }

  if (isPending || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scenario Management</h1>
        <Button asChild>
          <Link href="/teacher/scenarios/new">
            <Plus className="mr-2 h-4 w-4" />
            New Scenario
          </Link>
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No scenarios yet. Create your first one.
            </p>
            <Button asChild>
              <Link href="/teacher/scenarios/new">Create Scenario</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  <Badge
                    variant={scenario.published ? "default" : "secondary"}
                  >
                    {scenario.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {renderDifficultyStars(scenario.difficulty)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {scenario.crimeDescription}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      togglePublish(scenario.id, scenario.published)
                    }
                  >
                    {scenario.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/teacher/scenarios/${scenario.id}/edit`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteScenario(scenario.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
