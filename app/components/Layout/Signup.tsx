"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signup, user, isAuthenticated } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) router.push("/dashboard");
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");

    if (name === "password") {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (value.length >= 10) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }
  };

  const validate = (): boolean => {
    const { email, password, confirmPassword } = formData;
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup(formData.email.trim().toLowerCase(), formData.password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-yellow-500";
    if (passwordStrength <= 3) return "bg-orange-500";
    if (passwordStrength <= 4) return "bg-lime-500";
    return "bg-green-500";
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
            Get Started
          </h1>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Create your account and start testing APIs
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
                  Signup Failed
                </p>
                <p className="text-base font-medium text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="block text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <FaEnvelope
                  className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full input-smooth pl-12 pr-4 py-4 text-base font-medium bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onChange={handleChange}
                  value={formData.email}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="block text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <FaLock
                  className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="w-full input-smooth pl-12 pr-12 py-4 text-base font-medium bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onChange={handleChange}
                  value={formData.password}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
              {/* Password Strength Bar */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          i < passwordStrength
                            ? getStrengthColor()
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {passwordStrength <= 1 && "Weak password"}
                    {passwordStrength === 2 && "Fair password"}
                    {passwordStrength === 3 && "Good password"}
                    {passwordStrength === 4 && "Strong password"}
                    {passwordStrength === 5 && "Very strong password"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="group">
              <label className="block text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <FaLock
                  className="absolute left-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                  size={18}
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  className="w-full input-smooth pl-12 pr-12 py-4 text-base font-medium bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ Passwords match
                  </p>
                )}
            </div>

            {/* Terms */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              />
              <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                I agree to the{" "}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Privacy Policy
                </a>
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              OR
            </span>
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
          </div>

          {/* Social Login */}
          <button className="w-full py-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-slate-800 dark:text-slate-200 text-base font-semibold">
            <FcGoogle size={22} />
            Sign up with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-base font-medium text-slate-700 dark:text-slate-300 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
