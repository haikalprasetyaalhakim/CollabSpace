import { MessageSquare, Video, LayoutGrid, Calendar } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-time messaging",
    description:
      "Communicate instantly with your team through organized channels and direct messages.",
  },
  {
    icon: Video,
    title: "Integrated video meetings",
    description:
      "Start or schedule video calls without leaving your workspace. No extra tools needed.",
  },
  {
    icon: LayoutGrid,
    title: "Structured workspaces",
    description:
      "Organize projects, channels, and teams in a clean, intuitive workspace hierarchy.",
  },
  {
    icon: Calendar,
    title: "Scheduling & activity",
    description:
      "Track team activity, schedule meetings, and stay aligned with a unified timeline.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-stone-100 dark:bg-zinc-900 px-6 py-20 md:py-28"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Everything your team needs
          </h2>
          <p className="mt-3 text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
            A focused set of tools designed to keep remote teams productive and
            connected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border border-stone-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`p-7 flex flex-col gap-4 bg-white dark:bg-zinc-800
                  hover:bg-stone-50 dark:hover:bg-zinc-700/60 transition-colors duration-200
                  ${index % 2 === 0 ? "sm:border-r border-stone-200 dark:border-zinc-700" : ""}
                  ${index < 2 ? "border-b border-stone-200 dark:border-zinc-700" : ""}
                `}
              >
                <Icon
                  className="size-5 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.5}
                />
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
