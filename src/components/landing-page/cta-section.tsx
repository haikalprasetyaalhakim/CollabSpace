import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="bg-stone-100 dark:bg-zinc-900 px-6 py-24 md:py-32">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ready to bring your team together?
        </h2>
        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
          Start for free. No credit card required.
        </p>
        <Button className="mt-1 bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 border-0 shadow-none px-6 h-11 text-sm font-medium transition-colors">
          Get Started <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </section>
  );
}
