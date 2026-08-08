import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  Boxes,
  PlusCircle,
  QrCode,
  BarChart3,
  ChevronRight,
  Sparkles,
  X,
  Play,
  Package,
} from 'lucide-react';
import { getStoredBatches, getStoredScanItems, getAuditStatsForBatch, formatDateStr } from '../services/storage';

interface MainScreenProps {
  onNavigate: (screen: string) => void;
  onOpenBatchDetails?: (batchId: number) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate, onOpenBatchDetails }) => {
  const [activeModal, setActiveModal] = useState<'pending' | 'completed' | 'items' | null>(null);
  
  const batches = getStoredBatches();
  const scanItems = getStoredScanItems();

  const totalItemsCount = scanItems.length;
  const formattedItemsCount = totalItemsCount > 999 
    ? `${(totalItemsCount / 1000).toFixed(1)}k` 
    : totalItemsCount.toString();

  const verificationBatches = batches.filter((b) => b.type === 'VERIFICATION');
  let completedCount = 0;
  let pendingCount = 0;

  const pendingBatchesList: typeof batches = [];
  const completedBatchesList: typeof batches = [];

  verificationBatches.forEach((b) => {
    const stats = getAuditStatsForBatch(b.id);
    if (stats.progressPercent >= 100) {
      completedCount++;
      completedBatchesList.push(b);
    } else {
      pendingCount++;
      pendingBatchesList.push(b);
    }
  });

  const displayPending = pendingCount;
  const displayCompleted = completedCount;
  const recentBatches = batches.slice(0, 3);

  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col justify-between max-w-md mx-auto select-none relative pb-24 border-x border-[var(--border-color)]">
      
      {/* TopAppBar */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-accent)] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-white/10">
              <span className="font-extrabold text-sm">EGS</span>
            </div>
            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-0.5 ml-0.5">Grubert</span>
          </div>
          <h1 className="text-base font-bold text-[var(--text-primary)]">Inventário & Auditoria</h1>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-full transition-colors relative active:scale-95"
          title="Ajustes"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-red)] shadow-sm"></span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-7 flex-1">
        
        {/* Summary Cards Grid */}
        <section className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveModal('pending')}
            className="bg-[#5d3900]/10 text-[#ffddb8] card-elevated p-4 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-200 border-orange-500/10"
          >
            <Clock className="w-6 h-6 mb-1 text-orange-400 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-orange-400 leading-none">{displayPending}</span>
            <span className="text-[9px] font-black mt-1 uppercase tracking-widest opacity-60">Pendentes</span>
          </button>

          <button
            onClick={() => setActiveModal('completed')}
            className="bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] card-elevated p-4 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-200 border-emerald-500/10"
          >
            <CheckCircle2 className="w-6 h-6 mb-1 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black leading-none">{displayCompleted}</span>
            <span className="text-[9px] font-black mt-1 uppercase tracking-widest opacity-60">Completas</span>
          </button>

          <button
            onClick={() => setActiveModal('items')}
            className="bg-[var(--color-blue)]/10 text-[var(--color-blue)] card-elevated p-4 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-200 border-blue-500/10"
          >
            <Boxes className="w-6 h-6 mb-1 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black leading-none">{formattedItemsCount}</span>
            <span className="text-[9px] font-black mt-1 uppercase tracking-widest opacity-60">Ativos</span>
          </button>
        </section>

        {/* Atalhos Rápidos */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1">Atalhos Rápidos</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('import_inventory')}
              className="w-full bg-[var(--color-emerald)] text-white rounded-2xl py-4 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 transition-all font-black text-xs uppercase tracking-[0.15em] active:scale-98 button-gradient-success border border-emerald-400/20"
            >
              <PlusCircle className="w-5 h-5 text-white/80" />
              <span>Nova Auditoria</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('sequential_scan')}
                className="card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--text-primary)] p-5 flex flex-col items-start gap-3 transition-all active:scale-95"
              >
                <div className="bg-[var(--bg-primary)] p-2.5 rounded-2xl text-[var(--color-emerald)] border border-[var(--border-color)] shadow-inner">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">Leitura Rápida</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1 block">Modo Sequencial</span>
                </div>
              </button>

              <button
                onClick={() => onNavigate('batch_list')}
                className="card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--text-primary)] p-5 flex flex-col items-start gap-3 transition-all active:scale-95"
              >
                <div className="bg-[var(--bg-primary)] p-2.5 rounded-2xl text-[var(--color-blue)] border border-[var(--border-color)] shadow-inner">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider block">Inventário</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1 block">Gerenciar Lotes</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Auditorias Recentes */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Auditorias Recentes</h2>
            <button
              onClick={() => onNavigate('batch_list')}
              className="text-[10px] font-black text-[var(--color-blue)] flex items-center gap-1 uppercase tracking-widest hover:underline"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentBatches.length > 0 ? (
              recentBatches.map((batch) => {
                const stats = getAuditStatsForBatch(batch.id);
                const isComplete = stats.progressPercent >= 100;

                return (
                  <div
                    key={batch.id}
                    onClick={() => onOpenBatchDetails && onOpenBatchDetails(batch.id)}
                    className="card-elevated p-5 flex flex-col gap-3 shadow-sm hover:border-[var(--color-blue)]/30 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-tight">{batch.name}</h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono-code mt-1 block opacity-80">{formatDateStr(batch.timestamp)}</span>
                      </div>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                          isComplete
                            ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border-[var(--color-emerald)]/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {isComplete ? 'Concluída' : 'Ativa'}
                      </span>
                    </div>

                    {batch.type === 'VERIFICATION' && (
                      <div className="space-y-1.5 pt-1">
                        <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full ${isComplete ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-blue)]'} transition-all duration-700 rounded-full`}
                            style={{ width: `${Math.min(100, stats.progressPercent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-[var(--text-secondary)] font-mono-code uppercase tracking-tighter">
                          <span>Processamento</span>
                          <span>{stats.progressPercent}% • {stats.foundCount}/{stats.totalExpected}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card-elevated p-10 text-center space-y-3 opacity-60">
                <Package className="w-10 h-10 text-[var(--text-dim)] mx-auto opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Sem registros recentes</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--bg-secondary)] border-t border-[var(--border-color)] h-16 px-4 flex items-center justify-around z-50 shadow-2xl transition-colors">
        <button
          onClick={() => onNavigate('menu')}
          className="flex flex-col items-center justify-center text-[var(--color-blue)] px-4 py-1.5 transition-all"
        >
          <BarChart3 className="w-5 h-5 stroke-[3]" />
          <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">Home</span>
        </button>

        <button
          onClick={() => onNavigate('batch_list')}
          className="flex flex-col items-center justify-center text-[var(--text-dim)] px-3 py-1 transition-all hover:text-[var(--text-primary)]"
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">Lotes</span>
        </button>

        <button
          onClick={() => onNavigate('import_inventory')}
          className="flex flex-col items-center justify-center text-[var(--text-dim)] px-3 py-1 transition-all hover:text-[var(--text-primary)]"
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">Importar</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="flex flex-col items-center justify-center text-[var(--text-dim)] px-3 py-1 transition-all hover:text-[var(--text-primary)]"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};
