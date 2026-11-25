import { formatBRL } from '../utils';

interface ReportExportData {
  periodLabel: string;
  totalEntries: number;
  totalExits: number;
  balance: number;
  categories: { name: string; value: number; count: number }[];
  isMonthly: boolean;
}

/**
 * Gera e abre visualização limpa e otimizada para impressão/PDF do navegador nativo,
 * funcionando perfeitamente em celulares (Android/iOS) e desktop sem pesar o bundle.
 */
export function printFinancialReport(data: ReportExportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para gerar a impressão do relatório em PDF.');
    return;
  }

  const categoryRows = data.categories
    .map(
      (c) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; font-weight: 600; color: #334155;">${c.name}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #64748b;">${c.count} transação(ões)</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: bold; color: #e11d48;">R$ ${formatBRL(c.value)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - ${data.periodLabel}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .title {
          font-size: 22px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0;
        }
        .subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          text-align: center;
        }
        .card-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .card-val {
          font-size: 18px;
          font-weight: 900;
        }
        .entries { color: #059669; }
        .exits { color: #e11d48; }
        .balance { color: ${data.balance >= 0 ? '#059669' : '#e11d48'}; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th {
          background: #f1f5f9;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          text-align: left;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Controle Mensal</h1>
          <p class="subtitle">Relatório Financeiro • ${data.periodLabel}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; color: #94a3b8;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card">
          <div class="card-label">Total Entradas</div>
          <div class="card-val entries">R$ ${formatBRL(data.totalEntries)}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Saídas</div>
          <div class="card-val exits">R$ ${formatBRL(data.totalExits)}</div>
        </div>
        <div class="card">
          <div class="card-label">Saldo Líquido</div>
          <div class="card-val balance">R$ ${formatBRL(data.balance)}</div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #334155;">
        Detalhamento por Categoria (Gastos)
      </h3>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th style="text-align: center;">Quantidade</th>
            <th style="text-align: right;">Total Gasto</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows || '<tr><td colspan="3" style="text-align:center; padding: 16px; color:#94a3b8;">Nenhum gasto registrado neste período.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Relatório gerado pelo aplicativo Controle Mensal • Gestão Financeira Pessoal
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Gera mensagem formatada e abre compartilhamento direto no WhatsApp
 */
export function shareReportWhatsApp(data: ReportExportData) {
  const topCategories = data.categories
    .slice(0, 4)
    .map((c) => `• ${c.name}: R$ ${formatBRL(c.value)}`)
    .join('\n');

  const text = `📊 *Resumo Financeiro - Controle Mensal*
🗓️ *Período:* ${data.periodLabel}

🟢 *Entradas:* R$ ${formatBRL(data.totalEntries)}
🔴 *Saídas:* R$ ${formatBRL(data.totalExits)}
💰 *Saldo:* R$ ${formatBRL(data.balance)}

${data.categories.length > 0 ? `*Maiores Despesas:*\n${topCategories}\n` : ''}
_Gerado pelo app Controle Mensal_`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
