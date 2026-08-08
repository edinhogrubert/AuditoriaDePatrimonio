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
import { getStoredBatches, getStoredScanItems, getAuditStatsForBatch, formatDateStr, getAllAssetRecords } from '../services/storage';

interface MainScreenProps {
  onNavigate: (screen: string, filter?: string) => void;
  onOpenBatchDetails?: (batchId: number) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ onNavigate, onOpenBatchDetails }) => {
  const [activeModal, setActiveModal] = useState<'pending' | 'completed' | 'items' | null>(null);
  
  const batches = getStoredBatches();
  const allAssetRecords = getAllAssetRecords();

  const totalAssetsCount = allAssetRecords.length;
  const formattedAssetsCount = totalAssetsCount > 999
    ? `${(totalAssetsCount / 1000).toFixed(1)}k`
    : totalAssetsCount.toString();

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
            <div className="w-8 h-8 rounded-full bg-[var(--bg-accent)] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-[var(--border-color)]">
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
      <main className="p-4 space-y-6 flex-1">
        
        {/* Summary Cards Grid */}
        <section className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigate('batch_list', 'PENDING')}
            className="bg-orange-500/10 text-orange-400 card-elevated p-3.5 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-150 border-orange-500/10"
          >
            <Clock className="w-6 h-6 mb-1 text-orange-400 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-extrabold text-orange-400 leading-none">{displayPending}</span>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-70">Pendentes</span>
          </button>

          <button
            onClick={() => onNavigate('batch_list', 'COMPLETED')}
            className="bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] card-elevated p-3.5 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-150 border-emerald-500/10"
          >
            <CheckCircle2 className="w-6 h-6 mb-1 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-extrabold leading-none">{displayCompleted}</span>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-70">Completas</span>
          </button>

          <button
            onClick={() => onNavigate('assets_list')}
            className="bg-[var(--color-blue)]/10 text-[var(--color-blue)] card-elevated p-3.5 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 duration-150 border-blue-500/10"
          >
            <Boxes className="w-6 h-6 mb-1 opacity-90 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-extrabold leading-none">{formattedAssetsCount}</span>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter opacity-70">Ativos</span>
          </button>
        </section>

        {/* Atalhos Rápidos */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest px-1">Atalhos Rápidos</h2>
          
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('import_inventory')}
              className="w-full bg-[var(--color-emerald)] text-white rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg transition-all font-black text-xs uppercase tracking-widest active:scale-98 button-gradient-success border border-emerald-400/20"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Nova Auditoria</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('sequential_scan')}
                className="card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--text-primary)] p-4 flex flex-col items-start gap-2 transition-all active:scale-95"
              >
                <div className="bg-[var(--bg-primary)] p-2 rounded-xl text-[var(--color-emerald)] border border-[var(--border-color)]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-tight">Leitura Rápida</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Modo Sequencial</span>
                </div>
              </button>

              <button
                onClick={() => onNavigate('general_reports')}
                className="card-elevated hover:bg-[var(--bg-secondary)]/90 text-[var(--text-primary)] p-4 flex flex-col items-start gap-2 transition-all active:scale-95"
              >
                <div className="bg-[var(--bg-primary)] p-2 rounded-xl text-[var(--color-blue)] border border-[var(--border-color)]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-tight">Relatórios</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">Gerais</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Auditorias Recentes */}
        <section className="space-y-3 pt-1">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Auditorias Recentes</h2>
            <button
              onClick={() => onNavigate('batch_list')}
              className="text-[10px] font-bold text-[var(--color-blue)] flex items-center gap-0.5 uppercase tracking-wide hover:underline"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentBatches.length > 0 ? (
              recentBatches.map((batch) => {
                const stats = getAuditStatsForBatch(batch.id);
                const isComplete = stats.progressPercent >= 100;

                return (
                  <div
                    key={batch.id}
                    onClick={() => onOpenBatchDetails && onOpenBatchDetails(batch.id)}
                    className="card-elevated p-4 flex flex-col gap-2.5 shadow-sm hover:border-[var(--color-blue)]/40 transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{batch.name}</h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono-code mt-0.5 block opacity-80">{formatDateStr(batch.timestamp)}</span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          isComplete
                            ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border-[var(--color-emerald)]/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {isComplete ? 'Concluída' : 'Ativa'}
                      </span>
                    </div>

                    {batch.type === 'VERIFICATION' && (
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full ${isComplete ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-blue)]'} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(100, stats.progressPercent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-[var(--text-secondary)] font-mono-code uppercase tracking-tighter">
                          <span>PROCESSO</span>
                          <span>{stats.progressPercent}% ({stats.foundCount}/{stats.totalExpected})</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card-elevated p-8 text-center space-y-2 opacity-60">
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
          <BarChart3 className="w-5 h-5 stroke-[2.5]" />
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
