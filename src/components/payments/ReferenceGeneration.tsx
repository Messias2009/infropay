import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PaymentReference } from "@/lib/payments.config";

const TOTAL_SECONDS = 60;
const REVEAL_AFTER_SECONDS = 10;

/**
 * Painel de geração da Referência.
 *
 * Enquanto os dados não estão prontos mostra um anel a girar com "Aguarde..."
 * e a contagem a subir até 60 segundos. A Entidade/Referência são reveladas
 * após 10 segundos; a contagem continua até 60 e termina com "gerada".
 */
export function ReferenceGeneration({
  reference,
  amountLabel,
}: {
  reference: PaymentReference;
  amountLabel: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS) return;
    const id = window.setTimeout(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearTimeout(id);
  }, [elapsed]);

  const revealed = elapsed >= REVEAL_AFTER_SECONDS;
  const done = elapsed >= TOTAL_SECONDS;
  const progress = Math.min(elapsed / TOTAL_SECONDS, 1);
  const circumference = 2 * Math.PI * 26;

  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">
          Pagar por {reference.provider}
        </div>
        {reference.mode === "test" && (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warning">
            Modo de teste
          </span>
        )}
      </div>

      {!revealed ? (
        <div className="py-8 flex flex-col items-center text-center gap-3">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-border"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-gold transition-[stroke-dashoffset] duration-1000 ease-linear"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
              />
            </svg>
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-gold" />
          </div>
          <div className="text-sm font-semibold">Aguarde, a gerar a sua referência…</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {elapsed} / {TOTAL_SECONDS} segundos
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <RefBox label="Entidade" value={reference.entity} />
            <RefBox label="Referência" value={reference.reference} />
            <RefBox label="Valor" value={amountLabel} />
          </div>

          <ol className="mt-5 space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
            {reference.instructions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ol>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-emerald-400">
            {done ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Referência gerada com sucesso
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> A concluir em{" "}
                <span className="tabular-nums font-semibold">{TOTAL_SECONDS - elapsed}s</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function RefBox({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copiada`);
      }}
      className="rounded-xl border border-border bg-card p-3 text-left hover:border-gold/50 transition"
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono font-bold text-base flex items-center gap-2">
        {value} <Copy className="h-3 w-3 opacity-60" />
      </div>
    </button>
  );
}
