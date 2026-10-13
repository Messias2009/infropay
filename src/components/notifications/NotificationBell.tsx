import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check, Trash2, ShoppingBag, Banknote, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyNotifications,
  countUnread,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from "@/lib/notifications.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type N = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function iconFor(type: string) {
  if (type === "sale") return ShoppingBag;
  if (type === "withdrawal") return Banknote;
  return Info;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyNotifications);
  const countFn = useServerFn(countUnread);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const markOneFn = useServerFn(markNotificationRead);
  const delFn = useServerFn(deleteNotification);

  const { data: notifs = [] } = useQuery<N[]>({
    queryKey: ["notifications"],
    queryFn: () => listFn() as any,
    refetchInterval: 60_000,
  });
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => countFn() as any,
    refetchInterval: 60_000,
  });
  const [open, setOpen] = useState(false);

  // Realtime subscription
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      const channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const n = payload.new as N;
            toast(n.title, { description: n.body ?? undefined });
            qc.invalidateQueries({ queryKey: ["notifications"] });
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => qc.invalidateQueries({ queryKey: ["notifications"] }),
        )
        .subscribe();
      (window as any).__notifChan = channel;
    });
    return () => {
      cancelled = true;
      const ch = (window as any).__notifChan;
      if (ch) supabase.removeChannel(ch);
    };
  }, [qc]);

  async function handleMarkAll() {
    await markAllFn();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function handleClick(n: N) {
    if (!n.read) {
      await markOneFn({ data: { id: n.id } });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
  }
  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative h-10 w-10 grid place-items-center rounded-lg border border-border bg-card hover:bg-accent/40 transition"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center animate-pulse shadow-glow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[92vw] max-w-sm p-0 bg-card border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary-glow" /> Notificações
            {unread > 0 && (
              <span className="text-[10px] text-primary-glow">
                ({unread} nova{unread > 1 ? "s" : ""})
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Marcar tudo lido
            </button>
          )}
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Sem notificações ainda.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifs.map((n) => {
                const Icon = iconFor(n.type);
                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div
                      className={`h-9 w-9 shrink-0 rounded-lg grid place-items-center ${n.type === "sale" ? "bg-success/15 text-success" : n.type === "withdrawal" ? "bg-gold/15 text-gold" : "bg-primary/15 text-primary-glow"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <div className="font-semibold text-sm truncate">{n.title}</div>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {n.body && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="text-muted-foreground/60 hover:text-destructive p-1"
                      aria-label="Apagar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onClick={() => handleClick(n)}>
                        {inner}
                      </Link>
                    ) : (
                      <button className="w-full text-left" onClick={() => handleClick(n)}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
