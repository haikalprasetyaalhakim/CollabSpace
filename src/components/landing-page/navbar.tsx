"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-3 px-5 md:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <h2 className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:opacity-70 transition-opacity">
              CollabSpace
            </h2>
          </Link>

          <div className="hidden md:flex items-center gap-x-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <a
              href="#features"
              className="px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
            >
              How it Works
            </a>
          </div>

          <div className="hidden md:flex items-center gap-x-1.5">
            <Button
              variant="ghost"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              asChild
            >
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button
              className="text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none transition-colors"
              asChild
            >
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="size-4.5" />
            ) : (
              <Menu className="size-4.5" />
            )}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-0.5 border-t border-zinc-200 dark:border-zinc-800 pt-2">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              How it Works
            </a>
            <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800"
                asChild
              >
                <Link href="/sign-in">Login</Link>
              </Button>

              <Button
                className="w-full justify-center text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none"
                asChild
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
