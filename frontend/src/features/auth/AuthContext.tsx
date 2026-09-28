import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../lib/api";
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "APPLICANT" | "PROFESSIONAL" | "MDA_OFFICER" | "ADMIN" | "SUPER_ADMIN";
}
interface Ctx {
  user: SessionUser | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<SessionUser>;
  register: (b: Record<string, unknown>) => Promise<SessionUser>;
  logout: () => Promise<void>;
}
const AuthCtx = createContext<Ctx | null>(null);
export const homeFor = (r: SessionUser["role"]) =>
  r === "MDA_OFFICER"
    ? "/mda"
    : r === "ADMIN" || r === "SUPER_ADMIN"
      ? "/admin"
      : "/dashboard";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get<SessionUser | null>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const u = await api.post<SessionUser>("/auth/login", { email, password });
    setUser(u);
    return u;
  }, []);
  const register = useCallback(async (b: Record<string, unknown>) => {
    const u = await api.post<SessionUser>("/auth/register", b);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);
  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};
