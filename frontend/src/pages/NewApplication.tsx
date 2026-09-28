import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building,
  Building2,
  Factory,
  Home,
  Landmark,
  MoreHorizontal,
  Send,
  Bot,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "../components/ui/Button";
import { Card, PageHeader } from "../components/ui/primitives";
import { api } from "../lib/api";
import { useApplication, useChecklist } from "../features/applications/api";

type A = Record<string, unknown>;
const types = [
  ["RESIDENTIAL", "Residential", "bungalow, duplex, apartment", Home],
  ["COMMERCIAL", "Commercial", "office, mall, shop", Building2],
  ["INDUSTRIAL", "Industrial", "factory, warehouse", Factory],
  [
    "INSTITUTIONAL",
    "Institutional",
    "school, hospital, place of worship",
    Landmark,
  ],
  ["MIXED_USE", "Mixed-use", "commercial + residential", Building],
  ["OTHER", "Other", "specify later", MoreHorizontal],
] as const;
const yn = [
  [true, "Yes"],
  [false, "No"],
] as const;
const Q = [
  {
    key: "developmentType",
    ask: "What type of building are you constructing?",
  },
  {
    key: "location",
    ask: "Where is the site? Enter the plot number and street or area.",
  },
  {
    key: "floors",
    ask: "How many floors will the building have, including the ground floor?",
  },
  {
    key: "isNewDevelopment",
    ask: "Is this a new building?",
    opts: [
      [true, "New building"],
      [false, "Extension or alteration"],
    ],
  },
  {
    key: "nearWaterOrDrainage",
    ask: "Is the plot close to a lagoon, canal or drainage channel?",
    opts: yn,
  },
  {
    key: "nearAirport",
    ask: "Is the plot close to an airport or under a flight path?",
    opts: yn,
  },
] as const;

