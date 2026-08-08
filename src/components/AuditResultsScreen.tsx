import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
  Check,
  X,
  Package,
  Laptop,
  Trash2,
  Bell,
  Boxes,
  BarChart3,
  Sparkles,
  FileUp,
} from 'lucide-react';
import { Batch, ExpectedItem, ScanItem } from '../types';
import {
  getExpectedItemsForBatch,
  getScanItemsForBatch,
  getAuditStatsForBatch,
  exportAuditReportCsv,
  deleteScanItemAndSync,
  formatTimeStr,
  formatDateStr,
} from '../services/storage';

interface AuditResultsScreenProps {
  batch: Batch;
  onBack: () => void;
  onContinueScanning: () => void;
  onNavigate?: (screen: string) => void;
}

export const AuditResultsScreen: React.FC<AuditResultsScreenProps> = ({
  batch,
  onBack,
  onContinueScanning,
  onNavigate,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'found' | 'missing' | 'extra'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const expectedItems = getExpectedItemsForBatch(batch.id);
  const scanItems = getScanItemsForBatch(batch.id);
  const stats = getAuditStatsForBatch(batch.id);

  const expectedBarcodes = new Set(expectedItems.map((e) => e.barcode.toLowerCase()));
  const extraScans = scanItems.filter((s) => !expectedBarcodes.has(s.barcode.toLowerCase()));

  const filteredExpected = expectedItems.filter((item) => {
    const matchesSearch = item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterTab === 'found') return item.isFound;
    if (filterTab === 'missing') return !item.isFound;
    if (filterTab === 'extra') return false;
    return true;
  });

  const filteredExtras = extraScans.filter((item) => {
    if (filterTab === 'found' || filterTab === 'missing') return false;
    return item.barcode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportCsv = () => {
    let finalExpected: ExpectedItem[] | undefined = undefined;
    let finalExtras: ScanItem[] | undefined = undefined;

    if (filterTab === 'found') {
        finalExpected = expectedItems.filter(e => e.isFound);
        finalExtras = [];
    } else if (filterTab === 'missing') {
        finalExpected = expectedItems.filter(e => !e.isFound);
        finalExtras = [];
    } else if (filterTab === 'extra') {
        finalExpected = [];
        finalExtras = extraScans;
    }

    exportAuditReportCsv(batch, finalExpected, finalExtras);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col max-w-md mx-auto select-none relative pb-32 border-x border-[var(--border-color)]">
      
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">Análise</h1>
        </div>
        <button
            onClick={onContinueScanning}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl active:scale-95 transition-all shadow-sm"
        >
            Continuar
        </button>
      </header>

      <main className="p-6 space-y-7 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-3">
          <h1 className="text-2xl font-black tracking-tighter uppercase truncate leading-none">{batch.name}</h1>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">{formatDateStr(batch.timestamp)} • Auditoria Ativa</p>
            <span className="text-[10px] font-black text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-3 py-1 rounded-xl border border-[var(--color-emerald)]/20 shadow-inner">{stats.progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden shadow-inner p-0.5 border border-[var(--border-color)]">
             <div className="h-full bg-[var(--color-emerald)] shadow-[var(--card-shadow)] transition-all duration-700 rounded-full" style={{ width: `${stats.progressPercent}%` }} />
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-[var(--text-dim)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por Código ou Nome..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:border-[var(--color-blue)] shadow-md transition-all placeholder-[var(--text-dim)]/50"
          />
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Todos', count: expectedItems.length + extraScans.length },
            { id: 'found', label: 'OK', count: stats.foundCount },
            { id: 'missing', label: 'Falta', count: stats.missingCount },
            { id: 'extra', label: 'Extra', count: stats.extraCount }
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilterTab(tab.id as any)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm ${filterTab === tab.id ? 'bg-[var(--bg-secondary)] border-[var(--text-dim)] text-white shadow-inner' : 'bg-transparent border-[var(--border-color)] text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}>
               {tab.label} <span className="opacity-40 ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredExpected.map(item => (
            <div key={item.id} className="card-elevated p-5 flex items-center gap-5 transition-all hover:border-[var(--text-dim)] shadow-md relative overflow-hidden group">
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isFound ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-red)]'}`} />
               <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center border transition-all ${item.isFound ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border-[var(--color-emerald)]/20' : 'bg-[var(--color-red)]/10 text-[var(--color-red)] border-[var(--color-red)]/20 shadow-inner'}`}><Laptop className="w-6 h-6 group-hover:scale-110 transition-transform" /></div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black truncate uppercase tracking-tight text-[var(--text-primary)]">{item.description || `Ativo ${item.barcode}`}</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] font-mono-code mt-1 tracking-wider">ID: {item.barcode}</p>
               </div>
               <div className="text-right">
                  <span className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border shadow-sm ${item.isFound ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border-[var(--color-emerald)]/20' : 'bg-[var(--color-red)]/10 text-[var(--color-red)] border-[var(--color-red)]/20'}`}>{item.isFound ? 'ENCONTRADO' : 'FALTANTE'}</span>
                  <p className="text-[8px] font-black text-[var(--text-dim)] mt-2 font-mono-code">{item.timestampFound ? formatTimeStr(item.timestampFound) : '--:--:--'}</p>
               </div>
            </div>
          ))}

          {filteredExtras.map(scan => (
            <div key={scan.id} className="card-elevated p-5 flex items-center gap-5 transition-all hover:border-[var(--color-blue)]/40 shadow-md relative overflow-hidden group">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-blue)]" />
               <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform"><Package className="w-6 h-6" /></div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black truncate uppercase tracking-tight text-[var(--text-primary)]">Sobra de Estoque</h3>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] font-mono-code mt-1 tracking-wider">ID: {scan.barcode}</p>
               </div>
               <div className="text-right">
                  <span className="text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border bg-[var(--color-blue)]/10 text-[var(--color-blue)] border-[var(--color-blue)]/20 shadow-sm">EXCEDENTE</span>
                  <p className="text-[8px] font-black text-[var(--text-dim)] mt-2 font-mono-code">{formatTimeStr(scan.timestamp)}</p>
               </div>
            </div>
          ))}

          {filteredExpected.length === 0 && filteredExtras.length === 0 && (
            <div className="py-20 text-center opacity-30">
               <Package className="w-10 h-10 mx-auto mb-3" />
               <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent z-40">
        <button onClick={handleExportCsv} className="w-full h-16 button-gradient-primary text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-[var(--card-shadow)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-blue-400/20">
          <Download className="w-5 h-5" />
          Exportar Relatório {filterTab !== 'all' ? `(${filterTab})` : ''}
        </button>
      </div>

      {/* Nav Bar consistency */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-secondary)] border-t border-[var(--border-color)] h-16 px-4 flex items-center justify-around z-50">
          <button onClick={() => onNavigate && onNavigate('menu')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><BarChart3 className="w-5 h-5 mb-0.5" />Home</button>
          <button onClick={() => onNavigate && onNavigate('batch_list')} className="flex flex-col items-center text-[var(--color-emerald)] uppercase text-[9px] font-black tracking-tighter"><Boxes className="w-5 h-5 mb-0.5 stroke-[3]" />Arquivos</button>
          <button onClick={() => onNavigate && onNavigate('import_inventory')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><FileUp className="w-5 h-5 mb-0.5" />Importar</button>
          <button onClick={() => onNavigate && onNavigate('settings')} className="flex flex-col items-center text-[var(--text-dim)] uppercase text-[9px] font-bold tracking-tighter"><Sparkles className="w-5 h-5 mb-0.5" />Ajustes</button>
      </nav>
    </div>
  );
};
