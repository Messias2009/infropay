import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const moduleSchema = z.object({
  product_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  sort_order: z.number().int().min(0).max(999).default(0),
});

const lessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  video_url: z.string().trim().max(2000).optional().nullable(),
  attachment_url: z.string().trim().max(2000).optional().nullable(),
  duration_minutes: z.number().int().min(0).max(1000).optional().nullable(),
  sort_order: z.number().int().min(0).max(999).default(0),
  is_free: z.boolean().default(false),
});

/* ---------------- PRODUCER ---------------- */

export const getMyCourseTree = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: product } = await (context.supabase as any)
      .from("products")
      .select("id, title, slug, has_members_area, delivery_kind")
      .eq("id", data.product_id)
      .eq("producer_id", context.userId)
      .maybeSingle();
    if (!product) throw new Error("Produto não encontrado");
    const { data: modules } = await (context.supabase as any)
      .from("course_modules")
      .select("*")
      .eq("product_id", data.product_id)
      .order("sort_order");
    const ids = (modules ?? []).map((m: any) => m.id);
    let lessons: any[] = [];
    if (ids.length) {
      const { data: ls } = await (context.supabase as any)
        .from("course_lessons")
        .select("*")
        .in("module_id", ids)
        .order("sort_order");
      lessons = ls ?? [];
    }
    return {
      product,
      modules: (modules ?? []).map((m: any) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id),
      })),
    };
  });

export const createModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => moduleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("course_modules")
      .insert({ ...data, producer_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const deleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("course_modules")
      .delete()
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const createLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).from("course_lessons").insert({
      ...data,
      video_url: data.video_url || null,
      attachment_url: data.attachment_url || null,
      producer_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("course_lessons")
      .delete()
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/* ---------------- STUDENT ---------------- */

/** Creates enrollments for every paid sale that matches the signed-in user's e-mail. */
export const claimMyEnrollments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as any)?.email as string | undefined;
    if (!email) return { created: 0 };
    const { data: sales } = await (context.supabase as any)
      .from("sales")
      .select("id, product_id")
      .eq("status", "pago")
      .eq("buyer_email", email);
    const rows = sales ?? [];
    let created = 0;
    for (const s of rows) {
      const { error } = await (context.supabase as any)
        .from("enrollments")
        .upsert(
          { user_id: context.userId, product_id: s.product_id, sale_id: s.id },
          { onConflict: "user_id,product_id", ignoreDuplicates: true },
        );
      if (!error) created++;
    }
    return { created };
  });

export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("enrollments")
      .select(
        "id, progress_percent, completed_at, certificate_issued, created_at, product:products(id, title, slug, cover_url, short_description)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const getMyCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(160) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: product } = await (context.supabase as any)
      .from("products")
      .select("id, title, slug, cover_url, description")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product) throw new Error("Produto não encontrado");

    const { data: enrollment } = await (context.supabase as any)
      .from("enrollments")
      .select("*")
      .eq("user_id", context.userId)
      .eq("product_id", product.id)
      .maybeSingle();
    if (!enrollment) throw new Error("Ainda não tens acesso a esta área de membros.");

    const { data: modules } = await (context.supabase as any)
      .from("course_modules")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order");
    const ids = (modules ?? []).map((m: any) => m.id);
    let lessons: any[] = [];
    let progress: any[] = [];
    if (ids.length) {
      const { data: ls } = await (context.supabase as any)
        .from("course_lessons")
        .select("*")
        .in("module_id", ids)
        .order("sort_order");
      lessons = ls ?? [];
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length) {
        const { data: pr } = await (context.supabase as any)
          .from("lesson_progress")
          .select("lesson_id, completed, seconds_watched")
          .eq("user_id", context.userId)
          .in("lesson_id", lessonIds);
        progress = pr ?? [];
      }
    }
    return {
      product,
      enrollment,
      modules: (modules ?? []).map((m: any) => ({
        ...m,
        lessons: lessons
          .filter((l) => l.module_id === m.id)
          .map((l) => ({
            ...l,
            completed: !!progress.find((p) => p.lesson_id === l.id && p.completed),
          })),
      })),
    };
  });

export const setLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        lesson_id: z.string().uuid(),
        product_id: z.string().uuid(),
        completed: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("lesson_progress")
      .upsert(
        { user_id: context.userId, lesson_id: data.lesson_id, completed: data.completed },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) throw error;

    const { data: modules } = await (context.supabase as any)
      .from("course_modules")
      .select("id")
      .eq("product_id", data.product_id);
    const ids = (modules ?? []).map((m: any) => m.id);
    let total = 0;
    let done = 0;
    if (ids.length) {
      const { data: lessons } = await (context.supabase as any)
        .from("course_lessons")
        .select("id")
        .in("module_id", ids);
      const lessonIds = (lessons ?? []).map((l: any) => l.id);
      total = lessonIds.length;
      if (total) {
        const { data: pr } = await (context.supabase as any)
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("user_id", context.userId)
          .in("lesson_id", lessonIds);
        done = (pr ?? []).filter((p: any) => p.completed).length;
      }
    }
    const percent = total ? Math.round((done / total) * 100) : 0;
    await (context.supabase as any)
      .from("enrollments")
      .update({
        progress_percent: percent,
        completed_at: percent === 100 ? new Date().toISOString() : null,
        certificate_issued: percent === 100,
      })
      .eq("user_id", context.userId)
      .eq("product_id", data.product_id);

    return { progress_percent: percent, lessons_done: done, lessons_total: total };
  });
