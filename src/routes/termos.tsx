import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — InfroPay" },
      { name: "description", content: "Termos e condições de utilização da plataforma InfroPay." },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: Termos,
});

function Termos() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose prose-invert prose-headings:font-display">
        <h1>Termos de uso</h1>
        <p className="text-muted-foreground">
          Última actualização: {new Date().toLocaleDateString("pt-PT")}
        </p>

        <h2>1. Aceitação</h2>
        <p>
          Ao utilizar a InfroPay o utilizador concorda com estes Termos. Se não concordar, deverá
          cessar o uso da plataforma.
        </p>

        <h2>2. Cadastro</h2>
        <p>
          Para vender ou comprar deve fornecer dados verdadeiros e manter a confidencialidade das
          credenciais da sua conta.
        </p>

        <h2>3. Comissões</h2>
        <ul>
          <li>
            Taxa por venda: <strong>2%</strong> sobre o valor bruto.
          </li>
          <li>
            Taxa por saque: <strong>8%</strong> sobre o valor solicitado.
          </li>
          <li>
            Saque mínimo: <strong>5.000 Kz</strong>.
          </li>
          <li>
            Liberação: <strong>mínimo de 1 hora</strong> após a aprovação do pagamento.
          </li>
        </ul>

        <h2>4. Produtos</h2>
        <p>
          O produtor é responsável pelo conteúdo publicado. A InfroPay reserva-se o direito de
          rejeitar ou remover produtos que violem a lei angolana ou os nossos padrões.
        </p>

        <h2>5. Reembolsos e garantia</h2>
        <p>
          Cada produto define o seu período de garantia. Após esse período, reembolsos ficam a
          critério do produtor.
        </p>

        <h2>6. Pagamentos</h2>
        <p>
          Aceitamos Multicaixa Express, Referência Multicaixa e Transferência Bancária. Todas as
          transacções em Kwanza (AOA).
        </p>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          A InfroPay é intermediária. Não nos responsabilizamos pelo conteúdo dos infoprodutos ou
          por resultados prometidos por produtores.
        </p>

        <h2>8. Lei aplicável</h2>
        <p>Regem-se pela legislação da República de Angola. Foro: Comarca de Luanda.</p>
      </article>
    </SiteLayout>
  );
}
