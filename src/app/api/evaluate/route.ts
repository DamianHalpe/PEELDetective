
interface EvaluateRequest {
  responseText: string;
  scenario: {
    crimeDescription: string;
    suspects: { name: string; background: string }[];
    clues: string[];
    correctCulprit: string;
  };
}

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

const SYSTEM_PROMPT = `You are an expert writing teacher evaluating a student's PEEL paragraph response to a mystery scenario.

PEEL Framework:
- Point (0-5): Did the student clearly state who the culprit is?
- Evidence (0-5): Did the student cite specific clues from the scenario?
- Explain (0-5): Did the student logically connect the evidence to their conclusion?
- Link (0-5): Did the student tie their argument back to the original question/scenario?

Scoring guide:
- 0: Missing entirely
- 1-2: Attempted but weak
- 3-4: Adequate with minor issues
- 5: Excellent, clear and specific

Return ONLY valid JSON (no markdown code blocks) in this exact format:
{
  "scores": { "point": <0-5>, "evidence": <0-5>, "explain": <0-5>, "link": <0-5> },
  "feedback": { "point": "<feedback>", "evidence": "<feedback>", "explain": "<feedback>", "link": "<feedback>" },
  "grammarFlags": ["<issue1>", "<issue2>"],
  "modelAnswer": "<a model PEEL paragraph answer>"
}`;

export async function POST(req: Request) {
  // This endpoint is internal-only. Callers must present the shared secret.
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || req.headers.get("X-Internal-Secret") !== secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Partial<EvaluateRequest>;

  if (!data.responseText || !data.scenario) {
    return Response.json(
      { error: "Missing responseText or scenario" },
      { status: 400 }
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  const suspectsDescription = data.scenario.suspects
    .map((s) => `- ${s.name}: ${s.background}`)
    .join("\n");

  const cluesDescription = data.scenario.clues
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const userMessage = `Scenario:
Crime Description: ${data.scenario.crimeDescription}

Suspects:
${suspectsDescription}

Clues:
${cluesDescription}

Correct Culprit: ${data.scenario.correctCulprit}

Student's Response:
${data.responseText}`;

  const openrouterApiKey = process.env.OPENROUTER_API_KEY!;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5";

  try {
    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      console.error("[evaluate] OpenRouter error:", errBody);
      return Response.json({ error: "OpenRouter request failed", details: errBody }, { status: 502 });
    }

    const apiJson = await apiResponse.json() as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    console.log("[evaluate] full API response:", JSON.stringify(apiJson));
    const rawResponse = apiJson.choices?.[0]?.message?.content ?? "";

    console.log("[evaluate] raw model response:", rawResponse);

    // Parse the AI response as JSON (strip markdown fences some models add)
    let rawText = rawResponse.trim();
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch?.[1]) rawText = fenceMatch[1].trim();
    const parsed = JSON.parse(rawText) as EvaluateResult;

    // Validate the response structure
    if (
      !parsed.scores ||
      typeof parsed.scores.point !== "number" ||
      typeof parsed.scores.evidence !== "number" ||
      typeof parsed.scores.explain !== "number" ||
      typeof parsed.scores.link !== "number" ||
      !parsed.feedback ||
      !Array.isArray(parsed.grammarFlags) ||
      typeof parsed.modelAnswer !== "string"
    ) {
      console.error("[evaluate] validation failed, parsed:", JSON.stringify(parsed));
      return Response.json(
        { error: "Invalid AI response format", raw: rawText },
        { status: 502 }
      );
    }

    // Clamp scores to the 0-5 range to guard against out-of-range AI responses
    const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n)));
    parsed.scores.point = clamp(parsed.scores.point);
    parsed.scores.evidence = clamp(parsed.scores.evidence);
    parsed.scores.explain = clamp(parsed.scores.explain);
    parsed.scores.link = clamp(parsed.scores.link);

    const tokensUsed = apiJson.usage?.total_tokens ?? 0;

    return Response.json({ ...parsed, tokensUsed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown evaluation error";
    console.error("[evaluate] error:", message);
    return Response.json(
      { error: "Evaluation failed", details: message },
      { status: 502 }
    );
  }
}
