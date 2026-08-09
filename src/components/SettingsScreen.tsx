import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  Vibrate,
  Camera,
  RotateCcw,
  Database,
  FileJson,
  Upload,
  CheckCircle2,
  Download,
  FileCode,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
import { AppSettings, DeletePermission } from '../types';
import { saveSettings } from '../services/storage';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
  onResetData: () => void;
  onLoadDemo: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onResetData,
  onLoadDemo,
}) => {
  const [current, setCurrent] = useState<AppSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  const toggle = (key: keyof AppSettings) => {
    const updated = { ...current, [key]: !current[key] };
    setCurrent(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const updateSetting = (key: keyof AppSettings, val: any) => {
    const updated = { ...current, [key]: val };
    setCurrent(updated);
    onUpdateSettings(updated);
    saveSettings(updated);
  };

  const handleBackupExport = () => {
    const backup = {
      batches: localStorage.getItem('inventario_batches_v2'),
      items: localStorage.getItem('inventario_scan_items_v2'),
      expected: localStorage.getItem('inventario_expected_items_v2'),
      settings: localStorage.getItem('inventario_settings_v2'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `backup_ia_${Date.now()}.json`;
    link.click();
    document.body.removeChild(link);
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.batches) localStorage.setItem('inventario_batches_v2', data.batches);
        if (data.items) localStorage.setItem('inventario_scan_items_v2', data.items);
        if (data.expected) localStorage.setItem('inventario_expected_items_v2', data.expected);
        if (data.settings) localStorage.setItem('inventario_settings_v2', data.settings);
        alert('Dados restaurados!');
        window.location.reload();
      } catch (err) { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] bg-[var(--bg-primary)] flex flex-col max-w-md mx-auto p-6 select-none relative pb-12 border-x border-[var(--border-color)]">
      <div className="space-y-8 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="px-1 pt-2">
          <span className="text-[10px] font-mono font-bold bg-[var(--bg-secondary)] text-[var(--color-blue)] px-2.5 py-1 rounded-md border border-[var(--border-color)] shadow-xs inline-block">
            SettingsScreen.tsx
          </span>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 rounded-full bg-[var(--bg-secondary)] active:scale-95 transition-all shadow-sm border border-[var(--border-color)]"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-black uppercase tracking-tight">Ajustes</h1>
          </div>
          {savedNotice && <span className="text-[9px] font-black uppercase text-[var(--color-emerald)] bg-[var(--color-emerald)]/10 px-3 py-1.5 rounded-xl border border-[var(--color-emerald)]/20 animate-in fade-in zoom-in-95">Salvo ✓</span>}
        </div>

        {/* Tema / Personalização */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] ml-1">Estética do Sistema</h2>
          <div className="card-elevated p-6 space-y-6 shadow-lg border-blue-500/5">
             <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/10"><Monitor className="w-6 h-6" /></div>
                <div><h3 className="text-sm font-black uppercase tracking-tight">Tema Visual</h3><p className="text-[10px] text-[var(--text-dim)] font-medium mt-1">Alternar modo claro e escuro</p></div>
             </div>
             <div className="grid grid-cols-2 gap-3 p-1.5 bg-[var(--bg-primary)] rounded-[1.25rem] border border-[var(--border-color)] shadow-inner">
                <button onClick={() => updateSetting('theme', 'light')} className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${current.theme === 'light' ? 'bg-[var(--btn-primary-bg)] text-white shadow-xs font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'}`}><Sun className={`w-4 h-4 ${current.theme === 'light' ? 'fill-current' : ''}`} /><span className="text-xs uppercase tracking-wider">Claro</span></button>
                <button onClick={() => updateSetting('theme', 'dark')} className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${current.theme === 'dark' ? 'bg-[var(--btn-primary-bg)] text-white shadow-xs font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'}`}><Moon className={`w-4 h-4 ${current.theme === 'dark' ? 'fill-current' : ''}`} /><span className="text-xs uppercase tracking-wider">Escuro</span></button>
             </div>
          </div>
        </div>

        {/* Permissão de Exclusão */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] ml-1">
            Segurança de Leituras
          </h2>
          <div className="card-elevated p-6 space-y-5 shadow-lg border-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Exclusão de Registros</h3>
                <p className="text-[10px] text-[var(--text-dim)] font-medium mt-0.5">
                  Proteção contra apagar linhas acidentalmente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[var(--bg-primary)] rounded-[1.25rem] border border-[var(--border-color)] shadow-inner">
              <button
                onClick={() => updateSetting('deletePermission', 'LOCKED')}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all ${
                  current.deletePermission === 'LOCKED'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-tight text-center">Bloqueado</span>
              </button>

              <button
                onClick={() => updateSetting('deletePermission', 'ONCE')}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all ${
                  current.deletePermission === 'ONCE'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-tight text-center">Liberar 1x</span>
              </button>

              <button
                onClick={() => updateSetting('deletePermission', 'ALWAYS')}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all ${
                  current.deletePermission === 'ALWAYS'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-tight text-center">Sempre Lib.</span>
              </button>
            </div>

            <p className="text-[10px] text-[var(--text-dim)] font-medium italic leading-relaxed">
              {current.deletePermission === 'LOCKED' &&
                '• O botão de lixeira fica visível porém esmaecido. Ao clicar, solicitará confirmação de liberação.'}
              {current.deletePermission === 'ONCE' &&
                '• A exclusão está liberada para a próxima linha e será bloqueada automaticamente logo após.'}
              {current.deletePermission === 'ALWAYS' &&
                '• Botão de lixeira liberado sem restrições em todas as telas de leitura.'}
            </p>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] ml-1">Respostas Háticas</h2>
          <div className="card-elevated p-1.5 shadow-md divide-y divide-[var(--border-color)]">
            <div className="flex items-center justify-between p-4.5 py-5 px-5">
                <div className="flex items-center gap-4"><div className="p-2.5 rounded-xl bg-[var(--color-emerald)]/10 text-[var(--color-emerald)] border border-[var(--color-emerald)]/10"><Volume2 className="w-5 h-5" /></div><span className="text-[11px] font-black uppercase tracking-widest">Bipe Sonoro</span></div>
                <button onClick={() => toggle('soundEnabled')} className={`w-12 h-7 rounded-full relative transition-all duration-300 shadow-inner ${current.soundEnabled ? 'bg-[var(--color-emerald)]' : 'bg-[var(--text-dim)]/30'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${current.soundEnabled ? 'left-6' : 'left-1'}`} /></button>
            </div>
            <div className="flex items-center justify-between p-4.5 py-5 px-5">
                <div className="flex items-center gap-4"><div className="p-2.5 rounded-xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/10"><Vibrate className="w-5 h-5" /></div><span className="text-[11px] font-black uppercase tracking-widest">Vibrar Motor</span></div>
                <button onClick={() => toggle('vibrationEnabled')} className={`w-12 h-7 rounded-full relative transition-all duration-300 shadow-inner ${current.vibrationEnabled ? 'bg-[var(--color-emerald)]' : 'bg-[var(--text-dim)]/30'}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${current.vibrationEnabled ? 'left-6' : 'left-1'}`} /></button>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="space-y-4">
           <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] ml-1">Dados & Manutenção</h2>
           <div className="card-elevated p-6 space-y-4 shadow-lg">
              <button
                onClick={() => {
                  if (confirm('Deseja carregar os dados de demonstração? Isso substituirá seus dados atuais.')) {
                    onLoadDemo();
                  }
                }}
                className="w-full py-4.5 bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-emerald)] shadow-sm hover:bg-[var(--color-emerald)]/20"
              >
                <Sparkles className="w-4.5 h-4.5" /> Carregar Dados de Exemplo
              </button>

              <button onClick={handleBackupExport} className="w-full py-4.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-blue)] shadow-sm hover:border-[var(--color-blue)]/30"><Download className="w-4.5 h-4.5" />Backup do Sistema</button>
              <label className="w-full py-4.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-primary)] cursor-pointer shadow-sm hover:border-[var(--text-dim)]/30"><Upload className="w-4.5 h-4.5" />Restaurar Banco<input type="file" accept=".json" className="hidden" onChange={handleBackupImport} /></label>
              <button onClick={() => { if(confirm('⚠️ Esta ação apagará TUDO. Continuar?')) onResetData(); }} className="w-full py-4.5 bg-[var(--color-red)]/5 border border-[var(--color-red)]/20 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-red)] hover:bg-[var(--color-red)]/10"><RotateCcw className="w-4.5 h-4.5" />Zerar Aplicação</button>
           </div>
        </div>
      </div>

      <div className="pt-10 flex flex-col items-center opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.4em]">Inventário Profissional</p>
          <p className="text-[7px] font-bold uppercase mt-1 tracking-widest">v2.1 Build Quail</p>
      </div>
    </div>
  );
};
