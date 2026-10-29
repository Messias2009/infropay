import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  defaultQuizTheme,
  emptyDefinition,
  slugify,
  validateDefinition,
  type QuizDefinition,
} from "@/lib/quiz-schema";
import { hasActivePlan } from "@/lib/plans.functions";

/**
 * Quiz Funnel — Passo 2: dados do quiz.
 * Toda a escrita passa aqui: o plano Premium é verificado no servidor e a
 * RLS garante que cada produtor só toca nos seus quizzes, sessões e leads.
 */

const SETUP_MESSAGE =
  "A configuração dos quizzes ainda não foi aplicada. Execute a migração " +
  "supabase/migrations/20261026000003_quiz_funnel_data.sql no SQL Editor do Supabase.";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function isSetupError(error: { message?: string } | null | undefined) {
  const m = (error?.message ?? "").toLowerCase();
  return m.includes("quizzes") || m.includes("quiz_") || m.includes("schema cache");
}

async function assertPremium(userId: string) {
  const supabaseAdmin = await adminClient();
  const active = await hasActivePlan(supabaseAdmin, userId);
  if (!active)
    throw new Error(
      "O Quiz Funnel é uma funcionalidade Premium. Active um plano ou teste 1 dia grátis.",
    );
  return supabaseAdmin;
}

function draftDefinition(input: any): QuizDefinition {
  const steps = Array.isArray(input?.steps) ? input.steps : [];
  if (steps.length > 0) return validateDefinition(input);
  return {
    version: 1,
    theme: { ...defaultQuizTheme(), ...(input?.theme ?? {}) },
    start_step_id: typeof input?.start_step_id === "string" ? input.start_step_id : "",
    steps: [],
  };
}

async function uniqueSlug(supabaseAdmin: any, title: string) {
  const base = slugify(title);
  for (let i = 1; i <= 25; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const { data } = await supabaseAdmin
      .from("quizzes")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Lista os quizzes do próprio vendedor com contagem de leads e conversão. */
export const listMyQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (isSetupError(error)) return { items: [], setup_required: true };
      throw new Error(error.message);
    }

    const rows = (data ?? []) as any[];
    const ids = rows.map((r) => r.id);
    let leadRows: { quiz_id: string }[] = [];
    if (ids.length) {
      const { data: leads } = await supabaseAdmin
        .from("quiz_leads")
        .select("quiz_id")
        .in("quiz_id", ids);
      leadRows = (leads ?? []) as { quiz_id: string }[];
    }
    const counts = new Map<string, number>();
    for (const l of leadRows) counts.set(l.quiz_id, (counts.get(l.quiz_id) ?? 0) + 1);

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        visits: r.visits_count ?? 0,
        starts: r.starts_count ?? 0,
        leads: counts.get(r.id) ?? 0,
        conversion: (r.visits_count ?? 0) > 0 ? (counts.get(r.id) ?? 0) / (r.visits_count ?? 1) : 0,
        updated_at: r.updated_at,
        steps: Array.isArray(r.definition?.steps) ? r.definition.steps.length : 0,
      })),
      setup_required: false,
    };
  });

/** Cria um quiz vazio (rascunho). Exige plano activo. */
export const createQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ title: z.string().trim().min(2).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertPremium(context.userId);
    const slug = await uniqueSlug(supabaseAdmin, data.title);
    const { data: created, error } = await supabaseAdmin
      .from("quizzes")
      .insert({
        producer_id: context.userId,
        title: data.title,
        slug,
        definition: emptyDefinition(),
        status: "rascunho",
      })
      .select("*")
      .single();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }  return created as any;
});

