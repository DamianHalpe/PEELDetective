"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserSearchFormProps {
  defaultValue?: string;
}

export function UserSearchForm({ defaultValue }: UserSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    if (q) {
      router.push(`${pathname}?q=${encodeURIComponent(q)}`);
    } else {
      router.push(pathname);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          placeholder="Search by name or email…"
          defaultValue={defaultValue}
          className="pl-8 w-64"
        />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
    </form>
  );
}
