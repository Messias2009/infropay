/**
 * Configuração de pagamentos.
 * Em modo de teste usamos a Referência PayPay abaixo. Para produção, basta
 * substituir estes valores (ou definir as variáveis VITE_PAYPAY_*) — a lógica
 * do checkout não muda.
 */
export type PaymentReference = {
  provider: string;
  entity: string;
  reference: string;
  mode: "test" | "live";
  instructions: string[];
};

const env = (import.meta as any).env ?? {};

export const PAYPAY_REFERENCE: PaymentReference = {
  provider: "Referência PayPay",
  entity: env.VITE_PAYPAY_ENTITY || "10116",
  reference: env.VITE_PAYPAY_REFERENCE || "951946549",
  mode: (env.VITE_PAYPAY_MODE as "test" | "live") || "test",
  instructions: [
    "Abra o Multicaixa Express, ATM ou Internet Banking.",
    "Escolha Pagamentos → Pagamento por referência.",
    "Introduza a Entidade e a Referência indicadas.",
    "Confirme o valor exato do pedido e finalize.",
  ],
};

/** Referência a apresentar para um dado método de pagamento. */
export function referenceForMethod(method: string): PaymentReference | null {
  if (method === "referencia" || method === "multicaixa_express") return PAYPAY_REFERENCE;
  return null;
}
