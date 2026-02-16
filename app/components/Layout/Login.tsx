"use client";

import React, { useState, useEffect } from "react";
import { useGlobal } from "../Layout/context/Context";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const Login: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated, user } = useGlobal();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
      await login(formData.email, formData.password, rememberMe);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed. Try again.");
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
                  Secure Access
                </span>
                <ThemeToggle />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">
                Welcome back, operator.
              </CardTitle>
              <CardDescription className="text-base">
                Sign in to monitor and test your API fleets.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-semibold text-accent hover:text-accent/80"
                  >
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary focus:ring-2 focus:ring-ring"
                />
                Remember me for 30 days
              </label>

              <Button
                type="submit"
                className="w-full border-2 border-primary"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
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
                  text="continue_with"
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
              New here?{" "}
              <Link href="/signup" className="font-semibold text-accent">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
