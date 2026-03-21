import { ShieldX } from "lucide-react";
import { SignOutButton } from "./_components/SignOutButton";

export const metadata = { title: "Account Suspended" };

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-detective-slate/10 to-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-detective-crimson/10">
          <ShieldX className="h-8 w-8 text-detective-crimson" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Account Suspended
          </h1>
          <p className="text-muted-foreground">
            Your account has been deactivated by your teacher. Please contact
            your teacher if you believe this is a mistake.
          </p>
        </div>

        <SignOutButton />
      </div>
    </div>
  );
}
