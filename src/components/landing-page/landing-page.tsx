"use client";

import {
  ArrowRight,
  Hash,
  Image,
  Layers,
  Menu,
  MessageSquare,
  User,
  Video,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans antialiased selection:bg-indigo-500/20 relative overflow-hidden">
      <div className="absolute top-[10%] left-[15%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[60%] right-[10%] translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[5%] left-[20%] -translate-x-1/2 w-[450px] h-[450px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/50 dark:border-zinc-800/40 transition-colors">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-650 dark:group-hover:text-zinc-300 transition-colors">
                CollabSpace<span className="text-indigo-500 font-extrabold">.</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-x-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <a
                href="#features"
                className="px-3.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-3.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
              >
                How it Works
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-x-3">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-zinc-600 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                Login
              </Link>
              <Button
                className="text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-9 px-4 rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                asChild
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900 transition-all"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden px-5 pb-5 flex flex-col gap-1 border-t border-zinc-200 dark:border-zinc-850 pt-3 bg-white dark:bg-zinc-950 animate-in fade-in slide-in-from-top-2 duration-150">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="px-3 py-3 rounded-lg text-sm font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="px-3 py-3 rounded-lg text-sm font-medium text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              How it Works
            </a>
            <div className="flex flex-col gap-2.5 mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-850">
              <Button
                variant="outline"
                className="w-full justify-center text-sm font-semibold border-zinc-200 dark:border-zinc-850 h-10"
                asChild
              >
                <Link href="/sign-in">Login</Link>
              </Button>
              <Button
                className="w-full justify-center text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10"
                asChild
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="relative flex flex-col items-center justify-center text-center px-5 py-24 md:py-32 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50 bg-clip-text text-transparent">
              All your team communication. <br />
              <span className="text-zinc-500 dark:text-zinc-400 font-bold">
                One calm workspace.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
              Chat, meet, and organize your work without the noise. CollabSpace
              brings your team together in a focused, clean, and real-time
              environment.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <Button
                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 px-6 rounded-lg text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all duration-200"
                asChild
              >
                <Link href="/sign-up">
                  Get Started <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-10 px-6 rounded-lg text-sm font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-transparent"
                asChild
              >
                <Link href="/sign-in">View Demo</Link>
              </Button>
            </div>

            <div className="w-full max-w-4xl mt-16 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-2 shadow-2xl relative overflow-hidden backdrop-blur-xs select-none">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 rounded-t-xl shrink-0">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
                <div className="mx-auto w-48 h-4 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
                  collabspace.com/workspace
                </div>
              </div>

              <div className="aspect-[16/9] flex bg-zinc-950 text-zinc-400 rounded-b-xl text-left overflow-hidden relative">
                <div className="w-48 bg-zinc-900 border-r border-zinc-850 p-3 flex flex-col gap-4 shrink-0 text-xs font-semibold">
                  <div className="h-8 rounded-lg bg-zinc-800/50 flex items-center px-2 text-zinc-200 justify-between">
                    <span>Haikal Club's</span>
                    <span className="text-[10px] text-zinc-400">▼</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                      CHANNELS
                    </span>
                    <div className="h-6 rounded bg-zinc-800 text-zinc-250 flex items-center px-2 gap-1.5">
                      <Hash className="size-3.5" />
                      <span>general</span>
                    </div>
                    <div className="h-6 flex items-center px-2 gap-1.5 hover:bg-zinc-800/30 rounded">
                      <Hash className="size-3.5 text-zinc-500" />
                      <span>announcements</span>
                    </div>
                    <div className="h-6 flex items-center px-2 gap-1.5 hover:bg-zinc-800/30 rounded">
                      <Volume2 className="size-3.5 text-zinc-500" />
                      <span>ngobrol-santai</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                      DIRECT MESSAGES
                    </span>
                    <div className="h-6 flex items-center px-2 gap-1.5 hover:bg-zinc-800/30 rounded">
                      <User className="size-3.5 text-zinc-500" />
                      <span>Haikal Al Hakim</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-zinc-950 p-4 relative justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-bold shrink-0">
                        HA
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-350">
                            Haikal Alhakim
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            10:45 AM
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Welcome to CollabSpace! Start writing messages or
                          click meetings to join voice call.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center px-3 text-xs text-zinc-550">
                    Message #general...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="py-20 md:py-28 bg-zinc-50 dark:bg-zinc-950"
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Designed for Focus
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Everything you need to collaborate with your team, packaged into
                a minimal and responsive application interface.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col gap-4">
                <div className="size-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    Real-Time Chat
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Instantly text your colleagues in public text channels or
                    direct message threads.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col gap-4">
                <div className="size-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Video className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    WebRTC Video & Voice
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Hop into voice channels for low-latency calls, complete with
                    screen sharing and grid view.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col gap-4">
                <div className="size-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    Multi-Workspace
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Switch between different clubs and workspaces seamlessly in
                    one workspace footer list.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col gap-4">
                <div className="size-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Image className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    File Sharing
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Share screenshots, documents, and media instantly in threads
                    with rich file attachments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="py-20 md:py-28 bg-white dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-850"
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                How It Works
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Setup your workspace and start collaborating with your team in
                three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Initialize Workspace
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Create a new workspace for your organization. Set up a
                  customized workspace image, description, and invite code.
                </p>
              </div>

              <div className="space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Invite Members
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Copy the unique workspace invite code from the dashboard or
                  sidebar, and share it with your team members to join.
                </p>
              </div>

              <div className="space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Collaborate Instantly
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Open text channels to write messages, create custom threads,
                  or click join voice call to establish low-latency WebRTC
                  conferences.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-850">
          <div className="max-w-4xl mx-auto px-5 md:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-250/70 dark:border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-900/60 dark:to-zinc-950/60 p-8 md:p-12 text-center shadow-xl">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="relative max-w-lg mx-auto space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Ready to try CollabSpace?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Join now to establish a calm, organized, and low-latency
                  workspace environment for your distributed team.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    className="bg-white text-zinc-900 hover:bg-zinc-200 h-10 px-6 rounded-lg text-sm font-semibold shadow-md"
                    asChild
                  >
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-10 px-6 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5"
                    asChild
                  >
                    <Link href="/sign-in">Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 bg-white dark:bg-zinc-950 border-t border-zinc-200/40 dark:border-zinc-850/80">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              CollabSpace<span className="text-indigo-500 font-extrabold">.</span>
            </span>
          </div>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-normal">
            &copy; {new Date().getFullYear()} CollabSpace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
