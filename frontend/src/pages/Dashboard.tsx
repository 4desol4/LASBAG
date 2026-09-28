import { ClipboardPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { useAuth } from "../features/auth/AuthContext";
import { useApplication, useApplications } from "../features/applications/api";
import { CaseView } from "../features/applications/CaseView";

export const CaseSkeleton = () => <div className="space-y-5" aria-busy="true" aria-label="Loading application"><Skeleton className="h-24" /><Skeleton className="h-44" /><div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div></div>;
export function CaseLoader({ id }: { id?: string }) {
  const q = useApplication(id);
  if (q.isLoading) return <CaseSkeleton />;
  if (q.isError) return <ErrorState title="We couldn't load this application" error={q.error} onRetry={() => q.refetch()} />;
  return <CaseView app={q.data!} />;
}
export default function Dashboard() {
  const { user } = useAuth(), list = useApplications({ pageSize: 1 }), first = list.data?.items[0];
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.firstName}`} subtitle={first ? "Here's the latest status of your application." : "Your building approval journey starts here."} />
      {list.isLoading ? <CaseSkeleton /> : list.isError ? <ErrorState title="We couldn't load your dashboard" error={list.error} onRetry={() => list.refetch()} /> : first ? <CaseLoader id={first.id} /> :
        <EmptyState Icon={ClipboardPlus} title="No applications yet" body="Tell us about your development and LASBAG will show you exactly what you need." action={<Link to="/applications/new"><Button>Start application</Button></Link>} />}
    </div>);
}
