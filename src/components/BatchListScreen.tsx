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
}

export const BatchListScreen: React.FC<BatchListScreenProps> = ({
  batches,
  onBack,
  onNewBatchClick,
  onImportInventoryClick,
  onBatchClick,
  onDeleteBatch,
  onExportClick,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'COLLECTION' | 'VERIFICATION'>('ALL');

  const filteredBatches = batches.filter((b) => {
    if (filterType === 'ALL') return true;
    return b.type === filterType;
  });

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col max-w-md mx-auto p-6 select-none relative pb-10 shadow-xl border-x border-[var(--border-color)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">Arquivos</h1>
        </div>
        <button
          onClick={onExportClick}
          className="p-2.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 active:scale-95 transition-all shadow-sm"
          title="Exportar Múltiplos"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="py-6 space-y-6 flex-1 overflow-hidden flex flex-col">
        {/* Quick Action Row */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button
            onClick={onNewBatchClick}
            className="card-elevated p-5 flex flex-col items-start gap-3 transition-all active:scale-95 border-purple-500/10"
          >
            <div className="w-11 h-11 rounded-[1rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-purple-500">Lote Vazio</h3>
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

        {/* Custom Tabs */}
        <div className="flex gap-2 p-1.5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-inner shrink-0">
          {(['ALL', 'COLLECTION', 'VERIFICATION'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-200 ${
                filterType === type
                ? (type === 'VERIFICATION' ? 'bg-[var(--color-blue)]' : type === 'COLLECTION' ? 'bg-purple-500' : 'bg-[var(--text-primary)] text-[var(--bg-primary)]') + ' text-white shadow-lg'
                : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type === 'COLLECTION' ? 'Simples' : 'Auditoria'}
            </button>
          ))}
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
