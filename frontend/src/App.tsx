import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { Skeleton } from "./components/ui/primitives";
import { useAuth, type SessionUser } from "./features/auth/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
const Dashboard = lazy(() => import("./pages/Dashboard")),
  ApplicationsList = lazy(() => import("./pages/ApplicationsList")),
  ApplicationDetailPage = lazy(() => import("./pages/ApplicationDetailPage")),
  NewApplication = lazy(() => import("./pages/NewApplication"));
const MdaQueue = lazy(() => import("./pages/MdaQueue")),
  MdaReview = lazy(() => import("./pages/MdaReview"));
const Notifications = lazy(() => import("./pages/Notifications")),
  Messages = lazy(() => import("./pages/Messages")),
  Documents = lazy(() => import("./pages/Documents")),
  Track = lazy(() => import("./pages/Track")),
  Help = lazy(() => import("./pages/Help")),
  AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Landing = lazy(() => import("./pages/Landing")),
  Login = lazy(() => import("./pages/Login")),
  Register = lazy(() => import("./pages/Register"));
const DevAccounts = import.meta.env.DEV
  ? lazy(() => import("./pages/DevAccounts"))
  : null;

/** Role gate. The API enforces the same rules; this only avoids showing screens a user can't use. */
function Protected({ roles }: { roles?: SessionUser["role"][] }) {
  const { user, loading } = useAuth(),
    loc = useLocation();
  if (loading)
    return (
      <div className="p-10">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
const Fallback = (
  <div className="mx-auto max-w-7xl p-10">
    <Skeleton className="h-10 w-2/3" />
  </div>
);
export function App() {
  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="/track" element={<Track />} />
          <Route path="/help" element={<Help />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {DevAccounts && (
          <Route path="/dev/accounts" element={<DevAccounts />} />
        )}
        <Route element={<Protected roles={["APPLICANT", "PROFESSIONAL"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/applications" element={<ApplicationsList />} />
            <Route path="/applications/new" element={<NewApplication />} />
            <Route
              path="/applications/:id"
              element={<ApplicationDetailPage />}
            />
            <Route path="/documents" element={<Documents />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Route>
        <Route
          element={
            <Protected roles={["MDA_OFFICER", "ADMIN", "SUPER_ADMIN"]} />
          }
        >
          <Route element={<AppLayout />}>
            <Route
              path="/mda"
              element={<Navigate to="/mda/applications" replace />}
            />
            <Route path="/mda/applications" element={<MdaQueue />} />
            <Route path="/mda/applications/:id" element={<MdaReview />} />
          </Route>
        </Route>
        <Route element={<Protected roles={["ADMIN", "SUPER_ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
