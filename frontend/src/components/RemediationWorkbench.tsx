import React, { useState } from 'react';
import {
  CheckCircle,
  Zap,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  Send,
  Split,
  RefreshCw
} from 'lucide-react';
import { SolveMitigationResponse, MitigationScenario } from '../types';
import { soundEngine } from '../services/audio';

interface RemediationWorkbenchProps {
  solveData: SolveMitigationResponse | null;
  onExecuteDispatch: (scenarioId: string) => Promise<void>;
  isDispatching: boolean;
}

export const RemediationWorkbench: React.FC<RemediationWorkbenchProps> = ({
  solveData,
  onExecuteDispatch,
  isDispatching
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCENARIO-LP-OPTIMAL-SPLIT');
  const [dispatchComplete, setDispatchComplete] = useState<boolean>(false);

  if (!solveData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-4">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Remediation Calculations</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Trigger a simulated disruption first to run the PuLP Linear Programming optimization solver.
        </p>
      </div>
    );
  }

  const allScenarios: MitigationScenario[] = [
    solveData.optimal_scenario,
    ...solveData.alternative_scenarios
  ];

  const activeScenario =
    allScenarios.find((s) => s.scenario_id === selectedScenarioId) || solveData.optimal_scenario;

  const handleExecute = async () => {
    await onExecuteDispatch(activeScenario.scenario_id);
    soundEngine.playSuccessChime();
    setDispatchComplete(true);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#080C14]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-darkborder shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold">
              PuLP CBC SOLVER: {solveData.solver_status}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Execution Time: {solveData.execution_time_ms} ms
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-white mt-1">
            Autonomous Echelon Rescheduling & Compensatory Workbook
          </h2>
        </div>

        {dispatchComplete ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>ERP CHANGE ORDERS CONFIRMED & DISPATCHED</span>
          </div>
        ) : (
          <button
            onClick={handleExecute}
            disabled={isDispatching || activeScenario.scenario_id === 'SCENARIO-DO-NOTHING'}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-emerald-900/40 transition transform active:scale-95"
          >
            {isDispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Execute & Dispatch ERP PO Split</span>
          </button>
        )}
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allScenarios.map((scen) => {
          const isSelected = scen.scenario_id === activeScenario.scenario_id;
          return (
            <div
              key={scen.scenario_id}
              onClick={() => setSelectedScenarioId(scen.scenario_id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 to-[#121B2F] border-cyan-400 shadow-xl ring-2 ring-cyan-500/30'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    scen.recommended
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {scen.recommended ? '★ LP Recommended' : 'Alternative'}
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  ${scen.total_mitigation_cost_usd.toLocaleString()}
                </span>
              </div>
              <h3 className="text-xs font-bold text-white line-clamp-1">{scen.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{scen.description}</p>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Net Value Saved:</span>
                <span className="text-emerald-400 font-bold">+${scen.net_savings_usd.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive on Selected Scenario */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-darkborder shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-darkborder pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Split className="w-5 h-5 text-cyan-400" />
              <span>{activeScenario.title}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{activeScenario.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Expedite Premium: </span>
              <span className="text-cyan-400 font-bold">${activeScenario.expedite_cost_usd.toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Hours Saved: </span>
              <span className="text-emerald-400 font-bold">{activeScenario.hours_recovered} Hours</span>
            </div>
          </div>
        </div>

        {/* PO Volume Split Allocation Table */}
        <div>
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 mb-3">
            Compensatory PO Volume Allocation
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Awarded Supplier</th>
                  <th className="p-3">Allocated Volume</th>
                  <th className="p-3">Transit & Freight Channel</th>
                  <th className="p-3">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeScenario.po_splits.map((split, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{split.supplier}</td>
                    <td className="p-3 text-cyan-400 font-bold">{split.volume.toLocaleString()} units</td>
                    <td className="p-3 text-slate-300">{split.freight}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                        {split.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MES Variant Resequence (if present) */}
        {activeScenario.mes_line_swap && (
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 font-mono text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Autonomous MES Line Re-Sequencing Instruction</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 pt-1">
              <div>
                <span className="text-slate-500">Target Line: </span>
                <span className="text-white font-bold">{activeScenario.mes_line_swap.target_work_center}</span>
              </div>
              <div>
                <span className="text-slate-500">Active Changeover: </span>
                <span className="text-amber-300">{activeScenario.mes_line_swap.original_variant}</span> &rarr;{' '}
                <span className="text-emerald-300 font-bold">{activeScenario.mes_line_swap.substituted_variant}</span>
              </div>
              <div>
                <span className="text-slate-500">Allocated Inventory: </span>
                <span className="text-white">{activeScenario.mes_line_swap.allocated_part}</span>
              </div>
              <div>
                <span className="text-slate-500">Protected Duration: </span>
                <span className="text-white">{activeScenario.mes_line_swap.swap_duration_hours} Hours</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
