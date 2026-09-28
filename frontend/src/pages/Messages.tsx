import { ArrowLeft, MessageSquarePlus, MessagesSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clsx } from "clsx";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../features/auth/AuthContext";
import { useApplications } from "../features/applications/api";
import { useConversation, useConversations, useSendMessage } from "../features/messages/api";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";

function Thread({ id }: { id: string }) {
  const q = useConversation(id), send = useSendMessage(id), [text, setText] = useState(""), end = useRef<HTMLDivElement>(null), toast = useToast();
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, [q.data?.messages.length]);
  if (q.isLoading) return <div className="space-y-3 p-4" aria-busy="true"><Skeleton className="h-14 w-2/3" /><Skeleton className="ml-auto h-14 w-1/2" /><Skeleton className="h-14 w-3/5" /></div>;
  if (q.isError) return <div className="p-4"><ErrorState title="We couldn't open this conversation" error={q.error} onRetry={() => q.refetch()} /></div>;
  const c = q.data!;
  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <div className="border-b border-surface-line p-4"><Link to="/messages" className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-lagos-700 lg:hidden"><ArrowLeft className="h-4 w-4" aria-hidden />All messages</Link><h2 className="text-h3 text-navy-900">{c.subject}</h2><p className="text-sm text-ink-soft">{c.reference}{c.projectTitle ? ` · ${c.projectTitle}` : ""}</p></div>
      <ul className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-label="Messages">
        {!c.messages.length && <li className="text-center text-sm text-ink-soft">No messages yet. Write the first one below.</li>}
        {c.messages.map((m) => (
          <li key={m.id} className={clsx("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.mine ? "ml-auto rounded-br-md bg-lagos-700 text-white" : m.isSystem ? "rounded-bl-md bg-gold-100 text-navy-900" : "rounded-bl-md bg-surface-muted text-ink")}>
            {!m.mine && <p className="mb-0.5 text-xs font-bold">{m.sender}</p>}<p className="whitespace-pre-wrap break-words">{m.body}</p><p className={clsx("mt-1 text-[0.7rem]", m.mine ? "text-white/80" : "text-ink-faint")}>{timeAgo(m.createdAt)}</p></li>))}
        <div ref={end} />
      </ul>
      <form className="flex gap-2 border-t border-surface-line p-3" onSubmit={(e) => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b, { onSuccess: () => setText(""), onError: (er) => toast("error", (er as Error).message) }); }}>
        <label className="sr-only" htmlFor="msg">Write a message</label><textarea id="msg" rows={1} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Write a message" className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-surface-line px-3 py-2.5" />
        <Button type="submit" loading={send.isPending} aria-label="Send message" className="w-11 !px-0"><Send className="h-4 w-4" aria-hidden /></Button></form>
    </div>);
}

function NewConversation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const apps = useApplications({ pageSize: 50 }), nav = useNavigate(), [sel, setSel] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const go = async () => { setBusy(true); setErr(null); try { const c = await api.post<{ id: string }>(`/applications/${sel}/conversation`); onClose(); nav(`/messages/${c.id}`); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); } };
  return (
    <Dialog open={open} onClose={onClose} title="New conversation" description="Choose the application you want to write about.">
      <label className="block text-sm font-semibold">Application<select data-autofocus value={sel} onChange={(e) => setSel(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-surface-line bg-white px-2 font-normal"><option value="">Choose one</option>{apps.data?.items.map((a) => <option key={a.id} value={a.id}>{a.reference} · {a.project?.title}</option>)}</select></label>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
      <div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!sel} loading={busy} onClick={go}>Open conversation</Button></div>
    </Dialog>);
}

/** Two panes on lg and up; list then thread on smaller screens. */
export default function Messages() {
  const { id } = useParams(), list = useConversations(), { user } = useAuth(), [dialog, setDialog] = useState(false), canStart = user?.role === "APPLICANT" || user?.role === "PROFESSIONAL";
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="Talk to the agencies about your application in one place." action={canStart ? <Button onClick={() => setDialog(true)}><MessageSquarePlus className="h-4 w-4" aria-hidden />New conversation</Button> : undefined} />
      {list.isLoading ? <Skeleton className="h-96" /> : list.isError ? <ErrorState title="We couldn't load your messages" error={list.error} onRetry={() => list.refetch()} />
        : !list.data!.items.length ? <EmptyState Icon={MessagesSquare} title="No conversations yet" body={canStart ? "Start one from your application and the agencies will reply here." : "Conversations appear when an applicant writes to your agency."} action={canStart ? <Button onClick={() => setDialog(true)}>New conversation</Button> : undefined} />
        : <Card className="grid overflow-hidden lg:grid-cols-[22rem_1fr]">
          <ul aria-label="Conversations" className={clsx("divide-y divide-surface-line lg:block lg:border-r lg:border-surface-line", id && "hidden")}>{list.data!.items.map((c) => (
            <li key={c.id}><Link to={`/messages/${c.id}`} aria-current={c.id === id ? "page" : undefined} className={clsx("block min-h-16 p-4 transition-colors hover:bg-lagos-50/70", c.id === id && "bg-lagos-50")}>
              <span className="flex items-start justify-between gap-2"><span className={clsx("truncate text-navy-900", c.unread ? "font-bold" : "font-semibold")}>{c.reference}</span>{c.lastMessage && <span className="shrink-0 text-xs text-ink-faint">{timeAgo(c.lastMessage.createdAt)}</span>}</span>
              <span className="block truncate text-sm text-ink-soft">{c.projectTitle ?? c.subject}</span>
              <span className="mt-0.5 flex items-center gap-2"><span className="line-clamp-1 flex-1 text-sm text-ink-faint">{c.lastMessage?.body ?? "No messages yet"}</span>{c.unread > 0 && <span className="rounded-full bg-danger px-1.5 text-xs font-bold text-white" aria-label={`${c.unread} unread`}>{c.unread}</span>}</span></Link></li>))}</ul>
          <div className={clsx(!id && "hidden lg:block")}>{id ? <Thread id={id} key={id} /> : <div className="grid h-full min-h-[28rem] place-items-center p-6 text-center text-ink-soft">Choose a conversation to read it.</div>}</div>
        </Card>}
      <NewConversation open={dialog} onClose={() => setDialog(false)} />
    </div>);
}
