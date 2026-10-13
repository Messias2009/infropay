import { createFileRoute, redirect } from "@tanstack/react-router";

/** Link curto: /p/slug → /produto/slug (preserva ?ref=) */
export const Route = createFileRoute("/p/$slug")({
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/produto/$slug",
      params: { slug: params.slug },
      search: search as never,
    });
  },
  component: () => null,
});
