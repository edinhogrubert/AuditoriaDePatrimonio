import React, { useState } from 'react';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { Batch, ScanItem } from '../types';
import { formatDateStr, getScanCountForBatch, exportMultipleBatchesToCsv } from '../services/storage';

interface ExportBatchesScreenProps {
  batches: Batch[];
  allItems: ScanItem[];
  onBack: () => void;
}

export const ExportBatchesScreen: React.FC<ExportBatchesScreenProps> = ({
  batches,
  allItems,
  onBack,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allSelected = batches.length > 0 && selectedIds.length === batches.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(batches.map((b) => b.id));
    }
  };

  const toggleBatch = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((bId) => bId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = () => {
    const selectedBatches = batches.filter((b) => selectedIds.includes(b.id));
    if (selectedBatches.length > 0) {
      exportMultipleBatchesToCsv(selectedBatches, allItems);
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col justify-between max-w-md mx-auto p-6 select-none relative border-x border-[var(--border-color)] pb-8">
      <div className="space-y-8 flex-1 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[var(--border-color)] shrink-0">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight">Exportar</h1>
        </div>

        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed px-1 shrink-0">
          Selecione múltiplos arquivos para gerar um relatório consolidado.
        </p>

        {/* Select All Card */}
        <button
          onClick={toggleSelectAll}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center gap-4 text-left hover:border-[var(--text-dim)] transition-all shadow-md shrink-0"
        >
          <div
            className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
              allSelected
                ? 'bg-[var(--color-blue)] border-[var(--color-blue)] text-white shadow-lg'
                : 'border-[var(--border-color)] bg-[var(--bg-primary)] shadow-inner'
            }`}
          >
            {allSelected && <Check className="w-4 h-4 stroke-[4]" />}
          </div>
          <span className="text-sm font-black uppercase tracking-widest flex-1">
            Selecionar Todos
          </span>
          <span className="text-[10px] font-bold text-[var(--text-dim)] font-mono">
            {batches.length} LOTES
          </span>
        </button>

        {/* Batches List */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar pb-4">
          {batches.map((batch) => {
            const isSelected = selectedIds.includes(batch.id);
            const count = getScanCountForBatch(batch.id);

            return (
              <div
                key={batch.id}
                onClick={() => toggleBatch(batch.id)}
                className={`w-full card-elevated p-5 flex items-center gap-4 cursor-pointer transition-all shadow-sm ${
                  isSelected ? 'border-[var(--color-blue)]/50 bg-[var(--bg-secondary)]/90' : 'hover:border-[var(--text-dim)]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[var(--color-blue)] border-[var(--color-blue)] text-white'
                      : 'border-[var(--border-color)] bg-[var(--bg-primary)] shadow-inner'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-tight truncate">
                    {batch.name}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold font-mono-code mt-1 opacity-80 uppercase tracking-tighter">
                    {count} itens • {formatDateStr(batch.timestamp)}
                  </p>
                </div>

                <span className={`text-[8px] font-black px-2 py-1 rounded-md border uppercase tracking-widest ${isSelected ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)] border-[var(--color-blue)]/20' : 'bg-[var(--bg-primary)] text-[var(--text-dim)] border-[var(--border-color)]'}`}>
                  CSV
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Action Button */}
      <div className="pt-6">
        <button
          onClick={handleExport}
          disabled={selectedIds.length === 0}
          className={`w-full h-16 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl ${
            selectedIds.length > 0
              ? 'button-gradient-primary text-white shadow-blue-900/10 border border-blue-400/20'
              : 'bg-[var(--bg-secondary)] text-[var(--text-dim)] cursor-not-allowed border border-[var(--border-color)] opacity-40'
          }`}
        >
          <Download className="w-5 h-5" />
          Gerar Relatório ({selectedIds.length})
        </button>
      </div>
    </div>
  );
};
