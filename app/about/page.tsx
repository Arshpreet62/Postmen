import Link from "next/link";
import { RxGithubLogo, RxTarget, RxHeart } from "react-icons/rx";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ⚡ Postmen
          </Link>
          <Link href="/" className="px-4 py-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors">
            Back Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-20 animate-fadeInUp">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            About Postmen
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            A modern API testing tool built by developers, for developers.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20 glass rounded-2xl p-12">
          <div className="flex items-start gap-4 mb-6">
            <RxTarget className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                We believe that API testing should be simple, beautiful, and efficient. Postmen was created to eliminate the friction in API development. Whether you're building a microservice, integrating third-party APIs, or debugging a production issue, Postmen provides the tools you need without the bloat.
              </p>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">
            Why Postmen?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-xl space-y-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lightning Fast</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Optimized for speed. Get responses in milliseconds, not seconds.
              </p>
            </div>

            <div className="glass p-8 rounded-xl space-y-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                🎨
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Beautiful UI</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Modern design that feels intuitive and delightful to use every day.
              </p>
            </div>

            <div className="glass p-8 rounded-xl space-y-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                🔒
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your data is private. We use end-to-end encryption and never store responses.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-20 glass rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Built With Modern Tech
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["Next.js", "React 19", "TypeScript", "Tailwind CSS", "MongoDB", "JWT Auth", "Mongoose", "Vercel"].map((tech) => (
              <div key={tech} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* Love Section */}
        <section className="text-center space-y-8">
          <div className="flex items-center justify-center gap-3 text-2xl">
            <span>Made with</span>
            <RxHeart className="w-8 h-8 text-red-500 animate-pulse" />
            <span>by developers</span>
          </div>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Postmen is open-source and community-driven. We're committed to building the best API testing experience possible.
          </p>

          <div className="flex justify-center gap-6">
            <a href="https://github.com/Arshpreet62/Postmen" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-transform font-semibold">
              <RxGithubLogo size={20} />
              View on GitHub
            </a>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-slate-600 dark:text-slate-400">
          © 2026 Postmen. Built by developers, for developers.
        </div>
      </footer>
    </div>
  );
}
