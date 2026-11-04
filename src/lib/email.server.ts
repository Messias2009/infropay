type ApprovedSaleEmail = {
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  amountCents: number;
  currency: string;
  accessToken: string;
};

const LOGO_URL =
  "https://raw.githubusercontent.com/Messias2009/infropay/main/src/assets/infropay-mark.png";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

export async function sendApprovedSaleEmail(sale: ApprovedSaleEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não está configurada no servidor.");

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const appUrl = (process.env.APP_URL || "https://infropay.com").replace(/\/$/, "");
  const accessUrl = `${appUrl}/pedido/${encodeURIComponent(sale.accessToken)}`;
  const amount = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: sale.currency || "AOA",
  }).format(sale.amountCents / 100);
  const name = escapeHtml(sale.buyerName || "Cliente");
  const product = escapeHtml(sale.productTitle || "Produto digital");

  const html = `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 12px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden">
    <tr><td style="padding:28px 28px 20px;text-align:center;background:#101d3a">
      <img src="${LOGO_URL}" width="62" height="62" alt="InfroPay" style="display:block;margin:0 auto 10px;border:0;border-radius:12px">
      <div style="font-size:25px;font-weight:800;letter-spacing:-1px;color:#ffffff">Infro<span style="color:#e8b85b">Pay</span></div>
    </td></tr>
    <tr><td style="padding:34px 30px 12px">
      <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#159568;text-transform:uppercase">Pagamento aprovado</div>
      <h1 style="font-size:25px;line-height:1.25;margin:12px 0;color:#172033">A sua compra está confirmada, ${name}!</h1>
      <p style="font-size:15px;line-height:1.7;color:#596579;margin:0">Obrigado por comprar através da InfroPay. O seu produto já está disponível.</p>
    </td></tr>
    <tr><td style="padding:22px 30px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fb;border:1px solid #e7eaf0;border-radius:12px">
        <tr><td style="padding:18px 20px">
          <div style="font-size:12px;color:#778197;text-transform:uppercase;letter-spacing:1px">Produto adquirido</div>
          <div style="font-size:17px;font-weight:700;color:#172033;margin-top:7px">${product}</div>
          <div style="font-size:14px;color:#596579;margin-top:8px">Total pago: <strong style="color:#172033">${escapeHtml(amount)}</strong></div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:4px 30px 30px;text-align:center">
      <a href="${accessUrl}" style="display:inline-block;background:#173c78;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 28px;border-radius:9px">Aceder ao meu produto</a>
      <p style="font-size:12px;line-height:1.6;color:#7b8495;margin:18px 0 0">Se o botão não funcionar, copie este endereço para o navegador:<br><a href="${accessUrl}" style="color:#2457a6;word-break:break-all">${accessUrl}</a></p>
    </td></tr>
    <tr><td style="padding:20px 28px;background:#f7f8fb;text-align:center;border-top:1px solid #edf0f5">
      <div style="font-size:12px;color:#7b8495">© ${new Date().getFullYear()} InfroPay · Pagamentos e produtos digitais</div>
      <div style="font-size:12px;color:#7b8495;margin-top:6px">Este e-mail confirma uma compra realizada na plataforma.</div>
    </td></tr>
  </table>
</body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [sale.buyerEmail],
      subject: "Compra aprovada — o seu produto está disponível | InfroPay",
      html,
      text:
        `Olá, ${sale.buyerName || "Cliente"}! O pagamento do produto "${sale.productTitle}" foi aprovado. Aceda ao seu produto: ${accessUrl}`,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(result.message || `Resend recusou o envio (HTTP ${response.status}).`);
  }
  return { id: result.id ?? null };
}
