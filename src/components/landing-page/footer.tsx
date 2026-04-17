export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-6 py-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          © {year} CollabSpace. All rights reserved.
        </p>
        <nav className="flex items-center gap-5 text-xs text-zinc-400 dark:text-zinc-500">
          <a
            href="#"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
