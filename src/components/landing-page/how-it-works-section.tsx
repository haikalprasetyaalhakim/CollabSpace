const steps = [
  {
    number: "01",
    title: "Create a workspace",
    description:
      "Set up your team workspace in seconds. Invite members by email.",
  },
  {
    number: "02",
    title: "Collaborate instantly",
    description:
      "Chat in channels, share files, and stay connected in real time.",
  },
  {
    number: "03",
    title: "Stay aligned",
    description:
      "Schedule meetings, track activity, and keep everyone on the same page.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white dark:bg-zinc-950 px-6 py-20 md:py-28"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 md:mb-18">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Get started in minutes
          </h2>
          <p className="mt-3 text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            No complex setup. No bloated features. Just what your team needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-zinc-200 dark:text-zinc-800 leading-none">
                {step.number}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
