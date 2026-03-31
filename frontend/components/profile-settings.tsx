"use client";

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";
import { Camera, Save } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    organization: user?.organization ?? "",
    role: user?.role ?? "Citizen",
    profilePicture: user?.profilePicture ?? ""
  });

  const avatar = useMemo(() => form.profilePicture || user?.profilePicture || "", [form.profilePicture, user?.profilePicture]);

  if (!user) return null;

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, profilePicture: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    updateProfile(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
      <div className="glass-card-strong rounded-[32px] p-6">
        <div className="flex flex-col items-center text-center">
          {avatar ? (
            <Image src={avatar} alt={form.name} width={112} height={112} unoptimized className="h-28 w-28 rounded-full object-cover shadow-panel" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-3xl font-semibold text-white">
              {initials(form.name || user.name)}
            </div>
          )}
          <div className="mt-4 text-xl font-semibold text-slate-950">{form.name}</div>
          <div className="mt-1 text-sm text-slate-500">{form.email}</div>
          <label className="climate-button mt-5 cursor-pointer bg-slate-950 text-white hover:bg-slate-800">
            <Camera size={16} />
            Upload Profile Picture
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
      </div>

      <div className="glass-card-strong rounded-[32px] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">User Name</span>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">Email</span>
            <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">Organization</span>
            <input value={form.organization} onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-600">Role</span>
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as "Citizen" | "Government" | "Admin" }))} className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900">
              <option value="Citizen">Citizen</option>
              <option value="Government">Government</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={saveProfile} className="climate-button bg-primary text-white hover:bg-accent">
            <Save size={16} />
            Save Profile
          </button>
          {saved ? <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile saved successfully.</div> : null}
        </div>
      </div>
    </div>
  );
}
