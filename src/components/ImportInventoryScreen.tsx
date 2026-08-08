import React, { useState, useRef } from 'react';
import {
  FileUp,
  QrCode,
  Info,
  Download,
  CheckCircle2,
  ChevronRight,
  Bell,
  Boxes,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Upload,
  FileCheck,
  Check,
} from 'lucide-react';
import { AppSettings } from '../types';
import { getStoredBatches, getExpectedItemsForBatch, getScanCountForBatch, formatDateStr, getUniqueCategories, getUniqueDescriptions } from '../services/storage';

interface ImportInventoryScreenProps {
  onBack: () => void;
  onCreateVerificationBatch: (
    name: string,
    description: string,
    items: { barcode: string; description?: string; category?: string }[]
  ) => void;
  onAddExpectedToBatch: (
    batchId: number,
    items: { barcode: string; description?: string; category?: string }[]
  ) => void;
  onNavigateQrImport: (batchName: string, targetBatchId?: number) => void;
  onNavigate?: (screen: string) => void;
  onOpenBatchDetails?: (batchId: number) => void;
  targetBatchId?: number | null;
  settings: AppSettings;
}

export const ImportInventoryScreen: React.FC<ImportInventoryScreenProps> = ({
  onBack,
  onCreateVerificationBatch,
  onAddExpectedToBatch,
  onNavigateQrImport,
  onNavigate,
  onOpenBatchDetails,
  targetBatchId,
  settings,
}) => {
  const batches = getStoredBatches();
  const targetBatch = targetBatchId ? batches.find(b => b.id === targetBatchId) : null;
  const existingCategories = getUniqueCategories();
  const existingNames = getUniqueDescriptions();

  const [selectedMethod, setSelectedMethod] = useState<'none' | 'csv' | 'qr'>('none');
  const [batchName, setBatchName] = useState(targetBatch?.name || '');
  const [csvParsedItems, setCsvParsedItems] = useState<{ barcode: string; description?: string; category?: string }[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSingleColumn, setIsSingleColumn] = useState(false);
  const [globalName, setGlobalName] = useState('');
  const [globalCategory, setGlobalCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          setErrorMessage('O arquivo está vazio.');
          return;
        }

        const parsed: { barcode: string; description?: string; category?: string }[] = [];
        let startIdx = 0;
        const firstLineLower = lines[0].toLowerCase();
        if (firstLineLower.includes('codigo') || firstLineLower.includes('patrimonio')) startIdx = 1;

        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 1 && cols[0]) {
            parsed.push({
              barcode: cols[0],
              description: cols[1] || undefined,
              category: cols[2] || undefined,
            });
          }
        }

        if (parsed.length === 0) {
          setErrorMessage('Nenhum código válido encontrado.');
        } else {
          setCsvParsedItems(parsed);
          if (!batchName) setBatchName(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
          const hasDescriptions = parsed.some(item => !!item.description);
          setIsSingleColumn(!hasDescriptions);
        }
      } catch (err) {
        setErrorMessage('Erro ao ler CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (csvParsedItems.length === 0) return;
    const finalItems = csvParsedItems.map(item => ({
      barcode: item.barcode.trim(),
      description: item.description?.trim() || globalName.trim() || 'Item de Inventário',
      category: item.category?.trim() || globalCategory.trim() || 'Sem Categoria'
    }));

    if (targetBatchId) {
      onAddExpectedToBatch(targetBatchId, finalItems);
    } else {
      onCreateVerificationBatch(batchName || 'Auditoria CSV', `Importação CSV`, finalItems);
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col justify-between max-w-md mx-auto select-none relative pb-24 border-x border-[var(--border-color)]">
      
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">{targetBatch ? 'Adição' : 'Importação'}</h1>
        </div>
      </header>

      <main className="p-6 space-y-7 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <section className="card-elevated p-6 space-y-4 shadow-lg border-[var(--color-blue)]/10">
            <label className="text-[10px] font-black text-[var(--color-blue)] uppercase tracking-[0.2em] block ml-1">Identificação da Auditoria</label>
            <div className="relative">
                <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Ex: Auditoria Setor Sul"
                disabled={!!targetBatchId}
                className={`w-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-[1.25rem] px-6 py-4 text-base font-black uppercase tracking-tight focus:outline-none focus:border-[var(--color-blue)] transition-all shadow-inner ${!!targetBatchId ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {!batchName.trim() && !targetBatchId && (
                    <span className="absolute -bottom-5 left-1 text-[8px] font-black text-[var(--color-red)] uppercase tracking-widest animate-pulse">Obrigatório digitar nome</span>
                )}
            </div>
          </section>

          <section className={`space-y-4 pt-2 transition-all duration-500 ${(!batchName.trim() && !targetBatchId) ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
            <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Método de Entrada</h2>

            <button onClick={() => { setSelectedMethod('csv'); fileInputRef.current?.click(); }} className="w-full card-elevated p-6 flex flex-col items-start gap-4 transition-all active:scale-[0.98] shadow-md border-[var(--color-blue)]/5 group hover:border-[var(--color-blue)]/20">
                <div className="bg-[var(--color-blue)]/10 text-[var(--color-blue)] rounded-2xl p-3 border border-[var(--color-blue)]/20 shadow-sm transition-transform group-hover:scale-110"><FileUp className="w-7 h-7" /></div>
                <div className="text-left"><span className="text-base font-black uppercase tracking-tight block">Planilha Eletrônica (CSV)</span><span className="text-xs text-[var(--text-secondary)] mt-1 font-medium block">Importar de sistemas legados ou ERP</span></div>
            </button>

            <button onClick={() => onNavigateQrImport(batchName, targetBatchId || undefined)} className="w-full card-elevated p-6 flex flex-col items-start gap-4 transition-all active:scale-[0.98] shadow-md border-[var(--color-emerald)]/5 group hover:border-[var(--color-emerald)]/20">
                <div className="bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] rounded-2xl p-3 border border-[var(--color-emerald)]/20 shadow-sm transition-transform group-hover:scale-110"><QrCode className="w-7 h-7" /></div>
                <div className="text-left"><span className="text-base font-black uppercase tracking-tight block">Leitura de QR Mestre</span><span className="text-xs text-[var(--text-secondary)] mt-1 font-medium block">Captura direta de listas por scanner</span></div>
            </button>
          </section>
        </div>

        <input type="file" ref={fileInputRef} accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />

        {csvFileName && csvParsedItems.length > 0 && (
          <div className="fixed inset-x-6 bottom-24 z-40 bg-[var(--bg-secondary)] border-2 border-[var(--color-blue)]/30 rounded-[2rem] p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
             <div className="flex flex-col items-center text-center gap-3">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-blue)]/10 text-[var(--color-blue)] flex items-center justify-center border border-[var(--color-blue)]/20 shadow-inner"><FileCheck className="w-8 h-8" /></div>
                 <h3 className="text-lg font-black uppercase tracking-tight truncate w-full">{csvFileName}</h3>
                 <span className="text-[10px] font-black bg-[var(--color-blue)] text-white px-4 py-1 rounded-full shadow-lg shadow-[var(--card-shadow)]">{csvParsedItems.length} ATIVOS DETECTADOS</span>
             </div>
             <button onClick={handleConfirmImport} className="w-full py-5 button-gradient-primary text-white rounded-[1.25rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-[var(--card-shadow)] active:scale-95 transition-all">Confirmar e Abrir</button>
             <button onClick={() => setCsvFileName(null)} className="w-full text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest hover:text-[var(--color-red)]">Cancelar Seleção</button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-secondary)] border-t border-[var(--border-color)] h-16 px-4 flex items-center justify-around z-50 shadow-2xl transition-colors">
          <button onClick={() => onNavigate && onNavigate('menu')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><BarChart3 className="w-5 h-5 mb-0.5" />Home</button>
          <button onClick={() => onNavigate && onNavigate('batch_list')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><Boxes className="w-5 h-5 mb-0.5" />Arquivos</button>
          <button className="flex flex-col items-center text-[var(--color-blue)] uppercase text-[9px] font-black tracking-tighter"><FileUp className="w-5 h-5 mb-0.5 stroke-[3]" />Importar</button>
          <button onClick={() => onNavigate && onNavigate('settings')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><Sparkles className="w-5 h-5 mb-0.5" />Ajustes</button>
      </nav>
    </div>
  );
};
