import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Runtime público do Quiz Funnel: sessões, eventos, captura de leads e a
 * lista de leads para o produtor.
 *
 * * Escrita sempre no servidor (service role) — o navegador nunca decide o
 *   `producer_id` nem o `quiz_id` a partir de dados que envia.
 * * O quiz tem de existir e estar publicado; o slug é validado e procurado
 *   na base de dados antes de qualquer escrita.
 * * Há limite de ritmo por IP e por sessão para a captura pública de leads
 *   não poder ser usada para encher a base de dados.
 */

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Slug inválido.");

const visitorSchema = z
  .string()
  .trim()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/);

const sessionSchema = z.string().uuid();

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/* ------------------------------- rate limit ------------------------------- */

const buckets = new Map<string, { count: number; reset: number }>();

function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

function clientKey() {
  try {
    const request = getRequest();
    const forwarded = request?.headers?.get("x-forwarded-for") ?? "";
    const ip =
      forwarded.split(",")[0]?.trim() || request?.headers?.get("cf-connecting-ip") || "unknown";
    return ip.slice(0, 80);
  } catch {
    return "unknown";
  }
}

/* --------------------------------- helpers -------------------------------- */

type PublishedQuiz = {
  id: string;
  producer_id: string;
  status: string;
  definition: any;
  starts_count: number;
  visits_count: number;
};

async function publishedQuiz(db: any, slug: string): Promise<PublishedQuiz | null> {
  const { data, error } = await db
    .from("quizzes")
    .select("id, producer_id, status, definition, starts_count, visits_count")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  if (!data || data.status !== "publicado") return null;
  return data as PublishedQuiz;
}

async function sessionOfQuiz(db: any, sessionId: string, quizId: string) {
  const { data } = await db
    .from("quiz_sessions")
    .select("id, quiz_id, status")
    .eq("id", sessionId)
    .eq("quiz_id", quizId)
    .maybeSingle();
  return data as { id: string; quiz_id: string; status: string } | null;
}

async function insertEvent(
  db: any,
  quiz: PublishedQuiz,
  sessionId: string | null,
  type: "visualizacao" | "resposta" | "avanco" | "abandono" | "lead" | "oferta",
  stepId: string | null,
  payload: Record<string, unknown> = {},
) {
  if (!sessionId) return;
  try {
    await db.from("quiz_events").insert({
      quiz_id: quiz.id,
      session_id: sessionId,
      producer_id: quiz.producer_id,
      step_id: stepId,
      type,
      payload,
    });
  } catch {
    // analytics é best-effort: nunca bloqueia o visitante
  }
}

/* --------------------------- sessão do visitante -------------------------- */

/** Abre (ou retoma) a sessão do visitante e conta a visita. */
export const startQuizSession = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        visitor_id: visitorSchema,
        utm_source: z.string().max(120).nullish(),
        utm_medium: z.string().max(120).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (limited(`quiz-start:${clientKey()}`, 60, 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    try {
      const db = await adminClient();
      const quiz = await publishedQuiz(db, data.slug);
      if (!quiz) return { ok: false as const, reason: "unavailable" as const };

      // Retoma uma sessão recente do mesmo visitante (recarregar a página não
      // deve inflacionar visitas nem duplicar leads).
      const since = new Date(Date.now() - 30 * 60_000).toISOString();
      const { data: existing } = await db
        .from("quiz_sessions")
        .select("id")
        .eq("quiz_id", quiz.id)
        .eq("visitor_id", data.visitor_id)
        .eq("status", "em_curso")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        return { ok: true as const, session_id: existing.id as string, resumed: true };
      }

      // Sessões antigas do mesmo visitante ficam marcadas como abandonadas.
      await db
        .from("quiz_sessions")
        .update({ status: "abandonada" })
        .eq("quiz_id", quiz.id)
        .eq("visitor_id", data.visitor_id)
        .eq("status", "em_curso");

      const { data: created, error } = await db
        .from("quiz_sessions")
        .insert({
          quiz_id: quiz.id,
          producer_id: quiz.producer_id,
          visitor_id: data.visitor_id,
          utm_source: data.utm_source ?? null,
          utm_medium: data.utm_medium ?? null,
          status: "em_curso",
        })
        .select("id")
        .single();
      if (error || !created?.id) return { ok: false as const, reason: "unavailable" as const };

      await db
        .from("quizzes")
        .update({
          visits_count: (quiz.visits_count ?? 0) + 1,
          starts_count: (quiz.starts_count ?? 0) + 1,
        })
        .eq("id", quiz.id);

      return { ok: true as const, session_id: created.id as string, resumed: false };
    } catch {
      // Tabelas ainda não migradas: o quiz continua a funcionar sem analytics.
      return { ok: false as const, reason: "unavailable" as const };
    }
  });

