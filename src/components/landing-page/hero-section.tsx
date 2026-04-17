import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-28 md:py-36 bg-white dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-zinc-50">
          All your team communication.{" "}
          <span className="text-zinc-400 dark:text-zinc-500">
            One calm workspace.
          </span>
        </h1>

        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
          Chat, meet, and organize — without the noise. CollabSpace brings your
          remote team together in a focused,{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            minimal environment.
          </span>
        </p>

        <div className="flex items-center gap-3 mt-2">
          <Button className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none px-5 h-10 text-sm font-medium transition-colors">
            Get Started <ArrowRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            className="px-5 h-10 text-sm font-medium text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none"
          >
            View demo
          </Button>
        </div>
      </div>
    </section>
  );
}
