import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatBRL } from '../utils';

export interface ReportData {
  periodLabel: string;
  totalEntries: number;
  totalExits: number;
  balance: number;
  categories: { name: string; value: number; count: number }[];
  isMonthly: boolean;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportData;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const [downloading, setDownloading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const categories = data.categories || [];
  const totalEntries = data.totalEntries || 0;
  const totalExits = data.totalExits || 0;
  const balance = data.balance || 0;
  const periodLabel = data.periodLabel || 'Período';

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setFeedbackMsg('Preparando PDF...');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Título Principal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138); // Blue 900
      doc.text('Controle Mensal', 14, 20);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text(`Relatório Financeiro - ${periodLabel}`, 14, 27);

      const dataHoje = new Date().toLocaleDateString('pt-BR');
      doc.setFontSize(9);
      doc.text(`Gerado em: ${dataHoje}`, 196, 27, { align: 'right' });

      // Linha divisória
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.8);
      doc.line(14, 32, 196, 32);

      // Cards de Resumo (Entradas, Saídas, Saldo)
      // Card 1: Entradas
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 38, 56, 22, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('ENTRADAS', 42, 45, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(5, 150, 105); // Emerald 600
      doc.text(`R$ ${formatBRL(totalEntries)}`, 42, 54, { align: 'center' });

      // Card 2: Saídas
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(74, 38, 56, 22, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('SAÍDAS', 102, 45, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(225, 29, 72); // Rose 600
      doc.text(`R$ ${formatBRL(totalExits)}`, 102, 54, { align: 'center' });

      // Card 3: Saldo
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(134, 38, 62, 22, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('SALDO LÍQUIDO', 165, 45, { align: 'center' });
      doc.setFontSize(12);
      if (balance >= 0) {
        doc.setTextColor(5, 150, 105);
      } else {
        doc.setTextColor(225, 29, 72);
      }
      doc.text(`R$ ${formatBRL(balance)}`, 165, 54, { align: 'center' });

      // Título da Tabela
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Detalhamento por Categoria (Gastos)', 14, 70);

      // Tabela com as categorias
      const tableRows = categories.map(c => [
        c.name,
        `${c.count} transação(ões)`,
        `R$ ${formatBRL(c.value)}`
      ]);

      if (tableRows.length === 0) {
        tableRows.push(['Nenhum gasto registrado neste período.', '', 'R$ 0,00']);
      }

      autoTable(doc, {
        startY: 74,
        head: [['Categoria', 'Quantidade', 'Total Gasto']],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'center', textColor: [100, 116, 139] },
          2: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] },
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // Rodapé no final da página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Relatório gerado pelo aplicativo Controle Mensal - Gestão Financeira Pessoal',
        105,
        pageHeight - 10,
        { align: 'center' }
      );

      const nomeArquivo = `Relatorio_Controle_Mensal_${periodLabel.replace(/\s+/g, '_')}.pdf`;

      // 1. Tenta compartilhamento nativo de arquivo (Android moderno / WebView)
      try {
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: 'Relatório Financeiro',
            text: `Relatório Controle Mensal - ${periodLabel}`,
          });
          setFeedbackMsg('Relatório compartilhado!');
          setTimeout(() => setFeedbackMsg(''), 4000);
          setDownloading(false);
          return;
        }
      } catch (shareErr) {
        console.warn('Share API não utilizada, usando fallback:', shareErr);
      }

      // 2. Download via Data URL direto (compatível com WebView do Android sem DownloadManager)
      try {
        const dataUri = doc.output('datauristring');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUri;
        downloadLink.download = nomeArquivo;
        downloadLink.target = '_blank';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setFeedbackMsg('Download iniciado com sucesso!');
        setTimeout(() => setFeedbackMsg(''), 4000);
      } catch {
        // 3. Fallback clássico doc.save
        doc.save(nomeArquivo);
      }

      setDownloading(false);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Não foi possível gerar o PDF. Verifique se o navegador permite downloads.');
      setDownloading(false);
      setFeedbackMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex flex-col justify-start overflow-y-auto animate-fadeIn">
      {/* Barra de Ações Superior (fixa) */}
      <div className="sticky top-0 z-50 bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Voltar</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition active:scale-95 disabled:opacity-70"
        >
          <span className="material-symbols-outlined text-base">
            {downloading ? 'downloading' : 'download'}
          </span>
          <span>{downloading ? 'Gerando...' : 'Salvar em PDF'}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="sticky top-14 z-50 bg-emerald-600 text-white text-xs font-bold py-2 text-center shadow-md animate-fadeIn">
          {feedbackMsg}
        </div>
      )}

      {/* Conteúdo do Relatório */}
      <div className="flex-1 p-4 sm:p-6 max-w-2xl w-full mx-auto">
        <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-primary tracking-tight font-display">
                Controle Mensal
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                Relatório Financeiro • {periodLabel}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">
                Gerado em {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Grid de Resumo */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Entradas
              </span>
              <span className="text-sm font-black text-emerald-600">
                R$ {formatBRL(totalEntries)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saídas
              </span>
              <span className="text-sm font-black text-rose-600">
                R$ {formatBRL(totalExits)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Saldo
              </span>
              <span className={`text-sm font-black ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R$ {formatBRL(balance)}
              </span>
            </div>
          </div>

          {/* Tabela de Categorias */}
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Detalhamento por Categoria (Gastos)
          </h2>
          <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Total Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
                      Nenhum gasto registrado neste período.
                    </td>
                  </tr>
                ) : (
                  categories.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{c.name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{c.count}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        R$ {formatBRL(c.value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Relatório gerado pelo aplicativo Controle Mensal • Gestão Financeira Pessoal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
