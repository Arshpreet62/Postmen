"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGlobal } from "./context/Context";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

  const { signup, loginWithGoogle, user, isAuthenticated } = useGlobal();
  const router = useRouter();
  const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) {
      setError("Google sign-in failed. Try again.");
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(credential);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Try again.");
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,224,255,0.2),transparent_60%)]" />
      <div className="absolute -top-24 left-1/2 h-64 w-xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,255,170,0.24),transparent_60%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
        <Card className="w-full max-w-xl border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg font-semibold tracking-wide">
                POSTMEN
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  New Operator
                </span>
                <ThemeToggle />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">
                Start your control room.
              </CardTitle>
              <CardDescription className="text-base">
                Create an account and ship cleaner API runs.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Email address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    onChange={handleChange}
                    value={formData.email}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    onChange={handleChange}
                    value={formData.password}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i < passwordStrength
                              ? getStrengthColor()
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {passwordStrength <= 1 && "Weak password"}
                      {passwordStrength === 2 && "Fair password"}
                      {passwordStrength === 3 && "Good password"}
                      {passwordStrength === 4 && "Strong password"}
                      {passwordStrength === 5 && "Very strong password"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    onChange={handleChange}
                    value={formData.confirmPassword}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    disabled={loading}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <FaEyeSlash size={16} />
                    ) : (
                      <FaEye size={16} />
                    )}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs uppercase tracking-wide text-destructive">
                      Passwords do not match
                    </p>
                  )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      Passwords match
                    </p>
                  )}
              </div>

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary focus:ring-2 focus:ring-ring"
                />
                I agree to the
                <a
                  href="#"
                  className="font-semibold text-accent hover:text-accent/80"
                >
                  Terms of Service
                </a>
                and
                <a
                  href="#"
                  className="font-semibold text-accent hover:text-accent/80"
                >
                  Privacy Policy
                </a>
              </label>

              <Button
                type="submit"
                className="w-full border-2 border-primary"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <Separator className="flex-1" />
              or
              <Separator className="flex-1" />
            </div>

            {googleEnabled ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(response) =>
                    handleGoogleLogin(response.credential)
                  }
                  onError={() => setError("Google sign-in failed. Try again.")}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  width={360}
                />
              </div>
            ) : (
              <Button variant="outline" disabled className="w-full gap-2">
                <FcGoogle size={18} />
                Google sign-in not configured
              </Button>
            )}
          </CardContent>
          <CardContent className="pt-0">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-accent">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
