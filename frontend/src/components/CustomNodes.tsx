import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Cpu,
  Factory,
  Layers,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { GraphNodeData } from '../types';

export const SupplierNode = memo(({ data }: { data: GraphNodeData }) => {
  const isCritical = data.status === 'critical';
  const isWarning = data.status === 'warning';
  const isMitigated = data.status === 'mitigated';

  return (
    <div
      className={`min-w-[210px] p-3 rounded-xl border backdrop-blur-md transition-all shadow-xl ${
        isCritical
          ? 'bg-red-950/90 border-red-500 text-red-50 animate-glow-red ring-2 ring-red-500'
          : isWarning
          ? 'bg-amber-950/80 border-amber-500 text-amber-50'
          : isMitigated
          ? 'bg-blue-950/80 border-cyan-400 text-cyan-50'
          : 'bg-[#111827]/95 border-slate-700/80 text-slate-100'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-400" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                Tier {data.tier || 3}
              </span>
              {data.location && (
                <span className="text-[10px] font-mono text-slate-400">{data.location}</span>
              )}
            </div>
            <div className="text-xs font-bold leading-tight mt-1">{data.label}</div>
          </div>
        </div>

        {isCritical && <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />}
        {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        {isMitigated && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
      </div>

      {data.metadata?.reliability && (
        <div className="mt-2 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>Reliability</span>
          <span className="text-emerald-400 font-semibold">{data.metadata.reliability}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-400" />
    </div>
  );
});

export const PartNode = memo(({ data }: { data: GraphNodeData }) => {
  const isCritical = data.status === 'critical';
  const isWarning = data.status === 'warning';

  return (
    <div
      className={`min-w-[190px] p-3 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
        isCritical
          ? 'bg-red-950/80 border-red-500 text-red-50'
          : isWarning
          ? 'bg-amber-950/80 border-amber-500 text-amber-50'
          : 'bg-[#131B2E]/95 border-slate-700 text-slate-100'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-400" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-amber-400 font-semibold">BOM COMPONENT</span>
          <div className="text-xs font-bold leading-tight">{data.part_number || data.label}</div>
        </div>
      </div>
      {data.unit_cost && (
        <div className="mt-2 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>Unit Cost</span>
          <span className="text-slate-200">${data.unit_cost.toFixed(2)}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-400" />
    </div>
  );
});

export const WorkCenterNode = memo(({ data }: { data: GraphNodeData }) => {
  const isCritical = data.status === 'critical';

  return (
    <div
      className={`min-w-[230px] p-3.5 rounded-xl border backdrop-blur-md transition-all shadow-2xl ${
        isCritical
          ? 'bg-red-950/95 border-red-500 text-red-50 animate-glow-red ring-4 ring-red-500/50'
          : 'bg-[#181F38]/95 border-indigo-700/60 text-slate-100'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-indigo-400" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${isCritical ? 'bg-red-900 border-red-400 text-white' : 'bg-indigo-950 border-indigo-500 text-indigo-300'}`}>
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              OEM Assembly Line
            </span>
            <div className="text-xs font-extrabold leading-tight mt-0.5">{data.label}</div>
          </div>
        </div>
        {isCritical && <AlertOctagon className="w-5 h-5 text-red-400 animate-bounce" />}
      </div>

      <div className="mt-2.5 space-y-1 text-[11px] font-mono border-t border-slate-700/60 pt-2">
        <div className="flex justify-between text-slate-400">
          <span>Idle Burn Penalty:</span>
          <span className="text-red-400 font-bold">${data.hourly_downtime_cost?.toLocaleString()}/hr</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Safety Stock Buffer:</span>
          <span className="text-emerald-400 font-semibold">{data.safety_buffer_days} Days ({data.safety_buffer_days! * 24}h)</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-indigo-400" />
    </div>
  );
});

export const PurchaseOrderNode = memo(({ data }: { data: GraphNodeData }) => {
  const isCritical = data.status === 'critical';

  return (
    <div
      className={`min-w-[180px] p-2.5 rounded-lg border backdrop-blur-md transition-all shadow-md ${
        isCritical
          ? 'bg-red-950/80 border-red-500 text-red-50'
          : 'bg-[#10192A]/90 border-slate-700 text-slate-200'
      }`}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-slate-400" />
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
        <div>
          <span className="text-[9px] font-mono uppercase text-cyan-400">ERP PO TRACKER</span>
          <div className="text-xs font-bold">{data.label}</div>
        </div>
      </div>
      {data.quantity && (
        <div className="mt-1 text-[10px] font-mono text-slate-400 flex justify-between">
          <span>Units</span>
          <span className="text-slate-200">{data.quantity.toLocaleString()}</span>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-slate-400" />
    </div>
  );
});
