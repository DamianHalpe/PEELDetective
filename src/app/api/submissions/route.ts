import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

interface EvaluateResult {
  scores: { point: number; evidence: number; explain: number; link: number };
  feedback: {
    point: string;
    evidence: string;
    explain: string;
    link: string;
  };
  grammarFlags: string[];
  modelAnswer: string;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as { scenarioId?: string; responseText?: string };

  if (!data.scenarioId || !data.responseText) {
    return Response.json(
      { error: "Missing scenarioId or responseText" },
      { status: 400 }
    );
  }

  // Fetch the scenario to pass to the evaluator
  const [scenarioRecord] = await db
    .select()
    .from(schema.scenario)
    .where(eq(schema.scenario.id, data.scenarioId));

  if (!scenarioRecord) {
    return Response.json({ error: "Scenario not found" }, { status: 404 });
  }

  const submissionId = crypto.randomUUID();
  const now = new Date();

  // Create the submission in pending state
  await db.insert(schema.submission).values({
    id: submissionId,
    studentId: session.user.id,
    scenarioId: data.scenarioId,
    responseText: data.responseText,
    status: "pending",
    submittedAt: now,
  });

  // Call the evaluate endpoint internally
  const evaluateUrl = new URL(
    "/api/evaluate",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  try {
    const evaluateResponse = await fetch(evaluateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responseText: data.responseText,
        scenario: {
          crimeDescription: scenarioRecord.crimeDescription,
          suspects: scenarioRecord.suspects,
          clues: scenarioRecord.clues,
          correctCulprit: scenarioRecord.correctCulprit,
        },
      }),
    });

    if (!evaluateResponse.ok) {
      // Evaluation failed — mark submission as failed
      await db
        .update(schema.submission)
        .set({ status: "failed" })
        .where(eq(schema.submission.id, submissionId));

      return Response.json(
        {
          error: "Evaluation failed",
          submissionId,
        },
        { status: 502 }
      );
    }

    const result = (await evaluateResponse.json()) as EvaluateResult;

    const totalScore =
      result.scores.point +
      result.scores.evidence +
      result.scores.explain +
      result.scores.link;

    // Update the submission with evaluation results
    const [updated] = await db
      .update(schema.submission)
      .set({
        scorePoint: result.scores.point,
        scoreEvidence: result.scores.evidence,
        scoreExplain: result.scores.explain,
        scoreLink: result.scores.link,
        totalScore,
        feedbackJson: result.feedback,
        grammarFlagsJson: result.grammarFlags,
        modelAnswer: result.modelAnswer,
        status: "evaluated",
        aiEvaluatedAt: new Date(),
      })
      .where(eq(schema.submission.id, submissionId))
      .returning();

    return Response.json(updated, { status: 201 });
  } catch (error) {
    // Network or timeout error — mark as failed
    await db
      .update(schema.submission)
      .set({ status: "failed" })
      .where(eq(schema.submission.id, submissionId));

    const message =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Evaluation failed", details: message, submissionId },
      { status: 502 }
    );
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await db
    .select()
    .from(schema.submission)
    .where(eq(schema.submission.studentId, session.user.id));

  return Response.json(submissions);
}
