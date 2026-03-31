"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Citizen" as "Citizen" | "Government" | "Admin"
  });
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signup(form);
    if (!result.ok) {
      setError(result.error ?? "Unable to create account.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-500 via-cyan-400 to-green-400 px-6 py-10 dark:from-slate-900 dark:via-teal-900 dark:to-slate-800">
      <div className="w-full max-w-lg rounded-[32px] border border-white/30 bg-white/85 p-8 shadow-panel backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/90">
        <div className="text-sm uppercase tracking-[0.28em] text-primary">Create account</div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-100">Join CoolCity</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Build cooler cities as a citizen, government team, or admin.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Name</span>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Email</span>
            <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Password</span>
            <input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Confirm Password</span>
            <input type="password" value={form.confirmPassword} onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Role</span>
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as "Citizen" | "Government" | "Admin" }))} className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900">
              <option value="Citizen">Citizen</option>
              <option value="Government">Government</option>
              <option value="Admin">Admin</option>
            </select>
          </label>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">{error}</div> : null}

          <button type="submit" className="climate-button md:col-span-2 w-full justify-center bg-slate-950 text-white hover:bg-slate-800">
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account? <Link href="/login" className="font-semibold text-primary">Login</Link>
        </div>
      </div>
    </main>
  );
}
