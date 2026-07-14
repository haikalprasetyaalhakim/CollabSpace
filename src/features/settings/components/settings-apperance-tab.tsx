"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export default function SettingsAppearanceTab() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xs flex flex-col shadow-xs">
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
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                theme === "light"
                  ? "border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 dark:bg-indigo-500/5 shadow-xs"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900/45 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Sun className="h-4.5 w-4.5" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                theme === "dark"
                  ? "border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 dark:bg-indigo-500/5 shadow-xs"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900/45 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Moon className="h-4.5 w-4.5" />
              Dark
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border p-4 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                theme === "system"
                  ? "border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 dark:bg-indigo-500/5 shadow-xs"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900/45 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Monitor className="h-4.5 w-4.5" />
              System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
