import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * Escape a value for CSV output. Wraps in double quotes if the value
 * contains commas, double quotes, or newlines.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvString(headerRow: string[], dataRows: string[][]): string {
  const lines = [headerRow.map(csvEscape).join(",")];
  for (const row of dataRows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function pdfResponse(bytes: Uint8Array, filename: string): Response {
  return new Response(new Blob([bytes.buffer as ArrayBuffer]), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ── PDF layout helpers ──────────────────────────────────────────────────────

// Colors (pdf-lib uses 0–1 range)
const C_AMBER = rgb(0.961, 0.620, 0.043);
const C_BLACK = rgb(0.059, 0.090, 0.165);
const C_WHITE = rgb(1, 1, 1);
const C_SLATE = rgb(0.392, 0.455, 0.545);
const C_ROW_EVEN = rgb(0.973, 0.980, 0.988);
const C_ROW_ODD = rgb(1, 1, 1);
const C_BORDER = rgb(0.886, 0.910, 0.941);

const MARGIN = 40;
const HEADER_BAR_H = 56;
const SUBTITLE_H = 20; // extra height when subtitle is present

interface Column {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  pageWidth: number;
  pageHeight: number;
  /** Current Y distance from the top of the page (increases downward). */
  cursorY: number;
}

/** Convert top-relative cursor Y to pdf-lib bottom-left Y. */
function toY(ctx: Ctx, cursorY: number): number {
  return ctx.pageHeight - cursorY;
}

function drawRect(
  ctx: Ctx,
  x: number,
  cursorY: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>
) {
  ctx.page.drawRectangle({
    x,
    y: toY(ctx, cursorY + height), // bottom-left y in pdf coords
    width,
    height,
    color,
  });
}

function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  cursorY: number,
  opts: {
    font: PDFFont;
    size: number;
    color: ReturnType<typeof rgb>;
    maxWidth?: number;
  }
) {
  // Clip long strings to fit the column
  let displayText = text;
  if (opts.maxWidth !== undefined) {
    while (
      displayText.length > 1 &&
      opts.font.widthOfTextAtSize(displayText, opts.size) > opts.maxWidth
    ) {
      displayText = displayText.slice(0, -1);
    }
    if (displayText !== text) {
      displayText = displayText.slice(0, -1) + "…";
    }
  }

  ctx.page.drawText(displayText, {
    x,
    y: toY(ctx, cursorY + opts.size), // baseline y in pdf coords
    size: opts.size,
    font: opts.font,
    color: opts.color,
  });
}

async function createPdfCtx(landscape: boolean): Promise<Ctx> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage(
    landscape ? [841.89, 595.28] : [595.28, 841.89]
  );
  const { width, height } = page.getSize();

  return { doc, page, regular, bold, pageWidth: width, pageHeight: height, cursorY: 0 };
}

function addPdfHeader(ctx: Ctx, title: string, subtitle?: string) {
  const barH = subtitle ? HEADER_BAR_H + SUBTITLE_H : HEADER_BAR_H;

  // Dark header bar
  drawRect(ctx, 0, 0, ctx.pageWidth, barH, C_BLACK);

  // "PEEL Detective" brand in amber
  const brandText = "PEEL Detective";
  const brandSize = 18;
  drawText(ctx, brandText, MARGIN, 16, {
    font: ctx.bold,
    size: brandSize,
    color: C_AMBER,
  });

  // "— Title" in white after the brand
  const brandWidth = ctx.bold.widthOfTextAtSize(brandText, brandSize);
  drawText(ctx, `  \u2014  ${title}`, MARGIN + brandWidth, 16, {
    font: ctx.regular,
    size: 11,
    color: C_WHITE,
  });

  // Timestamp (right-aligned)
  const timestamp = `Generated ${new Date().toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
  const tsSize = 7;
  const tsWidth = ctx.regular.widthOfTextAtSize(timestamp, tsSize);
  drawText(ctx, timestamp, ctx.pageWidth - MARGIN - tsWidth, 20, {
    font: ctx.regular,
    size: tsSize,
    color: C_SLATE,
  });

  // Subtitle below brand
  if (subtitle) {
    drawText(ctx, subtitle, MARGIN, HEADER_BAR_H + 4, {
      font: ctx.regular,
      size: 8,
      color: C_SLATE,
    });
  }

  ctx.cursorY = barH + 12; // leave a small gap below header bar
}

function addPdfTable(ctx: Ctx, columns: Column[], rows: string[][]) {
  const ROW_H = 18;
  const HDR_H = 22;
  const FONT_SIZE = 7.5;
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const bottomLimit = ctx.pageHeight - MARGIN;

  // ── Header row ──
  drawRect(ctx, MARGIN, ctx.cursorY, tableWidth, HDR_H, C_BLACK);
  let x = MARGIN;
  for (const col of columns) {
    const label = col.label;
    const labelW = ctx.bold.widthOfTextAtSize(label, FONT_SIZE);
    const textX =
      col.align === "center"
        ? x + (col.width - labelW) / 2
        : col.align === "right"
          ? x + col.width - labelW - 4
          : x + 4;
    drawText(ctx, label, textX, ctx.cursorY + 7, {
      font: ctx.bold,
      size: FONT_SIZE,
      color: C_AMBER,
    });
    x += col.width;
  }
  ctx.cursorY += HDR_H;

  // ── Data rows ──
  for (let i = 0; i < rows.length; i++) {
    // Page break: add new page and re-draw header
    if (ctx.cursorY + ROW_H > bottomLimit) {
      ctx.page = ctx.doc.addPage([ctx.pageWidth, ctx.pageHeight]);
      ctx.cursorY = MARGIN;
      addPdfTable(ctx, columns, rows.slice(i));
      return;
    }

    const rowColor = i % 2 === 0 ? C_ROW_EVEN : C_ROW_ODD;
    drawRect(ctx, MARGIN, ctx.cursorY, tableWidth, ROW_H, rowColor);
    // Bottom border
    drawRect(ctx, MARGIN, ctx.cursorY + ROW_H - 0.5, tableWidth, 0.5, C_BORDER);

    x = MARGIN;
    const row = rows[i]!;
    for (let ci = 0; ci < columns.length; ci++) {
      const col = columns[ci]!;
      const cellText = row[ci] ?? "";
      const maxW = col.width - 8;
      const textW = ctx.regular.widthOfTextAtSize(cellText, FONT_SIZE);
      const textX =
        col.align === "center"
          ? x + (col.width - Math.min(textW, maxW)) / 2
          : col.align === "right"
            ? x + col.width - Math.min(textW, maxW) - 4
            : x + 4;
      drawText(ctx, cellText, textX, ctx.cursorY + 5, {
        font: ctx.regular,
        size: FONT_SIZE,
        color: C_BLACK,
        maxWidth: maxW,
      });
      x += col.width;
    }
    ctx.cursorY += ROW_H;
  }
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role as string;
  if (role !== "teacher" && role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const format = url.searchParams.get("format"); // "csv" (default) or "pdf"
  const isPdf = format === "pdf";

  if (type === "class") {
    return isPdf ? handleClassExportPdf() : handleClassExport();
  }

  if (type === "student") {
    const studentId = url.searchParams.get("studentId");
    if (!studentId) {
      return Response.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }
    return isPdf
      ? handleStudentExportPdf(studentId)
      : handleStudentExport(studentId);
  }

  if (type === "scenario") {
    const scenarioId = url.searchParams.get("scenarioId");
    if (!scenarioId) {
      return Response.json(
        { error: "scenarioId query parameter is required" },
        { status: 400 }
      );
    }
    return isPdf
      ? handleScenarioExportPdf(scenarioId)
      : handleScenarioExport(scenarioId);
  }

  return Response.json(
    { error: "Invalid type. Use: class, student, or scenario" },
    { status: 400 }
  );
}

async function handleClassExport(): Promise<Response> {
  // Get all students who have at least one submission, with their stats
  const submissions = await db
    .select({
      studentId: schema.submission.studentId,
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .orderBy(schema.user.name);

  // Aggregate stats per student
  const studentMap = new Map<
    string,
    {
      name: string;
      nickname: string;
      email: string;
      totalSubmissions: number;
      evaluatedCount: number;
      totalScoreSum: number;
      latestSubmission: Date;
    }
  >();

  for (const row of submissions) {
    const existing = studentMap.get(row.studentId);
    const effectiveScore = row.teacherOverrideScore ?? row.totalScore;
    const isEvaluated = row.status === "evaluated";
    const submittedAt = new Date(row.submittedAt);

    if (!existing) {
      studentMap.set(row.studentId, {
        name: row.studentName ?? "Unknown",
        nickname: row.studentNickname ?? "",
        email: row.studentEmail ?? "",
        totalSubmissions: 1,
        evaluatedCount: isEvaluated ? 1 : 0,
        totalScoreSum: isEvaluated && effectiveScore != null ? effectiveScore : 0,
        latestSubmission: submittedAt,
      });
    } else {
      existing.totalSubmissions += 1;
      if (isEvaluated) {
        existing.evaluatedCount += 1;
        existing.totalScoreSum += effectiveScore ?? 0;
      }
      if (submittedAt > existing.latestSubmission) {
        existing.latestSubmission = submittedAt;
      }
    }
  }

  const headerRow = [
    "Student Name",
    "Nickname",
    "Email",
    "Total Submissions",
    "Average Score",
    "Latest Submission",
  ];
  const dataRows: string[][] = [];

  for (const [, stats] of studentMap) {
    const avgScore =
      stats.evaluatedCount > 0
        ? (stats.totalScoreSum / stats.evaluatedCount).toFixed(1)
        : "N/A";
    dataRows.push([
      stats.name,
      stats.nickname,
      stats.email,
      String(stats.totalSubmissions),
      avgScore,
      stats.latestSubmission.toISOString(),
    ]);
  }

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, "class-report.csv");
}

async function handleStudentExport(studentId: string): Promise<Response> {
  const submissions = await db
    .select({
      scenarioTitle: schema.scenario.title,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, studentId))
    .orderBy(desc(schema.submission.submittedAt));

  const headerRow = [
    "Scenario",
    "Point",
    "Evidence",
    "Explain",
    "Link",
    "Total Score",
    "Teacher Override",
    "Teacher Note",
    "Status",
    "Submitted At",
  ];
  const dataRows = submissions.map((s) => [
    s.scenarioTitle ?? "Unknown",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toISOString(),
  ]);

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, `student-${studentId}-report.csv`);
}

async function handleScenarioExport(scenarioId: string): Promise<Response> {
  const submissions = await db
    .select({
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .where(eq(schema.submission.scenarioId, scenarioId))
    .orderBy(desc(schema.submission.submittedAt));

  const headerRow = [
    "Student Name",
    "Nickname",
    "Email",
    "Point",
    "Evidence",
    "Explain",
    "Link",
    "Total Score",
    "Teacher Override",
    "Teacher Note",
    "Status",
    "Submitted At",
  ];
  const dataRows = submissions.map((s) => [
    s.studentName ?? "Unknown",
    s.studentNickname ?? "",
    s.studentEmail ?? "",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toISOString(),
  ]);

  const csv = buildCsvString(headerRow, dataRows);
  return csvResponse(csv, `scenario-${scenarioId}-report.csv`);
}

// ── PDF handlers ────────────────────────────────────────────────────────────

async function handleClassExportPdf(): Promise<Response> {
  const submissions = await db
    .select({
      studentId: schema.submission.studentId,
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .orderBy(schema.user.name);

  const studentMap = new Map<
    string,
    {
      name: string;
      nickname: string;
      email: string;
      totalSubmissions: number;
      evaluatedCount: number;
      totalScoreSum: number;
      latestSubmission: Date;
    }
  >();

  for (const row of submissions) {
    const existing = studentMap.get(row.studentId);
    const effectiveScore = row.teacherOverrideScore ?? row.totalScore;
    const isEvaluated = row.status === "evaluated";
    const submittedAt = new Date(row.submittedAt);

    if (!existing) {
      studentMap.set(row.studentId, {
        name: row.studentName ?? "Unknown",
        nickname: row.studentNickname ?? "",
        email: row.studentEmail ?? "",
        totalSubmissions: 1,
        evaluatedCount: isEvaluated ? 1 : 0,
        totalScoreSum:
          isEvaluated && effectiveScore != null ? effectiveScore : 0,
        latestSubmission: submittedAt,
      });
    } else {
      existing.totalSubmissions += 1;
      if (isEvaluated) {
        existing.evaluatedCount += 1;
        existing.totalScoreSum += effectiveScore ?? 0;
      }
      if (submittedAt > existing.latestSubmission) {
        existing.latestSubmission = submittedAt;
      }
    }
  }

  const ctx = await createPdfCtx(false); // portrait A4
  addPdfHeader(ctx, "Class Report", `${studentMap.size} students`);

  const columns: Column[] = [
    { label: "Student Name", width: 120 },
    { label: "Nickname", width: 75 },
    { label: "Email", width: 155 },
    { label: "Submissions", width: 65, align: "center" },
    { label: "Avg Score", width: 60, align: "center" },
    { label: "Latest Submission", width: 40 },
  ];

  const rows: string[][] = [];
  for (const [, stats] of studentMap) {
    const avgScore =
      stats.evaluatedCount > 0
        ? (stats.totalScoreSum / stats.evaluatedCount).toFixed(1)
        : "N/A";
    rows.push([
      stats.name,
      stats.nickname,
      stats.email,
      String(stats.totalSubmissions),
      avgScore,
      stats.latestSubmission.toLocaleDateString("en-AU"),
    ]);
  }

  addPdfTable(ctx, columns, rows);

  const bytes = await ctx.doc.save();
  return pdfResponse(bytes, "class-report.pdf");
}

async function handleStudentExportPdf(studentId: string): Promise<Response> {
  const [student] = await db
    .select({ name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, studentId))
    .limit(1);

  const submissions = await db
    .select({
      scenarioTitle: schema.scenario.title,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(
      schema.scenario,
      eq(schema.submission.scenarioId, schema.scenario.id)
    )
    .where(eq(schema.submission.studentId, studentId))
    .orderBy(desc(schema.submission.submittedAt));

  const ctx = await createPdfCtx(true); // landscape A4
  addPdfHeader(
    ctx,
    "Student Report",
    student ? `Student: ${student.name}` : undefined
  );

  const columns: Column[] = [
    { label: "Scenario", width: 190 },
    { label: "Point", width: 44, align: "center" },
    { label: "Evidence", width: 52, align: "center" },
    { label: "Explain", width: 50, align: "center" },
    { label: "Link", width: 44, align: "center" },
    { label: "Total", width: 44, align: "center" },
    { label: "Override", width: 52, align: "center" },
    { label: "Teacher Note", width: 145 },
    { label: "Status", width: 62, align: "center" },
    { label: "Submitted", width: 79 },
  ];

  const rows = submissions.map((s) => [
    s.scenarioTitle ?? "Unknown",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toLocaleDateString("en-AU"),
  ]);

  addPdfTable(ctx, columns, rows);

  const bytes = await ctx.doc.save();
  return pdfResponse(bytes, `student-${studentId}-report.pdf`);
}

async function handleScenarioExportPdf(scenarioId: string): Promise<Response> {
  const [scenarioRecord] = await db
    .select({ title: schema.scenario.title })
    .from(schema.scenario)
    .where(eq(schema.scenario.id, scenarioId))
    .limit(1);

  const submissions = await db
    .select({
      studentName: schema.user.name,
      studentNickname: schema.user.nickname,
      studentEmail: schema.user.email,
      scorePoint: schema.submission.scorePoint,
      scoreEvidence: schema.submission.scoreEvidence,
      scoreExplain: schema.submission.scoreExplain,
      scoreLink: schema.submission.scoreLink,
      totalScore: schema.submission.totalScore,
      teacherOverrideScore: schema.submission.teacherOverrideScore,
      teacherOverrideNote: schema.submission.teacherOverrideNote,
      status: schema.submission.status,
      submittedAt: schema.submission.submittedAt,
    })
    .from(schema.submission)
    .leftJoin(schema.user, eq(schema.submission.studentId, schema.user.id))
    .where(eq(schema.submission.scenarioId, scenarioId))
    .orderBy(desc(schema.submission.submittedAt));

  const ctx = await createPdfCtx(true); // landscape A4
  addPdfHeader(
    ctx,
    "Scenario Report",
    scenarioRecord ? `Scenario: ${scenarioRecord.title}` : undefined
  );

  const columns: Column[] = [
    { label: "Student Name", width: 120 },
    { label: "Nickname", width: 70 },
    { label: "Email", width: 145 },
    { label: "Point", width: 40, align: "center" },
    { label: "Evidence", width: 50, align: "center" },
    { label: "Explain", width: 48, align: "center" },
    { label: "Link", width: 40, align: "center" },
    { label: "Total", width: 40, align: "center" },
    { label: "Override", width: 50, align: "center" },
    { label: "Teacher Note", width: 110 },
    { label: "Status", width: 58, align: "center" },
    { label: "Submitted", width: 91 },
  ];

  const rows = submissions.map((s) => [
    s.studentName ?? "Unknown",
    s.studentNickname ?? "",
    s.studentEmail ?? "",
    String(s.scorePoint ?? ""),
    String(s.scoreEvidence ?? ""),
    String(s.scoreExplain ?? ""),
    String(s.scoreLink ?? ""),
    String(s.totalScore ?? ""),
    String(s.teacherOverrideScore ?? ""),
    s.teacherOverrideNote ?? "",
    s.status,
    new Date(s.submittedAt).toLocaleDateString("en-AU"),
  ]);

  addPdfTable(ctx, columns, rows);

  const bytes = await ctx.doc.save();
  return pdfResponse(bytes, `scenario-${scenarioId}-report.pdf`);
}
