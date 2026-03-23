"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function dispatchThemeChange() {
  window.dispatchEvent(new Event("peel-theme-change"));
}

export function ModeToggle({ hasCustomTheme: hasCustomThemeProp }: { hasCustomTheme?: boolean }) {
  const { setTheme } = useTheme();
  const [hasCustomTheme, setHasCustomTheme] = useState(hasCustomThemeProp ?? false);

  useEffect(() => {
    function check() {
      setHasCustomTheme(!!localStorage.getItem("peel-custom-theme") || (hasCustomThemeProp ?? false));
    }
    check();
    window.addEventListener("peel-theme-change", check);
    return () => window.removeEventListener("peel-theme-change", check);
  }, [hasCustomThemeProp]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            localStorage.setItem("peel-theme-preference", "light");
            setTheme("light");
            dispatchThemeChange();
          }}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            localStorage.setItem("peel-theme-preference", "dark");
            setTheme("dark");
            dispatchThemeChange();
          }}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            localStorage.setItem("peel-theme-preference", "system");
            setTheme("system");
            dispatchThemeChange();
          }}
        >
          System
        </DropdownMenuItem>
        {hasCustomTheme && (
          <DropdownMenuItem
            onClick={() => {
              localStorage.setItem("peel-theme-preference", "custom");
              dispatchThemeChange();
              setTheme("light");
            }}
          >
            <Palette className="mr-2 h-4 w-4" />
            Custom
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
