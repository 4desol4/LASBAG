import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/ui/primitives";
import { CaseLoader } from "./Dashboard";
export default function ApplicationDetailPage() {
  const { id } = useParams();
  return <div className="space-y-6"><Link to="/applications" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lagos-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />All applications</Link><PageHeader title="Application" /><CaseLoader id={id} /></div>;
}
