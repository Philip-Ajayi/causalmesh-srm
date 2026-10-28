import React from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Zap
} from 'lucide-react';
import { soundEngine } from '../services/audio';

interface HeaderProps {
  hasActiveDisruption: boolean;
  isSolving: boolean;
  onOpenDisruptionModal: () => void;
  onReset: () => void;
  activeScreen: 'topology' | 'command' | 'workbench' | 'audit';
  setActiveScreen: (screen: 'topology' | 'command' | 'workbench' | 'audit') => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  isMockMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasActiveDisruption,
  isSolving,
  onOpenDisruptionModal,
  onReset,
  activeScreen,
  setActiveScreen,
  audioEnabled,
  setAudioEnabled,
  isMockMode
}) => {
  return (
    <header className="border-b border-darkborder bg-[#0E1322] px-6 py-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand & System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${hasActiveDisruption ? 'bg-red-950/70 border-red-500 text-red-400 animate-pulse-fast' : 'bg-emerald-950/60 border-emerald-500 text-emerald-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base text-white">CAUSALMESH</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-cyan-950/70 text-cyan-400 border border-cyan-700/60 font-semibold">SRM ENGINE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>4-TIER AUTOMOTIVE DAG</span>
                {isMockMode && <span className="text-amber-400 font-semibold">| BROWSER-STANDALONE SIMULATOR</span>}
              </div>
            </div>
          </div>

          {/* Disruption Alert Pill */}
          {hasActiveDisruption && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/40 border border-red-500/80 text-red-200 text-xs font-mono font-medium animate-pulse">
              <AlertTriangle className="w-4 h-4 text-brandred" />
              <span>ACTIVE DISRUPTION CASCADE: LINE 3 AT RISK</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-[#090D16] p-1 rounded-lg border border-darkborder">
          <button
            onClick={() => setActiveScreen('topology')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeScreen === 'topology' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Dependency Topology
          </button>
          <button
            onClick={() => setActiveScreen('command')}
            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition ${activeScreen === 'command' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Blast Command Center
            {hasActiveDisruption && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveScreen('workbench')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeScreen === 'workbench' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Remediation Workbench
          </button>
          <button
            onClick={() => setActiveScreen('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeScreen === 'audit' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Audit Log & ERP Outbox
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              soundEngine.enabled = next;
            }}
            title={audioEnabled ? 'Telemetry Audio Active' : 'Audio Muted'}
            className="p-2 rounded-lg bg-slate-900 border border-darkborder text-slate-400 hover:text-white transition"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Trigger Disruption Button */}
          <button
            onClick={onOpenDisruptionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-900/30"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Simulate Disruption</span>
          </button>

          {/* Reset simulation */}
          <button
            onClick={onReset}
            title="Reset DAG to Nominal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-darkborder text-slate-300 text-xs font-medium transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
