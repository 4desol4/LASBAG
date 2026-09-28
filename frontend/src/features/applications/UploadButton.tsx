import { Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import type { Requirement } from "./api";
import { UploadDialog } from "./UploadDialog";
export function UploadButton({ req, appId, label = "Upload", variant = "secondary" }: { req: Requirement; appId: string; label?: string; variant?: "secondary" | "primary" }) {
  const [open, setOpen] = useState(false);
  return (<><Button size="sm" variant={variant} onClick={() => setOpen(true)} aria-label={`${label}: ${req.definition.name}`}><Upload className="h-4 w-4" aria-hidden />{label}</Button><UploadDialog target={{ requirementId: req.id, name: req.definition.name, documentType: req.definition.documentType ?? req.definition.name, reason: req.statusReason }} appId={appId} open={open} onClose={() => setOpen(false)} /></>);
}