/** Duplica um quiz (apenas o dono). Exige plano activo. */
export const duplicateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertPremium(context.userId);
    const { data: original, error } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("id", data.id)
      .eq("producer_id", context.userId)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!original) throw new Error("Quiz não encontrado ou sem permissão.");
    
    const newSlug = await uniqueSlug(supabaseAdmin, `${original.title} (cópia)`);
    const { data: created, error: createError } = await supabaseAdmin
      .from("quizzes")
      .insert({
        producer_id: context.userId,
        title: `${original.title} (cópia)`,
        slug: newSlug,
        definition: original.definition,
        status: "rascunho",
      })
      .select("*")
      .single();
    if (createError) {
      if (isSetupError(createError)) throw new Error(SETUP_MESSAGE);
      throw new Error(createError.message);
    }
    return created as any;
  });

/** Grava o quiz inteiro (JSON). Só o dono, e apenas com plano activo. */
export const saveQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(2).max(120).optional(),
        definition: z.unknown(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertPremium(context.userId);
    const definition = draftDefinition(data.definition);
    const payload: Record<string, unknown> = { definition };
    if (data.title) payload.title = data.title;

    // A escrita ocorre no servidor. Verificamos explicitamente o proprietário
    // antes de usar o cliente administrativo, sem expor a chave ao navegador.
    const supabaseAdmin = await adminClient();
    const { data: updated, error } = await supabaseAdmin
      .from("quizzes")
      .update(payload)
      .eq("id", data.id)
      .eq("producer_id", context.userId)
      .select("id, slug, title, status");
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!updated?.length) throw new Error("Quiz não encontrado ou sem permissão.");
    return updated[0];
  });

/** Publica ou volta a rascunho. Publicar exige plano activo e quiz completo. */
export const setQuizStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["rascunho", "publicado"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await assertPremium(context.userId);

    if (data.status === "publicado") {
      const { data: quiz, error } = await supabaseAdmin
        .from("quizzes")
        .select("definition")
        .eq("id", data.id)
        .eq("producer_id", context.userId)
        .maybeSingle();
      if (error) {
        if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
        throw new Error(error.message);
      }
      if (!quiz) throw new Error("Quiz não encontrado.");
      try {
        validateDefinition(quiz.definition);
      } catch (e) {
        throw new Error(`Não é possível publicar: ${(e as Error).message}`);
      }
    }

    const { data: updated, error: upError } = await supabaseAdmin
      .from("quizzes")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("producer_id", context.userId)
      .select("id, status");
    if (upError) {
      if (isSetupError(upError)) throw new Error(SETUP_MESSAGE);
      throw new Error(upError.message);
    }
    if (!updated?.length) throw new Error("Quiz não encontrado ou sem permissão.");
    return updated[0];
  });

/** Remove um quiz (apenas o dono). */
export const deleteQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: deleted, error } = await (context.supabase as any)
      .from("quizzes")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!deleted?.length) throw new Error("Quiz não encontrado ou sem permissão.");
    return { ok: true as const };
  });

/** Obtém um quiz do próprio vendedor para edição. */
export const getMyQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const { data: quiz, error } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("id", data.id)
      .eq("producer_id", context.userId)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!quiz) throw new Error("Quiz não encontrado ou sem permissão.");
    return quiz as any;
  });

/**
 * Leitura pública do quiz por slug (usada pela página pública e pela
 * pré-visualização). Se o plano do vendedor expirar, o quiz publicado
 * continua guardado mas devolve `available: false` → "Quiz indisponível".
 */
export const getPublicQuiz = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const { data: quiz, error } = await supabaseAdmin
      .from("quizzes")
      .select("id, slug, title, definition, status, producer_id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) return { available: false as const, setup_required: true };
      throw new Error(error.message);
    }
    if (!quiz || quiz.status !== "publicado") return null;

    const active = await hasActivePlan(supabaseAdmin, quiz.producer_id);
    if (!active) {
      return {
        available: false as const,
        slug: quiz.slug,
        title: quiz.title,
        reason: "Plano Premium expirado" as const,
      };
    }

    return {
      available: true as const,
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      definition: quiz.definition,
    };
  });
