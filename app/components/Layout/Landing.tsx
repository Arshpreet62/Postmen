"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { RxRocket, RxCheckCircled } from "react-icons/rx";
import { FaLightbulb, FaLock } from "react-icons/fa";

const Landing: React.FC = () => {
  const { isAuthenticated, user } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ⚡ Postmen
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Text */}
          <div className="animate-slideInLeft space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900 dark:text-white">
                API Testing,
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Beautiful, fast, and intuitive. Postmen is the modern API
                testing platform built for developers who value their time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="btn-gradient px-8 py-4 text-white font-semibold rounded-lg inline-flex items-center justify-center"
              >
                <RxRocket className="mr-2" size={20} /> Start Testing Now
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Learn More
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="glass p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-indigo-600">100+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Users
                </div>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">10K+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Tests/Month
                </div>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-pink-600">99.9%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Uptime
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="animate-slideInRight relative hidden lg:block">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 backdrop-blur-xl border border-slate-700">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">GET</span>
                    <span className="text-slate-500 text-sm">
                      api.example.com/users
                    </span>
                  </div>
                  <div className="bg-slate-700/50 rounded p-4 space-y-2 font-mono text-sm text-slate-300">
                    <div>
                      <span className="text-green-400">Status:</span> 200 OK
                    </div>
                    <div>
                      <span className="text-green-400">Time:</span> 124ms
                    </div>
                    <div>
                      <span className="text-green-400">Size:</span> 4.2 KB
                    </div>
                  </div>
                  <div className="bg-indigo-500/20 border border-indigo-500/50 rounded p-4 text-indigo-200 text-sm">
                    ✓ All tests passed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-900 dark:text-white">
          Power-Packed Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card-hover glass p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <FaLightbulb size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Lightning Fast
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Test APIs with sub-100ms response times. Optimized for speed and
              performance.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-hover glass p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <FaLock size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Secure & Private
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your data is encrypted end-to-end. We never store your API
              responses.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-hover glass p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <RxCheckCircled size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              History & Stats
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Track request history and view detailed statistics on your API
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">
            Ready to test like a pro?
          </h2>
          <p className="text-xl text-indigo-100">
            Join hundreds of developers already using Postmen to build better
            APIs.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-slate-600 dark:text-slate-400">
            © 2026 Postmen. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link
              href="/about"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              About
            </Link>
            <a
              href="#"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