/** Regista um evento da etapa (visualização, resposta, avanço, oferta). */
export const trackQuizStep = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        session_id: sessionSchema,
        step_id: z.string().max(60).nullish(),
        type: z.enum(["visualizacao", "resposta", "avanco", "oferta"]),
        value: z.string().max(240).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (limited(`quiz-track:${clientKey()}`, 300, 60_000)) return { ok: false as const };
    try {
      const db = await adminClient();
      const quiz = await publishedQuiz(db, data.slug);
      if (!quiz) return { ok: false as const };
      const session = await sessionOfQuiz(db, data.session_id, quiz.id);
      if (!session) return { ok: false as const };

      // Teto por sessão: evita que uma sessão aberta escreva sem limite.
      const { count } = await db
        .from("quiz_events")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id);
      if ((count ?? 0) > 400) return { ok: false as const };

      await insertEvent(db, quiz, session.id, data.type, data.step_id ?? null, {
        value: data.value ?? null,
      });
      if (data.step_id) {
        await db
          .from("quiz_sessions")
          .update({ current_step_id: data.step_id })
          .eq("id", session.id);
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

/** Guarda o lead (nome + WhatsApp) e a pontuação acumulada. */
export const captureQuizLead = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        session_id: sessionSchema.nullish(),
        step_id: z.string().max(60).nullish(),
        nome: z.string().trim().min(1).max(120),
        whatsapp: z.string().trim().min(9).max(30),
        tags: z.array(z.string().max(40)).max(12).optional(),
        score: z.number().int().min(-9999).max(9999).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (limited(`quiz-lead:${clientKey()}`, 10, 60_000)) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    const digits = data.whatsapp.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      return { ok: false as const, reason: "invalid_phone" as const };
    }
    try {
      const db = await adminClient();
      const quiz = await publishedQuiz(db, data.slug);
      if (!quiz) return { ok: false as const, reason: "unavailable" as const };

      const session = data.session_id ? await sessionOfQuiz(db, data.session_id, quiz.id) : null;

      const { data: lead, error } = await db
        .from("quiz_leads")
        .insert({
          quiz_id: quiz.id,
          session_id: session?.id ?? null,
          producer_id: quiz.producer_id,
          nome: data.nome,
          whatsapp: data.whatsapp,
          tags: data.tags ?? [],
          score: data.score ?? 0,
          source_step_id: data.step_id ?? null,
        })
        .select("id")
        .single();
      if (error) return { ok: false as const, reason: "unavailable" as const };

      if (session?.id) {
        await db
          .from("quiz_sessions")
          .update({ score: data.score ?? 0, tags: data.tags ?? [] })
          .eq("id", session.id);
        await insertEvent(db, quiz, session.id, "lead", data.step_id ?? null, {
          lead_id: lead?.id ?? null,
        });
      }
      return { ok: true as const, lead_id: (lead?.id as string) ?? null };
    } catch {
      return { ok: false as const, reason: "unavailable" as const };
    }
  });

/** Marca a sessão como concluída quando o visitante chega à oferta. */
export const completeQuizSession = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        slug: slugSchema,
        session_id: sessionSchema,
        score: z.number().int().min(-9999).max(9999).optional(),
        tags: z.array(z.string().max(40)).max(12).optional(),
        offer_slug: z.string().max(160).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      const db = await adminClient();
      const quiz = await publishedQuiz(db, data.slug);
      if (!quiz) return { ok: false as const };
      const session = await sessionOfQuiz(db, data.session_id, quiz.id);
      if (!session) return { ok: false as const };

      await db
        .from("quiz_sessions")
        .update({
          status: "concluida",
          completed_at: new Date().toISOString(),
          score: data.score ?? 0,
          tags: data.tags ?? [],
        })
        .eq("id", session.id);
      await insertEvent(db, quiz, session.id, "oferta", null, {
        offer_slug: data.offer_slug ?? null,
      });
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  });

/* ------------------------------- produtor -------------------------------- */

/** Leads de um quiz do próprio produtor (mais recentes primeiro). */
export const listQuizLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({ quiz_id: z.string().uuid(), limit: z.number().int().min(1).max(300).optional() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await adminClient();
    const { data: quiz } = await db
      .from("quizzes")
      .select("id, title, slug")
      .eq("id", data.quiz_id)
      .eq("producer_id", context.userId)
      .maybeSingle();
    if (!quiz) throw new Error("Quiz não encontrado ou sem permissão.");

    const { data: rows, error } = await db
      .from("quiz_leads")
      .select("id, nome, whatsapp, tags, score, created_at, source_step_id")
      .eq("quiz_id", data.quiz_id)
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) return { quiz, items: [] as any[], setup_required: true };

    return { quiz, items: rows ?? [], setup_required: false };
  });
