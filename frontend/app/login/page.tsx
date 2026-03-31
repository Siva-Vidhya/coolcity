"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("admin@coolcity.ai");
  const [password, setPassword] = useState("coolcity123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(next || "/dashboard");
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(nextPath);
    }
  }, [nextPath, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await login({ email, password, remember });
    if (!result.ok) {
      setError(result.error ?? "Unable to login.");
      return;
    }
    router.push(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-400 to-green-400 px-6 py-10 dark:from-slate-900 dark:via-teal-900 dark:to-slate-800">
      <div className="w-full max-w-md rounded-[32px] border border-white/30 bg-white/85 p-8 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/90">
        <div className="text-sm uppercase tracking-[0.28em] text-primary">CoolCity Login</div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-100">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Access your climate intelligence workspace.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>

          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-primary" />
              Remember me
            </label>
            <span>Forgot password?</span>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <button type="submit" className="climate-button w-full justify-center bg-slate-950 text-white hover:bg-slate-800">
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          New to CoolCity? <Link href="/signup" className="font-semibold text-primary">Create account</Link>
        </div>
      </div>
    </main>
  );
}
