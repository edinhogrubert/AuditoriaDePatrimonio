import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Search,
  Download,
  PieChart,
  Activity,
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Batch } from '../types';
import {
  formatDateStr,
  getAuditStatsForBatch,
  getScanItemsForBatch,
  getExpectedItemsForBatch,
  exportMultipleBatchesToCsv,
  getStoredScanItems,
  getStoredExpectedItems,
} from '../services/storage';

interface GeneralReportsScreenProps {
  batches: Batch[];
  onBack: () => void;
  onOpenBatchDetails: (batchId: number) => void;
  onNavigateBatchList: () => void;
}

export const GeneralReportsScreen: React.FC<GeneralReportsScreenProps> = ({
  batches,
  onBack,
  onOpenBatchDetails,
  onNavigateBatchList,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batches' | 'timeline' | 'insights'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Global calculations
  const totalBatches = batches.length;
  const verificationBatches = batches.filter((b) => b.type === 'VERIFICATION');
  const collectionBatches = batches.filter((b) => b.type === 'COLLECTION');
  const closedBatches = batches.filter((b) => b.isClosed);
  const openBatches = totalBatches - closedBatches.length;

  const allScans = getStoredScanItems();
  const allExpected = getStoredExpectedItems();

  const totalExpectedAll = allExpected.length;
  const totalFoundAll = allExpected.filter((e) => e.isFound).length;
  const globalProgress = totalExpectedAll > 0 ? Math.round((totalFoundAll / totalExpectedAll) * 100) : (totalBatches > 0 ? 100 : 0);

  // Filtered batches for list
  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Timeline / Date grouping
  const scansByDateMap = new Map<string, number>();
  allScans.forEach((s) => {
    const dateStr = formatDateStr(s.timestamp);
    scansByDateMap.set(dateStr, (scansByDateMap.get(dateStr) || 0) + 1);
  });
  const timelineDates = Array.from(scansByDateMap.entries()).sort((a, b) => {
    return b[0].localeCompare(a[0]);
  });

  // Insights generation
  const getBatchPerformanceInsights = () => {
    return batches.map((b) => {
      const stats = getAuditStatsForBatch(b.id);
      return {
        batch: b,
        stats,
      };
    });
  };

  const batchPerformances = getBatchPerformanceInsights();
  const bestBatch = batchPerformances
    .filter((bp) => bp.batch.type === 'VERIFICATION' && bp.stats.totalExpected > 0)
    .sort((a, b) => b.stats.progressPercent - a.stats.progressPercent)[0];

  const handleExportAll = () => {
    exportMultipleBatchesToCsv(batches, allScans);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] bg-[var(--bg-primary)] flex flex-col max-w-md mx-auto p-6 select-none relative pb-12 shadow-xl border-x border-[var(--border-color)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight">Relatórios & Insights</h1>
            <p className="text-[10px] text-[var(--text-dim)] font-medium">Análise consolidada de auditorias e lotes</p>
          </div>
        </div>
        <button
          onClick={handleExportAll}
          className="p-2.5 rounded-full bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border border-[var(--color-emerald)]/20 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 px-3.5"
          title="Exportar Todos os Dados"
        >
          <Download className="w-4 h-4" />
          <span className="text-[11px] font-bold">Exportar</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-xs my-5 shrink-0">
        {[
          { id: 'dashboard', label: 'Dash', icon: BarChart3 },
          { id: 'batches', label: 'Lotes', icon: Layers },
          { id: 'timeline', label: 'Datas', icon: Calendar },
          { id: 'insights', label: 'Insights', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                isActive
                  ? 'bg-[var(--bg-accent)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pb-6">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-4 space-y-2 border-l-4 border-l-[var(--color-blue)]">
                <div className="flex items-center justify-between text-[var(--text-dim)]">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total de Lotes</span>
                  <Layers className="w-4 h-4 text-[var(--color-blue)]" />
                </div>
                <div className="text-2xl font-black">{totalBatches}</div>
                <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2">
                  <span>{verificationBatches.length} Auditorias</span>
                  <span>•</span>
                  <span>{collectionBatches.length} Simples</span>
                </div>
              </div>

              <div className="card-elevated p-4 space-y-2 border-l-4 border-l-[var(--color-emerald)]">
                <div className="flex items-center justify-between text-[var(--text-dim)]">
                  <span className="text-[10px] font-black uppercase tracking-wider">Acurácia Global</span>
                  <TrendingUp className="w-4 h-4 text-[var(--color-emerald)]" />
                </div>
                <div className="text-2xl font-black text-[var(--color-emerald)]">{globalProgress}%</div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {totalFoundAll} de {totalExpectedAll} itens localizados
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="card-elevated p-3 text-center space-y-1">
                <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase">Ativos Lidos</span>
                <p className="text-base font-black">{allScans.length}</p>
              </div>
              <div className="card-elevated p-3 text-center space-y-1">
                <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase">Concluídos</span>
                <p className="text-base font-black text-[var(--color-emerald)]">{closedBatches.length}</p>
              </div>
              <div className="card-elevated p-3 text-center space-y-1">
                <span className="text-[9px] font-bold text-[var(--text-dim)] uppercase">Em Aberto</span>
                <p className="text-base font-black text-amber-500">{openBatches}</p>
              </div>
            </div>

            {/* Global Progress Bar Card */}
            <div className="card-elevated p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-blue)]" />
                  <h3 className="text-xs font-black uppercase tracking-tight">Progresso Geral de Auditorias</h3>
                </div>
                <span className="text-xs font-bold text-[var(--color-blue)]">{globalProgress}%</span>
              </div>
              <div className="w-full bg-[var(--bg-secondary)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div
                  className="bg-[var(--color-blue)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, globalProgress))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-dim)] font-medium">
                <span>{totalFoundAll} Encontrados</span>
                <span>{totalExpectedAll - totalFoundAll} Pendentes/Faltantes</span>
              </div>
            </div>

            {/* Quick Batch Status Breakdown */}
            <div className="card-elevated p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-500" />
                <span>Status dos Lotes</span>
              </h3>
              <div className="space-y-2">
                {batches.slice(0, 4).map((b) => {
                  const stats = getAuditStatsForBatch(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => onOpenBatchDetails(b.id)}
                      className="p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="space-y-0.5 max-w-[200px]">
                        <p className="text-xs font-bold truncate">{b.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)] uppercase font-semibold">
                          {b.type === 'VERIFICATION' ? 'Auditoria' : 'Coleta Simples'} • {formatDateStr(b.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${
                          b.isClosed ? 'bg-emerald-500/15 text-[var(--color-emerald)]' : 'bg-orange-500/15 text-orange-500'
                        }`}>
                          {b.isClosed ? 'CONCLUÍDO' : `${stats.progressPercent}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POR LOTES (QUANTIDADES & DETALHES) */}
        {activeTab === 'batches' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-dim)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lote por nome ou descrição..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-sky-500 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-3">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-dim)] space-y-2">
                  <Package className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs font-bold">Nenhum lote encontrado</p>
                </div>
              ) : (
                filteredBatches.map((b) => {
                  const scans = getScanItemsForBatch(b.id);
                  const expected = getExpectedItemsForBatch(b.id);
                  const stats = getAuditStatsForBatch(b.id);

                  return (
                    <div
                      key={b.id}
                      onClick={() => onOpenBatchDetails(b.id)}
                      className="card-elevated p-4 space-y-3 cursor-pointer transition-all active:scale-[0.99] border-l-4 border-l-purple-500"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                              {b.type === 'VERIFICATION' ? 'Auditoria' : 'Coleta'}
                            </span>
                            <span className="text-[10px] text-[var(--text-dim)] font-medium">
                              {formatDateStr(b.timestamp)}
                            </span>
                          </div>
                          <h3 className="text-sm font-black mt-1 text-[var(--text-primary)]">{b.name}</h3>
                          <p className="text-[11px] text-[var(--text-secondary)] font-medium line-clamp-1">{b.description || 'Sem descrição'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-dim)] shrink-0 mt-1" />
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-color)] text-center">
                        <div className="bg-[var(--bg-secondary)] p-2 rounded-xl">
                          <span className="text-[9px] text-[var(--text-dim)] uppercase block font-bold">Total Lidos</span>
                          <span className="text-xs font-black">{scans.length}</span>
                        </div>
                        {b.type === 'VERIFICATION' ? (
                          <>
                            <div className="bg-[var(--bg-secondary)] p-2 rounded-xl">
                              <span className="text-[9px] text-[var(--text-dim)] uppercase block font-bold">Esperados</span>
                              <span className="text-xs font-black">{stats.totalExpected}</span>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-2 rounded-xl">
                              <span className="text-[9px] text-[var(--text-dim)] uppercase block font-bold">Achados</span>
                              <span className="text-xs font-black text-[var(--color-emerald)]">{stats.foundCount}</span>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-2 rounded-xl">
                              <span className="text-[9px] text-[var(--text-dim)] uppercase block font-bold">Progresso</span>
                              <span className="text-xs font-black text-[var(--color-blue)]">{stats.progressPercent}%</span>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-3 bg-[var(--bg-secondary)] p-2 rounded-xl flex items-center justify-center gap-2">
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold">Status:</span>
                            <span className="text-[10px] font-black text-[var(--color-emerald)] uppercase">{b.isClosed ? 'Finalizado' : 'Em Andamento'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: POR DATA / LINHA DO TEMPO */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="card-elevated p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-blue)]" />
                <h3 className="text-xs font-black uppercase tracking-tight">Volume de Leituras por Data</h3>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Acompanhe a distribuição temporal dos patrimônios e códigos lidos em todos os lotes.
              </p>
            </div>

            <div className="space-y-3">
              {timelineDates.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-dim)] space-y-2">
                  <Clock className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs font-bold">Nenhum registro de data encontrado</p>
                </div>
              ) : (
                timelineDates.map(([dateStr, count], idx) => (
                  <div key={idx} className="card-elevated p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-sky-500/20">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{dateStr}</h4>
                        <p className="text-[10px] text-[var(--text-dim)] font-medium">Atividade registrada</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[var(--color-blue)]">{count} leituras</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INSIGHTS & RECOMENDAÇÕES */}
        {activeTab === 'insights' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="card-elevated p-5 space-y-3 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-tight">Análise Inteligente de Inventário</h3>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Insights gerados automaticamente com base no volume de auditorias, taxas de acurácia e divergências entre itens esperados e encontrados.
              </p>
            </div>

            <div className="space-y-3">
              {/* Insight 1: Best Performing Batch */}
              {bestBatch && (
                <div className="card-elevated p-4 space-y-2 border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/5">
                  <div className="flex items-center gap-2 text-[var(--color-emerald)]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Destaque de Acurácia</span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    O lote "{bestBatch.batch.name}" lidera com {bestBatch.stats.progressPercent}% de conclusão ({bestBatch.stats.foundCount}/{bestBatch.stats.totalExpected} itens).
                  </p>
                </div>
              )}

              {/* Insight 2: Pending Audits Alert */}
              {openBatches > 0 && (
                <div className="card-elevated p-4 space-y-2 bg-orange-500/5 border-orange-500/30">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Lotes em Aberto</span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Existem {openBatches} lotes/auditorias ainda não finalizados. Recomenda-se revisar as leituras pendentes para fechamento oficial.
                  </p>
                </div>
              )}

              {/* Insight 3: Global Volume */}
              <div className="card-elevated p-4 space-y-2 border border-sky-500/30 bg-[var(--color-blue)]/5">
                <div className="flex items-center gap-2 text-[var(--color-blue)]">
                  <Activity className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Volume Geral de Operações</span>
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Um total de {allScans.length} leituras foram processadas em {totalBatches} lotes cadastrados até o momento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
