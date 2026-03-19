import { BookOpen, Target, Search, Brain, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QualityLevel {
  level: string;
  range: string;
  example: string;
  explanation: string;
  variant: "destructive" | "outline" | "default";
  badgeClass: string;
}

interface PeelElement {
  letter: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  borderColor: string;
  levels: QualityLevel[];
}

const peelElements: PeelElement[] = [
  {
    letter: "P",
    name: "Point",
    description:
      "State your claim clearly. Who is the culprit and why? A strong Point sets up your entire argument in one direct sentence.",
    icon: <Target className="h-5 w-5" />,
    borderColor: "border-l-blue-500",
    levels: [
      {
        level: "Basic",
        range: "0 - 2",
        example: "I think it was the butler.",
        explanation:
          "Unclear and vague -- no specific claim or reasoning is offered to the reader.",
        variant: "destructive",
        badgeClass: "",
      },
      {
        level: "Developing",
        range: "3 - 4",
        example:
          "Based on the evidence, I believe the butler committed the crime.",
        explanation:
          "Names the culprit but lacks specificity about motive or opportunity.",
        variant: "outline",
        badgeClass: "border-detective-amber text-detective-amber",
      },
      {
        level: "Excellent",
        range: "5",
        example:
          "The butler is the culprit because he had both the motive and opportunity, as established by the clues.",
        explanation:
          "Clear, direct, and sets up the argument with confidence and precision.",
        variant: "default",
        badgeClass: "bg-emerald-600 text-white",
      },
    ],
  },
  {
    letter: "E",
    name: "Evidence",
    description:
      "Support your claim with specific clues from the crime scene. Reference exact details -- the more precise, the stronger your case.",
    icon: <Search className="h-5 w-5" />,
    borderColor: "border-l-detective-amber",
    levels: [
      {
        level: "Basic",
        range: "0 - 2",
        example: "There were clues at the scene.",
        explanation:
          "Vague reference with no specific evidence cited. Could apply to any case.",
        variant: "destructive",
        badgeClass: "",
      },
      {
        level: "Developing",
        range: "3 - 4",
        example:
          "Clue 1 shows the butler was near the scene at the time.",
        explanation:
          "References a clue but the connection is loose and only one piece is cited.",
        variant: "outline",
        badgeClass: "border-detective-amber text-detective-amber",
      },
      {
        level: "Excellent",
        range: "5",
        example:
          "The muddy footprints (Clue 2) match the butler\u2019s shoes, and the torn jacket (Clue 4) was found in his room.",
        explanation:
          "Specific, multiple pieces of evidence cited with clear attribution.",
        variant: "default",
        badgeClass: "bg-emerald-600 text-white",
      },
    ],
  },
  {
    letter: "E",
    name: "Explain",
    description:
      "Connect the dots. Explain how your evidence proves your point with logical reasoning -- this is where your detective skills shine.",
    icon: <Brain className="h-5 w-5" />,
    borderColor: "border-l-emerald-500",
    levels: [
      {
        level: "Basic",
        range: "0 - 2",
        example: "This proves it was him.",
        explanation:
          "No logical connection is made between evidence and conclusion.",
        variant: "destructive",
        badgeClass: "",
      },
      {
        level: "Developing",
        range: "3 - 4",
        example:
          "The footprints show he was there, which means he could have done it.",
        explanation:
          "Some logic present but shallow -- \"could have\" weakens the argument.",
        variant: "outline",
        badgeClass: "border-detective-amber text-detective-amber",
      },
      {
        level: "Excellent",
        range: "5",
        example:
          "The combination of the matching footprints and torn jacket demonstrates the butler was present at the scene during the crime -- direct physical evidence linking him to the act.",
        explanation:
          "Thorough logical reasoning that weaves multiple pieces of evidence into a compelling argument.",
        variant: "default",
        badgeClass: "bg-emerald-600 text-white",
      },
    ],
  },
  {
    letter: "L",
    name: "Link",
    description:
      "Bring it full circle. Tie your conclusion back to the original scenario question with a strong closing statement.",
    icon: <Link2 className="h-5 w-5" />,
    borderColor: "border-l-purple-500",
    levels: [
      {
        level: "Basic",
        range: "0 - 2",
        example: "So it was the butler.",
        explanation:
          "No meaningful connection back to the original question or scenario.",
        variant: "destructive",
        badgeClass: "",
      },
      {
        level: "Developing",
        range: "3 - 4",
        example:
          "Therefore, the butler is the most likely suspect.",
        explanation:
          "Links back to the claim but weakly -- \"most likely\" introduces doubt.",
        variant: "outline",
        badgeClass: "border-detective-amber text-detective-amber",
      },
      {
        level: "Excellent",
        range: "5",
        example:
          "Therefore, the weight of physical evidence conclusively identifies the butler as the culprit responsible for the crime described in the scenario.",
        explanation:
          "Strong closure that directly addresses the scenario with confident, definitive language.",
        variant: "default",
        badgeClass: "bg-emerald-600 text-white",
      },
    ],
  },
];

export default function LearnPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Hero section */}
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-detective-amber/10">
          <BookOpen className="h-7 w-7 text-detective-amber" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          The PEEL Method
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Every great detective builds a case methodically. The PEEL framework
          gives you a proven structure for writing convincing arguments -- from
          your opening claim to your closing statement.
        </p>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-detective-amber/60 to-transparent" />
      </div>

      {/* PEEL elements */}
      <div className="space-y-12">
        {peelElements.map((el) => (
          <section key={el.name}>
            {/* Element header */}
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold">
                {el.letter}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-detective-amber">{el.icon}</span>
                <h2 className="text-2xl font-bold">{el.name}</h2>
              </div>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {el.description}
            </p>

            {/* Quality level cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {el.levels.map((level) => (
                <Card
                  key={level.level}
                  className={`border-l-4 ${el.borderColor} overflow-hidden`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{level.level}</span>
                      <Badge
                        variant={level.variant}
                        className={level.badgeClass}
                      >
                        {level.range}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <blockquote className="border-l-2 border-muted-foreground/20 pl-3 text-sm italic text-foreground">
                      &ldquo;{level.example}&rdquo;
                    </blockquote>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {level.explanation}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer tip */}
      <Card className="mt-12 border-detective-amber/30 bg-detective-amber/5">
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-detective-amber/10">
            <BookOpen className="h-5 w-5 text-detective-amber" />
          </div>
          <div>
            <p className="mb-1 font-semibold">Detective&apos;s Tip</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The best case reports weave all four PEEL elements into a single,
              flowing paragraph. Practice moving seamlessly from your Point
              through Evidence and Explanation to a strong Link -- just like a
              real detective presenting a case in court.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
