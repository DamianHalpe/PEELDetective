"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Calendar,
  ArrowLeft,
  Search,
  Trophy,
  Target,
  TrendingUp,
  Badge as BadgeIcon,
  Eye,
  Shield,
  Star,
  FileText,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, updateUser } from "@/lib/auth-client";

// --- Types ---

interface ProfileSubmission {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  totalScore: number | null;
  teacherOverrideScore: number | null;
  status: string;
  submittedAt: string;
}

interface ProfileBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  iconName: string;
  awardedAt: string;
}

interface ProfileData {
  points: number;
  submissions: ProfileSubmission[];
  badges: ProfileBadge[];
}

// --- Icon mapping for badge iconName field ---

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Badge: BadgeIcon,
  Eye: Eye,
  Shield: Shield,
  Trophy: Trophy,
  Star: Star,
  Target: Target,
  Search: Search,
  FileText: FileText,
};

function BadgeIconComponent({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const Icon = ICON_MAP[iconName] ?? BadgeIcon;
  return <Icon className={className ?? ""} />;
}

// --- Helper: effective score for a submission ---

function effectiveScore(sub: ProfileSubmission): number | null {
  return sub.teacherOverrideScore ?? sub.totalScore;
}

// --- Status badge variant ---

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "evaluated":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
          Evaluated
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// --- Loading skeleton ---

function ProfileSkeleton() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

// --- Main page component ---

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const nicknameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = (session?.user as { nickname?: string | null } | undefined)?.nickname ?? "";
    if (!nicknameInput.trim() || nicknameInput.trim() === current) {
      setNicknameStatus("idle");
      return;
    }
    setNicknameStatus("checking");
    if (nicknameDebounce.current) clearTimeout(nicknameDebounce.current);
    nicknameDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/nickname-check?nickname=${encodeURIComponent(nicknameInput.trim())}`);
        if (res.ok) {
          const data = (await res.json()) as { available: boolean };
          setNicknameStatus(data.available ? "available" : "taken");
        }
      } catch {
        setNicknameStatus("idle");
      }
    }, 400);
  }, [nicknameInput, session]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = (await res.json()) as ProfileData;
      setProfileData(data);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (session) {
      fetchProfile();
      setNicknameInput(
        (session.user as { nickname?: string | null }).nickname ?? ""
      );
    }
  }, [session, fetchProfile]);

  if (isPending || !session) {
    return <ProfileSkeleton />;
  }

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  const user = session.user;
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Compute stats from submissions
  const evaluatedSubmissions = (profileData?.submissions ?? []).filter(
    (s) => s.status === "evaluated"
  );

  const totalCases = evaluatedSubmissions.length;

  const scores = evaluatedSubmissions
    .map((s) => effectiveScore(s))
    .filter((s): s is number => s !== null);

  const averageScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;

  const bestScore = scores.length > 0 ? Math.max(...scores) : null;

  // Role badge label
  const roleLabel =
    (user as Record<string, unknown>).role === "teacher"
      ? "Teacher"
      : (user as Record<string, unknown>).role === "admin"
        ? "Admin"
        : "Student";

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Back button + heading */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Your Profile</h1>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-lg">
                  {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                  <Badge variant="outline" className="text-xs">
                    {roleLabel}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    {profileData?.points ?? 0} pts
                  </Badge>
                </div>
                {(user as { nickname?: string | null }).nickname && (
                  <p className="text-sm text-muted-foreground">
                    &ldquo;{(user as { nickname?: string | null }).nickname}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {createdDate && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {createdDate}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{totalCases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {averageScore !== null ? `${averageScore}/20` : "--"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Score</p>
                  <p className="text-2xl font-bold">
                    {bestScore !== null ? `${bestScore}/20` : "--"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission History */}
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>
              Your past case investigations and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(profileData?.submissions ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p>No cases solved yet. Start with a scenario!</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/">Browse Scenarios</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {profileData!.submissions.map((sub) => {
                  const score = effectiveScore(sub);
                  const dateStr = new Date(sub.submittedAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  );
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <Link
                          href={`/scenarios/${sub.scenarioId}`}
                          className="font-medium hover:underline truncate block"
                        >
                          {sub.scenarioTitle}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {dateStr}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium">
                          {sub.status === "evaluated" && score !== null
                            ? `${score}/20`
                            : "Pending"}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nickname */}
        <Card>
          <CardHeader>
            <CardTitle>Nickname</CardTitle>
            <CardDescription>
              Your nickname is displayed on the leaderboard and visible to other
              students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex items-center gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (nicknameInput.trim() && nicknameStatus === "taken") {
                  toast.error("That nickname is already taken.");
                  return;
                }
                setIsSavingNickname(true);
                try {
                  const result = await updateUser({
                    nickname: nicknameInput || undefined,
                  });
                  if (result.error) {
                    toast.error(
                      result.error.message ?? "Failed to save nickname"
                    );
                  } else {
                    toast.success("Nickname saved!");
                  }
                } catch {
                  toast.error("An unexpected error occurred");
                } finally {
                  setIsSavingNickname(false);
                }
              }}
            >
              <div className="relative max-w-xs">
                <Input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="e.g. SherlockJr"
                  className={`pr-8 ${nicknameStatus === "taken" ? "border-destructive" : nicknameStatus === "available" ? "border-emerald-500" : ""}`}
                  disabled={isSavingNickname}
                />
                {nicknameInput.trim() && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {nicknameStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {nicknameStatus === "available" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    {nicknameStatus === "taken" && <X className="h-3.5 w-3.5 text-destructive" />}
                  </span>
                )}
              </div>
              <Button type="submit" disabled={isSavingNickname || nicknameStatus === "taken" || nicknameStatus === "checking"}>
                {isSavingNickname ? "Saving..." : "Save"}
              </Button>
            </form>
            {nicknameStatus === "taken" && (
              <p className="text-xs text-destructive mt-2">That nickname is already taken.</p>
            )}
            {nicknameStatus === "available" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">Nickname is available!</p>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              Awards earned through your detective work
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(profileData?.badges ?? []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p>No badges yet. Keep solving cases!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profileData!.badges.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-3 p-4 border rounded-lg"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <BadgeIconComponent
                        iconName={b.iconName}
                        className="h-5 w-5 text-primary"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(b.awardedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
