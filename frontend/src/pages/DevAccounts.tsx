import { useState } from "react";
import { ArrowLeft, Check, Copy, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

const accounts = [
  {
    email: "applicant.start@lasbag-demo.local",
    role: "Applicant",
    state: "Draft application",
  },
  {
    email: "applicant.stage5@lasbag-demo.local",
    role: "Applicant",
    state: "Authorization to commence",
  },
  {
    email: "applicant.laststage@lasbag-demo.local",
    role: "Applicant",
    state: "Completion review",
  },
  {
    email: "applicant.completed@lasbag-demo.local",
    role: "Applicant",
    state: "Completed application",
  },
  {
    email: "applicant.actionrequired@lasbag-demo.local",
    role: "Applicant",
    state: "Action required",
  },
  {
    email: "officer@lasbag-demo.local",
    role: "MDA officer",
    state: "LASPPPA queue",
  },
  {
    email: "officer.lirs@lasbag-demo.local",
    role: "MDA officer",
    state: "LIRS queue",
  },
  {
    email: "officer.lasbca@lasbag-demo.local",
    role: "MDA officer",
    state: "LASBCA queue",
  },
  {
    email: "professional.architect@lasbag-demo.local",
    role: "Professional",
    state: "Architect profile",
  },
  {
    email: "professional.engineer@lasbag-demo.local",
    role: "Professional",
    state: "Engineer profile",
  },
  { email: "admin@lasbag-demo.local", role: "Admin", state: "Admin dashboard" },
  {
    email: "superadmin@lasbag-demo.local",
    role: "Super admin",
    state: "Full admin access",
  },
];

export default function DevAccounts() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const password = import.meta.env.VITE_DEMO_PASSWORD;

  async function copyCredentials(email: string) {
    try {
      await navigator.clipboard.writeText(
        `Email: ${email}\nPassword: ${password}`,
      );
      setCopied(email);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-10 text-ink sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-lagos-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Home
        </Link>
        <header className="mt-8 border-b border-surface-line pb-6">
          <p className="text-sm font-semibold uppercase text-lagos-700">
            Local development
          </p>
          <h1 className="mt-2 font-display text-h1 text-navy-950">
            Seed accounts
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Use these accounts to explore the seeded applicant, agency,
            professional, and administrator views.
          </p>
        </header>

        <section
          aria-label="Development-only warning"
          className="mt-6 flex gap-3 border-l-4 border-gold-500 bg-gold-100 p-4 text-sm text-navy-950"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            Development credentials only. They are not included in production
            builds. Do not reuse these passwords or expose this development
            server publicly.
          </p>
        </section>

        <section className="mt-8" aria-labelledby="credentials-heading">
          <h2
            id="credentials-heading"
            className="text-lg font-bold text-navy-950"
          >
            Shared password
          </h2>
          {password ? (
            <code className="mt-2 inline-block select-all rounded border border-surface-line bg-white px-3 py-2 font-mono text-sm">
              {password}
            </code>
          ) : (
            <p className="mt-2 text-sm text-danger">
              Set VITE_DEMO_PASSWORD in frontend/.env.
            </p>
          )}
        </section>

        <section className="mt-8" aria-label="Seeded users">
          <ul className="divide-y divide-surface-line border-y border-surface-line">
            {accounts.map((account) => (
              <li
                key={account.email}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_10rem_12rem_auto] sm:items-center"
              >
                <code className="break-all text-sm font-semibold text-navy-950">
                  {account.email}
                </code>
                <span className="text-sm text-ink-soft">{account.role}</span>
                <span className="text-sm text-ink-soft">{account.state}</span>
                <button
                  type="button"
                  onClick={() => void copyCredentials(account.email)}
                  disabled={!password}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-surface-line bg-white px-3 text-sm font-semibold text-navy-900 hover:bg-lagos-50 disabled:opacity-50"
                  aria-label={`Copy credentials for ${account.email}`}
                >
                  {copied === account.email ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                  {copied === account.email ? "Copied" : "Copy login"}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-4 text-sm text-ink-soft">
          {accounts.length} seeded users
        </p>
        {copyFailed && (
          <p role="status" className="mt-2 text-sm text-danger">
            Clipboard access was denied. Select and copy the email and password
            manually.
          </p>
        )}
      </div>
    </main>
  );
}
