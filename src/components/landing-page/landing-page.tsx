"use client";

import {
  ArrowRight,
  CheckCircle2,
  Hash,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  Radio,
  Smile,
  Sparkles,
  User,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../ui/button";

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans antialiased selection:bg-indigo-500/20 relative overflow-x-clip">
      <div className="absolute top-[8%] left-[15%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[50%] right-[10%] translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[5%] left-[20%] -translate-x-1/2 w-[450px] h-[450px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 dark:bg-zinc-950/75 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between py-3.5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-650 dark:group-hover:text-zinc-300 transition-colors">
                CollabSpace
                <span className="text-indigo-500 font-extrabold">.</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-x-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-3.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all duration-150"
              >
                How it Works
              </a>
            </nav>
            <div className="hidden md:flex items-center gap-x-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 px-2 py-1 transition-colors"
              >
                Sign In
              </Link>
              <Button
                className="text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-9 px-4 rounded-lg shadow-xs hover:-translate-y-0.5 transition-all duration-200"
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
                <Link href="/sign-in">Sign In</Link>
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
        <section className="relative flex flex-col items-center justify-center text-center px-5 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-white dark:bg-zinc-950">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] max-w-3xl bg-gradient-to-b from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              All your team communication. <br />
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold">
                One calm workspace.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
              Chat, meet, and organize your work without the noise. CollabSpace
              brings your team together in a focused, clean, and real-time
              environment.
            </p>

            <div className="flex items-center gap-3 mt-2">
              <Button
                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 px-6 rounded-lg text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all duration-200"
                asChild
              >
                <Link href="/sign-up">
                  Get Started Free <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-10 px-6 rounded-lg text-sm font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-transparent"
                asChild
              >
                <Link href="/sign-in">Explore Demo</Link>
              </Button>
            </div>

            <div className="w-full max-w-4xl mt-12 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-2 shadow-2xl relative overflow-hidden select-none">
              {/* Browser Top Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 rounded-t-xl shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-400/90" />
                  <span className="size-2.5 rounded-full bg-amber-400/90" />
                  <span className="size-2.5 rounded-full bg-emerald-400/90" />
                </div>
                {/* Vercel URL Bar with Lock */}
                <div className="px-3 h-5 bg-zinc-150/70 dark:bg-zinc-850/80 rounded-md text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 border border-zinc-200/60 dark:border-zinc-700/50 font-mono">
                  <Lock className="size-2.5 text-emerald-500" />
                  <span>collabspace.vercel.app/workspaces</span>
                </div>
                <div className="w-8" />
              </div>

              {/* Workspace Mockup View */}
              <div className="aspect-[16/9] flex bg-zinc-950 text-zinc-400 rounded-b-xl text-left overflow-hidden relative">
                {/* Left Sidebar Mockup */}
                <div className="w-48 bg-zinc-900 border-r border-zinc-850 p-3 flex flex-col gap-4 shrink-0 text-xs font-semibold">
                  <div className="h-8 rounded-lg bg-zinc-800/60 flex items-center px-2.5 text-zinc-200 justify-between">
                    <span className="truncate">Haikal Club</span>
                    <span className="text-[9px] text-zinc-500">▼</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                      CHANNELS
                    </span>
                    <div className="h-6 rounded bg-zinc-800 text-zinc-200 flex items-center px-2 gap-1.5">
                      <Hash className="size-3.5 text-indigo-400" />
                      <span>general</span>
                    </div>
                    <div className="h-6 flex items-center px-2 gap-1.5 hover:bg-zinc-800/30 rounded text-zinc-400">
                      <Hash className="size-3.5 text-zinc-500" />
                      <span>announcements</span>
                    </div>
                    <div className="h-6 flex items-center justify-between px-2 hover:bg-zinc-800/30 rounded text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="size-3.5 text-emerald-400" />
                        <span>ngobrol-santai</span>
                      </div>
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                      DIRECT MESSAGES
                    </span>
                    <div className="h-6 flex items-center justify-between px-2 hover:bg-zinc-800/30 rounded text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 text-zinc-500" />
                        <span className="truncate">Haikal Al Hakim</span>
                      </div>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Main Chat Mockup Area */}
                <div className="flex-1 flex flex-col bg-zinc-950 p-4 relative justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 font-bold shrink-0">
                        HA
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">
                            Haikal Alhakim
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            10:45 AM
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">
                          Welcome to CollabSpace! Start writing messages or jump
                          into voice channels to collaborate in real-time. 🚀
                        </p>
                        {/* Emoji Reaction Pill */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                            🎉 4
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">
                            👋 2
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Mockup */}
                  <div className="h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-between px-3 text-xs text-zinc-500">
                    <span>Message #general...</span>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Smile className="size-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid Section */}
        <section
          id="features"
          className="py-20 md:py-28 bg-zinc-50 dark:bg-zinc-950"
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Designed for Focus
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Everything your team needs to stay aligned, communicate clearly,
                and get work done without the overwhelming noise.
              </p>
            </div>

            {/* Modern Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Channels & Thread Discussions (Span 2 cols on lg) */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 md:p-8 shadow-xs flex flex-col justify-between overflow-hidden relative group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-2 relative z-10 max-w-md">
                  <div className="size-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <MessageSquare className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Focused Channels & Threaded Replies
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Organize conversations by topic, project, or team. Branch
                    off into dedicated thread panels so the main channel remains
                    clean and distraction-free.
                  </p>
                </div>

                {/* Micro Visual Preview */}
                <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800/60 flex flex-col gap-2.5 bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold">
                      <Hash className="size-3.5 text-indigo-500" />{" "}
                      product-launch
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px]">
                      Active Thread
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="size-6 rounded-full bg-zinc-800 text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                      JD
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-350">
                      "Should we finalize the hero design before Friday?"
                      <div className="mt-1 text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-1">
                        💬 4 replies • Last reply 2m ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Instant Voice Huddles (Span 1 col on lg) */}
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 md:p-8 shadow-xs flex flex-col justify-between overflow-hidden relative group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-2 relative z-10">
                  <div className="size-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <Radio className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Instant Voice & Video Huddles
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Hop into drop-in rooms anytime. Share screens and talk in
                    real time without creating or sending calendar invites.
                  </p>
                </div>

                {/* Micro Visual Preview */}
                <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-950/40 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      <Volume2 className="size-3.5 text-emerald-500" /> Design
                      Review
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                      Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex -space-x-1.5">
                      <div className="size-6 rounded-full bg-emerald-500/20 border border-emerald-500 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        HK
                      </div>
                      <div className="size-6 rounded-full bg-zinc-700 border border-white dark:border-zinc-900 text-[9px] font-bold text-white flex items-center justify-center">
                        AL
                      </div>
                      <div className="size-6 rounded-full bg-zinc-800 border border-white dark:border-zinc-900 text-[9px] font-bold text-white flex items-center justify-center">
                        +2
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      Screen sharing on
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Live Team Presence */}
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-2">
                  <div className="size-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <User className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Live Team Presence
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    See who is active, in a meeting, or away at a glance so you
                    always know when teammates are available to sync.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                    Online
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span className="size-1.5 rounded-full bg-amber-500" /> Away
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <span className="size-1.5 rounded-full bg-rose-500" /> Busy
                  </span>
                </div>
              </div>

              {/* Card 4: Rich Media & Emoji Reactions */}
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-2">
                  <div className="size-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Smile className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Reactions & Media
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Send quick emoji reactions and drop multi-image previews
                    right inside messages to celebrate wins and give fast
                    feedback.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900 font-medium">
                    🔥 12
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900 font-medium">
                    🚀 8
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900 font-medium">
                    ❤️ 15
                  </span>
                  <span className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900 font-medium">
                    👍 6
                  </span>
                </div>
              </div>

              {/* Card 5: Multi-Workspace Hub */}
              <div className="bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                <div className="space-y-2">
                  <div className="size-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                    <Layers className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Multiple Workspaces
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Keep your internal company, side projects, and open
                    communities isolated with instant one-click rail navigation.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <div className="size-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-[10px]">
                    CS
                  </div>
                  <div className="size-7 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center text-[10px]">
                    HC
                  </div>
                  <div className="size-7 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[11px] text-zinc-400">
                    +
                  </div>
                  <span className="text-[11px] text-zinc-400 font-normal ml-1">
                    Switch in 1 click
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 md:py-28 bg-white dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-850"
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 space-y-12">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                How It Works
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Get your team workspace up and running in less than a minute.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Create Your Space
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Name your workspace, upload a custom logo, and configure your
                  preferred text and voice channels tailored to your workflow.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Invite Teammates
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Copy your unique invite link with a single click. Members join
                  instantly without lengthy approval queues.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-3 relative text-left">
                <div className="size-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-200">
                  Chat, Huddle & Move Fast
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  Collaborate in organized channels, jump on screen-sharing
                  huddles, and keep everyone connected wherever they are.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-850">
          <div className="max-w-4xl mx-auto px-5 md:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 md:p-14 text-center shadow-xl">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 size-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
              <div className="absolute left-0 bottom-0 -ml-16 -mb-16 size-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="relative max-w-lg mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-xs">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  Free to use • No credit card required • Instant setup
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Ready to elevate your team's workflow?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Join CollabSpace today and create a calm, focused, and
                  high-velocity workspace for your entire organization.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                  <Button
                    className="w-full sm:w-auto bg-white text-zinc-900 hover:bg-zinc-200 h-10 px-6 rounded-lg text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all"
                    asChild
                  >
                    <Link href="/sign-up">
                      Get Started Free <ArrowRight className="size-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto h-10 px-6 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/sign-in">Sign In</Link>
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
              CollabSpace
              <span className="text-indigo-500 font-extrabold">.</span>
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
