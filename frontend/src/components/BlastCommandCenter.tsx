import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Car,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Zap
} from 'lucide-react';
import { BlastRadiusResponse } from '../types';

interface BlastCommandCenterProps {
  blastData: BlastRadiusResponse | null;
  onNavigateToRemediation: () => void;
}

export const BlastCommandCenter: React.FC<BlastCommandCenterProps> = ({
  blastData,
  onNavigateToRemediation
}) => {
  // Live ticking counter for idle factory burn penalty ($75/min)
  const [tickerOffset, setTickerOffset] = useState<number>(0);

  useEffect(() => {
    if (!blastData || blastData.total_idle_loss_usd === 0) return;
    const interval = setInterval(() => {
      setTickerOffset((prev) => prev + 1.25); // Adds ~$1.25 every second
    }, 1000);
    return () => clearInterval(interval);
  }, [blastData]);

  if (!blastData || blastData.stalled_work_centers.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
        <div className="p-4 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Zero Active Disruption Events</h3>
        <p className="text-sm text-slate-400 max-w-md">
          All factory assembly lines and multi-tier supplier buffers are nominal. Click &quot;Simulate Disruption&quot; in the header to trigger a cleanroom contamination test case.
        </p>
      </div>
    );
  }

  const currentBurnTotal = blastData.total_idle_loss_usd + tickerOffset;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#080C14]">
      {/* Top Threat Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-500/60 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-600 text-white animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold">
                CRITICAL THREAT CONFIRMED
              </span>
              <span className="text-xs font-mono text-slate-400">
                Topological Traversal: {blastData.propagation_ms} ms
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-1">
              {blastData.reason} &bull; {blastData.delay_days}-Day Delay Injected
            </h2>
          </div>
        </div>

        <button
          onClick={onNavigateToRemediation}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-900/40 transition transform active:scale-95"
        >
          <Zap className="w-4 h-4" />
          <span>Launch Remediation Solver</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Ticker Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-red-500/40 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PROJECTED IDLE FACTORY LOSS</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono mt-2">
            ${Math.floor(currentBurnTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-red-300 font-mono mt-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Idle penalty rate: $75.00 / min</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-darkborder shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>EARLIEST FACTORY STARVATION</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            T-MINUS {blastData.earliest_line_stop_hours}h 00m
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Buffer depleted in: 3 Days (Work Center 3)
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-darkborder shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>IMPACTED VEHICLE ORDERS</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-2">
            {blastData.total_vehicles_delayed.toLocaleString()} Units
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Affects: Model S Sedan & Model E-Cross
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-darkborder shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AFFECTED PO SHIPMENTS</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {blastData.impacted_pos.reduce((acc, p) => acc + p.units_at_risk, 0).toLocaleString()} Parts
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Across {blastData.impacted_pos.length} open ERP order(s)
          </div>
        </div>
      </div>

      {/* Split Detail Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Stalled Work Centers */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-darkborder shadow-xl">
          <h3 className="text-sm font-bold uppercase font-mono text-slate-200 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            OEM Work Center Stoppage Breakdown
          </h3>
          <div className="space-y-3">
            {blastData.stalled_work_centers.map((wc) => (
              <div key={wc.work_center_id} className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{wc.name}</h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Safety Buffer: {wc.safety_buffer_days} Days &bull; Line Stoppage: {wc.line_stoppage_hours} Hours
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono text-red-400 bg-red-950 px-2 py-1 rounded border border-red-800">
                    -${wc.financial_loss_usd.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-slate-300">
                  <span className="text-slate-500">Vehicles Impacted:</span>
                  {wc.affected_vehicle_models.map((m) => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {m}
                    </span>
                  ))}
                  <span className="text-amber-400 font-bold ml-auto">{wc.impacted_units} Units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Critical Propagation Path */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-darkborder shadow-xl">
          <h3 className="text-sm font-bold uppercase font-mono text-slate-200 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Disruption Propagation Vector (CPM Analysis)
          </h3>
          <div className="space-y-2">
            {blastData.critical_path.map((pathEdge, idx) => {
              const [src, tgt] = pathEdge.split('->');
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-red-400 font-bold">Step {idx + 1}:</span>
                    <span className="text-amber-300">{src}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-red-300 font-semibold">{tgt}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Cascaded Shortage</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-white font-bold">Autonomous Recommendation:</span> Work Center 3 is the sole critical bottleneck. Reallocation of 40% volume to Graz secondary fab neutralizes downstream starvation prior to hour 72.
          </div>
        </div>
      </div>
    </div>
  );
};
