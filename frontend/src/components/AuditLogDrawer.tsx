import React from 'react';
import { Terminal, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogDrawerProps {
  logs: AuditLogEntry[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ logs }) => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-4 bg-[#080C14]">
      <div className="flex items-center justify-between pb-3 border-b border-darkborder">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-extrabold text-white font-mono uppercase">
            Transactional Audit Log & Autonomous ERP EDI Dispatch Feed
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">{logs.length} Recorded Entries</span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between text-[11px] gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  {log.event_type}
                </span>
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <span className="text-slate-500">Actor: {log.actor}</span>
            </div>

            <pre className="p-3 rounded-lg bg-[#050811] text-slate-300 overflow-x-auto text-[11px] border border-slate-900">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
