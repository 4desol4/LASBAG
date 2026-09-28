export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const daysLeft = (secs: number) => (secs < 0 ? `${Math.ceil(-secs / 86400)} days overdue` : secs < 86400 ? "Due today" : `${Math.ceil(secs / 86400)} days left`);
export const devType = (t: string) => ({ RESIDENTIAL: "Residential", COMMERCIAL: "Commercial", INDUSTRIAL: "Industrial", INSTITUTIONAL: "Institutional", MIXED_USE: "Mixed-use", OTHER: "Other" }[t] ?? t);
export const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
export function timeAgo(d: string | Date) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`; if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
