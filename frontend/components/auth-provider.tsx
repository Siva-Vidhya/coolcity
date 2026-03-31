"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type UserRole = "Citizen" | "Government" | "Admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  organization?: string;
  role: UserRole;
  profilePicture?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (params: { email: string; password: string; remember: boolean }) => Promise<{ ok: boolean; error?: string }>;
  signup: (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<AuthUser, "name" | "email" | "organization" | "profilePicture" | "role">>) => void;
};

const USERS_KEY = "coolcity-auth-users";
const SESSION_KEY = "coolcity-auth-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const seededUsers: AuthUser[] = [
  {
    id: "seed-admin",
    name: "CoolCity Admin",
    email: "admin@coolcity.ai",
    password: "coolcity123",
    organization: "CoolCity",
    role: "Admin"
  }
];

function readUsers(): AuthUser[] {
  if (typeof window === "undefined") return seededUsers;
  const stored = window.localStorage.getItem(USERS_KEY);
  if (!stored) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }

  try {
    return JSON.parse(stored) as AuthUser[];
  } catch {
    return seededUsers;
  }
}

function writeUsers(users: AuthUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
}

function writeSession(user: AuthUser, remember: boolean) {
  const payload = JSON.stringify(user);
  if (remember) {
    window.localStorage.setItem(SESSION_KEY, payload);
    window.sessionStorage.removeItem(SESSION_KEY);
  } else {
    window.sessionStorage.setItem(SESSION_KEY, payload);
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const users = readUsers();
    if (!window.localStorage.getItem(USERS_KEY)) {
      writeUsers(users);
    }

    const session = readSession();
    if (session) {
      try {
        setUser(JSON.parse(session) as AuthUser);
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async ({ email, password, remember }) => {
        const users = readUsers();
        const existing = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
        if (!existing || existing.password !== password) {
          return { ok: false, error: "Invalid email or password." };
        }

        writeSession(existing, remember);
        setUser(existing);
        return { ok: true };
      },
      signup: async ({ name, email, password, confirmPassword, role }) => {
        if (password !== confirmPassword) {
          return { ok: false, error: "Passwords do not match." };
        }

        const users = readUsers();
        if (users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
          return { ok: false, error: "An account with this email already exists." };
        }

        const nextUser: AuthUser = {
          id: crypto.randomUUID(),
          name,
          email,
          password,
          role
        };

        const nextUsers = [...users, nextUser];
        writeUsers(nextUsers);
        writeSession(nextUser, true);
        setUser(nextUser);
        return { ok: true };
      },
      logout: () => {
        clearSession();
        setUser(null);
      },
      updateProfile: (updates) => {
        if (!user) return;
        const nextUser = { ...user, ...updates };
        setUser(nextUser);

        const users = readUsers().map((item) => (item.id === user.id ? nextUser : item));
        writeUsers(users);

        if (window.localStorage.getItem(SESSION_KEY)) {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        }
        if (window.sessionStorage.getItem(SESSION_KEY)) {
          window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        }
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
