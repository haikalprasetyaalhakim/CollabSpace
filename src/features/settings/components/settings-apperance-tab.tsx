"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export default function SettingsAppearanceTab() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Appearance
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Customize how CollabSpace looks
        </p>
      </div>

      <div className="flex flex-col gap-y-1.5">
        <div className="flex flex-col gap-y-1">
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-3 rounded-md border p-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                theme === "light"
                  ? "border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <Sun className="h-5 w-5" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-3 rounded-md border p-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                theme === "dark"
                  ? "border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <Moon className="h-5 w-5" />
              Dark
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center gap-3 rounded-md border p-4 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                theme === "system"
                  ? "border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              }`}
            >
              <Monitor className="h-5 w-5" />
              System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
