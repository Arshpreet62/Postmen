"use client";

import React, { useState, useEffect } from "react";
import { useGlobal } from "../Layout/context/Context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useGlobal();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) router.push("/dashboard");
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Both fields are required");
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-400 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-32 left-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <Link href="/" className="inline-block mb-6">
            <div className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ⚡
            </div>
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Sign in to access your API testing dashboard
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl border-2 border-slate-300 dark:border-slate-600 animate-fadeInUp">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-5 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg flex items-start gap-3">
              <span className="text-red-600 dark:text-red-400 text-2xl mt-1">
                ⚠️
              </span>
              <div>
                <p className="text-lg font-bold text-red-800 dark:text-red-300">
                  Login Failed
                </p>
                <p className="text-base font-medium text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="block text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <FaEnvelope
                  className="absolute left-4 text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full input-smooth pl-12 pr-4 py-4 text-base font-medium bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  onChange={handleChange}
                  value={formData.email}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-base font-bold text-slate-800 dark:text-slate-200">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <FaLock
                  className="absolute left-4 text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="w-full input-smooth pl-12 pr-12 py-4 text-base font-medium bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  onChange={handleChange}
                  value={formData.password}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash size={16} />
                  ) : (
                    <FaEye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-400 dark:border-slate-500 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              />
              <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                Remember me for 30 days
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-4 text-white text-lg font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <FaLock size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              OR
            </span>
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
          </div>

          {/* Social Login */}
          <button className="w-full py-4 text-base border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
            <FcGoogle size={24} />
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 dark:text-slate-300 text-base font-medium mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
