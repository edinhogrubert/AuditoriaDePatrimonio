import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  Package,
  Eye,
  Trash2,
  Download,
  SearchCheck,
  BarChart3,
  FileUp,
} from 'lucide-react';
import { Batch } from '../types';
import { formatDateStr, getScanCountForBatch, getAuditStatsForBatch } from '../services/storage';

interface BatchListScreenProps {
  batches: Batch[];
  onBack: () => void;
  onNewBatchClick: () => void;
  onImportInventoryClick: () => void;
  onBatchClick: (batch: Batch) => void;
  onDeleteBatch: (batchId: number) => void;
  onExportClick: () => void;
  initialFilter?: 'ALL' | 'COLLECTION' | 'VERIFICATION' | 'PENDING' | 'COMPLETED';
  hideQuickActions?: boolean;
}

export const BatchListScreen: React.FC<BatchListScreenProps> = ({
  batches,
  onBack,
  onNewBatchClick,
  onImportInventoryClick,
  onBatchClick,
  onDeleteBatch,
  onExportClick,
  initialFilter = 'ALL',
  hideQuickActions = false,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'COLLECTION' | 'VERIFICATION' | 'PENDING' | 'COMPLETED'>(initialFilter);

  const filteredBatches = batches.filter((b) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'COLLECTION') return b.type === 'COLLECTION';
    if (filterType === 'VERIFICATION') return b.type === 'VERIFICATION';

    const stats = getAuditStatsForBatch(b.id);
    if (filterType === 'PENDING') {
      return b.type === 'VERIFICATION' && stats.progressPercent < 100;
    }
    if (filterType === 'COMPLETED') {
      return b.type === 'VERIFICATION' && stats.progressPercent >= 100;
    }
    return true;
  });

  const getTitle = () => {
    if (filterType === 'PENDING') return 'Auditorias Pendentes';
    if (filterType === 'COMPLETED') return 'Auditorias Completas';
    return 'Arquivos';
  };

  // Quick actions visible on main views (Todos, Simples, Auditoria) but hidden on specific status filters (Pendentes, Completas)
  const showActions = !hideQuickActions && filterType !== 'PENDING' && filterType !== 'COMPLETED';

  const getTabBgColor = (id: string) => {
    switch (id) {
      case 'VERIFICATION': return 'bg-[var(--color-blue)]';
      case 'COLLECTION': return 'bg-purple-600';
      case 'PENDING': return 'bg-orange-500';
      case 'COMPLETED': return 'bg-[var(--color-emerald)]';
      default: return 'bg-sky-700'; // For 'ALL' (Todos)
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col max-w-md mx-auto p-6 select-none relative pb-10 shadow-xl border-x border-[var(--border-color)] bg-[var(--bg-primary)] transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">{getTitle()}</h1>
            <span className="text-[9px] font-mono font-bold bg-[var(--bg-secondary)] text-[var(--color-blue)] px-2.5 py-0.5 rounded-md border border-[var(--border-color)]">
              BatchListScreen.tsx
            </span>
          </div>
        </div>
        <button
          onClick={onExportClick}
          className="p-2.5 rounded-full bg-[var(--bg-accent)]/10 text-[var(--color-blue)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          title="Exportar Múltiplos"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="py-6 space-y-6 flex-1 overflow-hidden flex flex-col">
        {/* Quick Action Row */}
        {showActions && (
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={onNewBatchClick}
              className="card-elevated p-5 flex flex-col items-start gap-3 transition-all active:scale-95 border-purple-500/10"
            >
              <div className="w-11 h-11 rounded-[1rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-sm">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-purple-600">Lote Vazio</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">Coleta do zero</p>
              </div>
            </button>

            <button
              onClick={onImportInventoryClick}
              className="card-elevated p-5 flex flex-col items-start gap-3 transition-all active:scale-95 border-blue-500/10"
            >
              <div className="w-11 h-11 rounded-[1rem] bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 flex items-center justify-center text-[var(--color-blue)] shadow-sm">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--color-blue)]">Importar</h3>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">Lista de bens</p>
              </div>
            </button>
          </div>
        )}

        {/* Custom Tabs - 1+4 Layout */}
        <div className="flex flex-col gap-2 shrink-0">
          {/* Row 1: Todos (Full Width) */}
          <button
            onClick={() => setFilterType('ALL')}
            className={`w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-200 border ${
              filterType === 'ALL'
              ? 'bg-sky-700 border-sky-600 text-white shadow-lg'
              : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-dim)] hover:text-[var(--text-primary)] shadow-sm'
            }`}
          >
            Todos os Arquivos
          </button>

          {/* Row 2: Others (All in one line) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
             {(
               [
                 { id: 'PENDING', label: 'Pendentes' },
                 { id: 'COMPLETED', label: 'Completas' },
                 { id: 'COLLECTION', label: 'Simples' },
                 { id: 'VERIFICATION', label: 'Auditoria' },
               ] as const
             ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`flex-1 min-w-[85px] py-2.5 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 border whitespace-nowrap ${
                    filterType === tab.id
                    ? `${getTabBgColor(tab.id)} border-transparent text-white shadow-md`
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-dim)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
             ))}
          </div>
        </div>

        {/* Batch List */}
        {filteredBatches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-dim)] mb-4 border border-[var(--border-color)] shadow-inner">
                <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Vazio</h3>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar pb-6">
            {filteredBatches.map((batch) => {
              const isVerification = batch.type === 'VERIFICATION';
              const stats = isVerification ? getAuditStatsForBatch(batch.id) : null;

              return (
                <div
                  key={batch.id}
                  className={`card-elevated p-5 flex items-center justify-between gap-5 transition-all hover:border-[var(--text-dim)] group shadow-md ${isVerification ? 'border-blue-500/10' : 'border-purple-500/10'}`}
                >
                  <div
                    onClick={() => onBatchClick(batch)}
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 border transition-transform group-active:scale-95 ${isVerification ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)] border-[var(--color-blue)]/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                      {isVerification ? <SearchCheck className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{batch.name}</h3>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold font-mono-code uppercase tracking-tighter">
                        {isVerification && stats
                          ? `${stats.foundCount}/${stats.totalExpected} auditados (${stats.progressPercent}%)`
                          : `${getScanCountForBatch(batch.id)} registros • ${formatDateStr(batch.timestamp)}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => { if (confirm(`Deseja apagar o lote "${batch.name}"?`)) onDeleteBatch(batch.id); }}
                    className="p-3 text-[var(--text-dim)] hover:text-[var(--color-red)] hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
