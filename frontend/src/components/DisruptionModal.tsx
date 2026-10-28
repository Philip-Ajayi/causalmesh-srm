import React, { useState } from 'react';
import { X, AlertTriangle, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDisruption: (nodeId: string, delayDays: number, reason: string) => void;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  onClose,
  onTriggerDisruption
}) => {
  const [selectedNode, setSelectedNode] = useState('T3-APEX-FAB');
  const [delayDays, setDelayDays] = useState(10);
  const [reason, setReason] = useState('Cleanroom Contamination Event');

  if (!isOpen) return null;

  const handleApplyPreset = (node: string, days: number, r: string) => {
    setSelectedNode(node);
    setDelayDays(days);
    setReason(r);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playDisruptionAlarm();
    onTriggerDisruption(selectedNode, delayDays, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#0F1424] border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Flame className="w-4 h-4 text-brandred animate-pulse" />
            <span>Simulate Multi-Tier Disruption Event</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Presets */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-semibold mb-2 block">
              Automotive Industry Test Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'T3-APEX-FAB',
                    10,
                    'Cleanroom Contamination (Kaohsiung Silicon Fab)'
                  )
                }
                className="p-2.5 text-left rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/60 transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-red-400">
                  Kaohsiung Fab 10-Day Delay
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Tier-3 MCU-8841 Breaches WC-3
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset(
                    'T2-ADV-PCBA',
                    6,
                    'Guadalajara SMT Pick-and-Place Feeder Breakdown'
                  )
                }
                className="p-2.5 text-left rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/60 transition group"
              >
                <div className="text-xs font-bold text-white group-hover:text-amber-400">
                  Tier-2 PCBA 6-Day Halt
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Instrument Board Shortage
                </div>
              </button>
            </div>
          </div>

          {/* Node Selector */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-semibold mb-1.5 block">
              Target Origin Node (Supplier or Part)
            </label>
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-red-500 focus:outline-none"
            >
              <option value="T3-APEX-FAB">T3-APEX-FAB (Apex Silicon Fab, Kaohsiung)</option>
              <option value="T3-SHIN-WAFER">T3-SHIN-WAFER (Shin-Etsu Silicon Substrates)</option>
              <option value="T2-ADV-PCBA">T2-ADV-PCBA (Advanced PCBA Systems, Mexico)</option>
              <option value="PART-MCU-8841">PART-MCU-8841 (Safety Microcontroller)</option>
            </select>
          </div>

          {/* Delay duration */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
                Injected Schedule Latency (Days)
              </label>
              <span className="text-xs font-mono font-bold text-red-400">{delayDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-full accent-red-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>1 Day (Absorbed by Buffer)</span>
              <span>3 Days (Threshold)</span>
              <span>25 Days (Severe)</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-semibold mb-1.5 block">
              Operational Incident Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/40"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Blast Radius</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
