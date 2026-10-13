import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — InfroPay" },
      {
        name: "description",
        content: "Como a InfroPay recolhe, utiliza e protege os seus dados pessoais.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-invert prose-headings:font-display">
        <h1>Política de privacidade</h1>
        <p className="text-muted-foreground">
          Última actualização: {new Date().toLocaleDateString("pt-PT")}
        </p>

        <h2>1. Dados que recolhemos</h2>
        <ul>
          <li>Dados de conta: nome, email, telefone.</li>
          <li>
            Dados de pagamento: método, valor, referência (não guardamos dados completos do cartão).
          </li>
          <li>Dados de utilização: páginas vistas, cliques, dispositivo.</li>
        </ul>

        <h2>2. Como usamos</h2>
        <p>
          Utilizamos os dados para operar a plataforma, processar pagamentos, prevenir fraude,
          comunicar consigo e melhorar o serviço.
        </p>

        <h2>3. Partilha</h2>
        <p>
          Partilhamos dados apenas com processadores de pagamento e obrigações legais. Nunca
          vendemos os seus dados.
        </p>

        <h2>4. Segurança</h2>
        <p>Encriptação em trânsito (HTTPS) e em repouso. Acesso interno restrito e auditado.</p>

        <h2>5. Os seus direitos</h2>
        <p>
          Pode aceder, corrigir ou eliminar os seus dados a qualquer momento contactando{" "}
          <a href="mailto:privacidade@infropay.ao">privacidade@infropay.ao</a>.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Usamos cookies essenciais para autenticação e analíticas para entender o uso da
          plataforma.
        </p>
      </article>
    </SiteLayout>
  );
}
