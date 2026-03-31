"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserCircle2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-left shadow-float backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-neon dark:border-slate-700 dark:bg-slate-900/80"
      >
        {user.profilePicture ? (
          <Image src={user.profilePicture} alt={user.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-secondary text-sm font-semibold text-white shadow-neon">
            {initials(user.name)}
          </div>
        )}
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">{user.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{user.role}</div>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-40 w-56 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-panel backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-950/95">
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
            <UserCircle2 size={16} />
            My Profile
          </Link>
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900">
            <Settings size={16} />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
              router.push("/login");
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
