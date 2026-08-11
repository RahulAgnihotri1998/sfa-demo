"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Invalid email or password. Please check your credentials.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "manager" || profile?.role === "admin") {
      router.push("/manager/dashboard");
    } else {
      router.push("/rep/home");
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-in relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-brand border border-gray-100 mb-4 max-w-[220px]">
            <img
              src="https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2024/07/cropped-Artboard-1.png?w=805&ssl=1"
              alt="Master Baker Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Master Baker</h1>
          <p className="text-sm text-gray-500 mt-1.5">Manager &amp; Customer Portal</p>
        </div>

        {/* Login Card */}
        <div className="card-glass p-7 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@demo.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-strip-risk text-sm py-3 px-4 rounded-xl">
                <span>⚠️ {error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="divider" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 text-center">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail("ahmed.manager@demo.com"); setPassword("Demo@1234"); }}
                className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl px-3 py-2.5 transition-colors font-medium text-left"
              >
                <span className="block text-brand-400 text-[10px] uppercase tracking-wide mb-0.5">Manager</span>
                Ahmed Al Farsi
              </button>
              <button
                type="button"
                onClick={() => { setEmail("rahul.rep@demo.com"); setPassword("Demo@1234"); }}
                className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl px-3 py-2.5 transition-colors font-medium text-left"
              >
                <span className="block text-violet-400 text-[10px] uppercase tracking-wide mb-0.5">Sales Rep</span>
                Rahul Menon
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-5">
          Powered by Supabase + Next.js 15
        </p>
      </div>
    </div>
  );
}