export default function NewApplication() {
  const nav = useNavigate();
  const draftId = useSearchParams()[0].get("draft") ?? undefined;
  const draft = useApplication(draftId);
  const [answers, setAnswers] = useState<A>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<{ from: "ai" | "me"; text: string }[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [typing, setTyping] = useState(false);
  const checklist = useChecklist(answers);
  useEffect(() => {
    if (draft.data?.project?.answers)
      setAnswers((a) => ({ ...draft.data!.project!.answers, ...a }));
  }, [draft.data]);
  const idx = Q.findIndex((q) => answers[q.key] === undefined);
  const done = idx === -1;
  const q = done ? null : Q[idx];
  useEffect(() => {
    end.current?.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [log, idx, typing]);
  const answer = (value: unknown, label: string) => {
    if (!q) return;
    setLog((l) => [
      ...l,
      { from: "ai", text: q.ask },
      { from: "me", text: label },
    ]);
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setText("");
    setTyping(true);
    setTimeout(() => setTyping(false), reduce ? 150 : 800);
  };
  const submitText = () => {
    const v = text.trim();
    if (!v) return;
    if (q?.key === "floors") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 200)
        return setErr("Enter a whole number between 1 and 200.");
      setErr(null);
      answer(n, `${n} ${n === 1 ? "floor" : "floors"}`);
    } else answer(v, v);
  };
  const proceed = async () => {
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        nearWaterOrDrainage: false,
        nearAirport: false,
        ...answers,
      };
      let id = draftId;
      if (!id)
        id = (
          await api.post<{ id: string }>("/applications", {
            title: `Proposed ${types.find((t) => t[0] === answers.developmentType)?.[1] ?? ""} Development`,
            siteAddress: String(answers.location ?? ""),
            answers: {},
          })
        ).id;
      await api.patch(`/applications/${id}`, {
        siteAddress: String(answers.location ?? ""),
        answers: { ...payload, location: String(answers.location) },
      });
      nav(`/applications/${id}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="New application · LASBAG AI"
        title="Let's get started"
        subtitle="For applicants and building professionals. Answer six guided questions and the rules engine builds your project-specific checklist; this is not an open-ended chatbot."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex min-h-[520px] flex-col p-4 md:p-5">
          <div className="flex items-center gap-3 border-b border-surface-line pb-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-lagos-100 text-lagos-700">
              <Bot className="h-5 w-5" aria-hidden />
            </span>
            <p className="font-bold">
              LASBAG AI{" "}
              <span className="ml-1 rounded-sm bg-lagos-100 px-1.5 py-0.5 text-xs text-lagos-800">
                Beta
              </span>
            </p>
          </div>
          <div
            className="flex-1 space-y-3 overflow-y-auto py-4"
            aria-live="polite"
          >
            <Bubble from="ai">
              Hello! I'm LASBAG AI. I'll ask a few quick questions to understand
              your project and generate a personalised requirements checklist.
            </Bubble>
            {log.map((m, i) => (
              <Bubble key={i} from={m.from}>
                {m.text}
              </Bubble>
            ))}
            {typing && <Typing />}
            {q && !typing && (
              <Bubble from="ai" strong>
                {q.ask}
              </Bubble>
            )}
            {done && !typing && (
              <Bubble from="ai" ok>
                Thanks. Your checklist is ready. Continue to add your documents.
              </Bubble>
            )}
            <div ref={end} />
          </div>
          {!typing && q?.key === "developmentType" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {types.map(([v, l, d, Icon]) => (
                <button
                  key={v}
                  onClick={() => answer(v, l)}
                  className="flex items-center gap-3 rounded border border-surface-line p-3 text-left transition-colors hover:border-lagos-700 hover:bg-lagos-50"
                >
                  <Icon
                    className="h-5 w-5 shrink-0 text-navy-700"
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-bold">{l}</span>
                    <span className="text-xs text-ink-soft">{d}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!typing && q && "opts" in q && (
            <div className="flex flex-wrap gap-2">
              {q.opts.map(([v, l]) => (
                <button
                  key={l}
                  onClick={() => answer(v, l)}
                  className="rounded border border-surface-line px-4 py-2.5 text-sm font-semibold transition-colors hover:border-lagos-700 hover:bg-lagos-50"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {!typing && q && (q.key === "location" || q.key === "floors") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitText();
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="reply">
                Your answer
              </label>
              <input
                id="reply"
                value={text}
                onChange={(e) => setText(e.target.value)}
                inputMode={q.key === "floors" ? "numeric" : "text"}
                placeholder="Type your response"
                className="h-11 flex-1 rounded border border-surface-line px-3"
              />
              <Button
                type="submit"
                aria-label="Send answer"
                className="w-11 !px-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
          {err && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {err}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-ink-faint">
            LASBAG AI may make mistakes. Please verify important information.
          </p>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-h3 text-navy-900">Your requirements</h2>
            <p className="text-sm text-ink-soft">Customised as you answer.</p>
            {!checklist.data?.length ? (
              <p className="mt-4 rounded bg-lagos-50 p-4 text-sm text-lagos-800">
                Answer the first question and your personalised checklist
                appears here.
              </p>
            ) : (
              <ul
                className="mt-3 divide-y divide-surface-line"
                aria-live="polite"
              >
                <AnimatePresence initial={false}>
                  {checklist.data.map((r, i) => (
                    <motion.li
                      key={r.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{
                        delay: reduce ? 0 : Math.min(i, 8) * 0.04,
                        duration: 0.3,
                      }}
                      className="flex items-center gap-3 py-3 text-sm"
                    >
                      <FileText
                        className="h-4 w-4 shrink-0 text-navy-500"
                        aria-hidden
                      />
                      {r.name}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Card>
          <Button
            className="w-full"
            size="lg"
            disabled={!done}
            loading={busy}
            onClick={proceed}
          >
            {done ? "Continue" : "Answer the questions to continue"}
            {done && <CheckCircle2 className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  from,
  children,
  strong,
  ok,
}: {
  from: "ai" | "me";
  children: React.ReactNode;
  strong?: boolean;
  ok?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.p
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "max-w-[88%] rounded-2xl p-3.5 text-sm",
        from === "me"
          ? "ml-auto rounded-br-md bg-lagos-700 text-white"
          : ok
            ? "rounded-bl-md bg-lagos-50 font-medium text-lagos-800"
            : "rounded-bl-md bg-surface-muted",
        strong && "font-medium",
      )}
    >
      {children}
    </motion.p>
  );
}
function Typing() {
  const reduce = useReducedMotion();
  return (
    <p
      role="status"
      aria-label="LASBAG AI is typing"
      className="inline-flex gap-1.5 rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3.5"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-navy-500"
          animate={
            reduce ? undefined : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
        />
      ))}
    </p>
  );
}
