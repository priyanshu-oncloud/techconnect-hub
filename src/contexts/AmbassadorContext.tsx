import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { app, database } from "@/firebase";

/**
 * Ambassador portal runs on its OWN Firebase auth instance so it stays
 * fully isolated from the admin session (like a separate app).
 */
const AMB_APP_NAME = "ambassador-portal";
const ambApp = getApps().find((a) => a.name === AMB_APP_NAME)
  ? getApp(AMB_APP_NAME)
  : initializeApp(app.options, AMB_APP_NAME);
export const ambassadorAuth = getAuth(ambApp);

export interface AmbassadorProfile {
  fullName: string;
  email: string;
  college?: string;
  phone?: string;
  referralCode: string;
  referrals?: number;
  successfulRegistrations?: number;
  status?: string;
  createdAt?: string;
}

interface Ctx {
  user: User | null;
  profile: AmbassadorProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    college: string;
    phone: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AmbassadorContext = createContext<Ctx | undefined>(undefined);

const makeCode = (name: string) =>
  `NG${name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

export const AmbassadorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: User) => {
    const snap = await get(ref(database, `ambassadors/${u.uid}`));
    setProfile(snap.exists() ? (snap.val() as AmbassadorProfile) : null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(ambassadorAuth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await loadProfile(u);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login: Ctx["login"] = async (email, password) => {
    try {
      await signInWithEmailAndPassword(ambassadorAuth, email, password);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message?.replace("Firebase: ", "") || "Login failed" };
    }
  };

  const signup: Ctx["signup"] = async ({ fullName, email, password, college, phone }) => {
    try {
      const cred = await createUserWithEmailAndPassword(ambassadorAuth, email, password);
      const data: AmbassadorProfile = {
        fullName,
        email,
        college,
        phone,
        referralCode: makeCode(fullName || email),
        referrals: 0,
        successfulRegistrations: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      await set(ref(database, `ambassadors/${cred.user.uid}`), data);
      setProfile(data);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message?.replace("Firebase: ", "") || "Signup failed" };
    }
  };

  const logout = async () => {
    await signOut(ambassadorAuth);
  };

  const refresh = async () => {
    if (ambassadorAuth.currentUser) await loadProfile(ambassadorAuth.currentUser);
  };

  return (
    <AmbassadorContext.Provider
      value={{ user, profile, loading, login, signup, logout, refresh }}
    >
      {children}
    </AmbassadorContext.Provider>
  );
};

export const useAmbassador = () => {
  const ctx = useContext(AmbassadorContext);
  if (!ctx) throw new Error("useAmbassador must be used within AmbassadorProvider");
  return ctx;
};
