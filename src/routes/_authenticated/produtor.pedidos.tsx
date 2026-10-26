import { createFileRoute } from "@tanstack/react-router";
import { ReceiptReviewPanel } from "@/components/payments/ReceiptReviewPanel";

export const Route = createFileRoute("/_authenticated/produtor/pedidos")({
  head: () => ({
    meta: [{ title: "Pedidos e comprovativos — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: ProdutorPedidos,
});

function ProdutorPedidos() {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Vendas</div>
        <h1 className="font-display text-2xl md:text-4xl font-bold mt-2">
          Pedidos e comprovativos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirme o comprovativo de pagamento por referência dos seus produtos. Ao aprovar, o
          comprador recebe o acesso e o valor entra no seu saldo.
        </p>
      </div>
      <ReceiptReviewPanel />
    </div>
  );
}
