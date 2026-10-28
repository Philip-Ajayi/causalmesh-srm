import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NetworkTopologyResponse } from '../types';
import {
  SupplierNode,
  PartNode,
  WorkCenterNode,
  PurchaseOrderNode
} from './CustomNodes';

interface TopologyGraphProps {
  topology: NetworkTopologyResponse;
  onNodeClick?: (nodeId: string) => void;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ topology, onNodeClick }) => {
  const nodeTypes = useMemo(
    () => ({
      Tier3Supplier: SupplierNode,
      Tier2Supplier: SupplierNode,
      Tier1Supplier: SupplierNode,
      Part: PartNode,
      WorkCenter: WorkCenterNode,
      PurchaseOrder: PurchaseOrderNode
    }),
    []
  );

  // Deterministic echelon coordinate positioning for pristine aesthetic graph layout
  const layoutCoordinates: Record<string, { x: number; y: number }> = {
    'T3-SHIN-WAFER': { x: 40, y: 80 },
    'T3-APEX-FAB': { x: 40, y: 220 },
    'T3-GRAZ-SEMI': { x: 40, y: 380 },
    'PO-8821': { x: 310, y: 80 },
    'PART-MCU-8841': { x: 310, y: 240 },
    'T2-ADV-PCBA': { x: 570, y: 160 },
    'T2-ALPINE-DISP': { x: 570, y: 340 },
    'PART-PCBA-V2': { x: 830, y: 160 },
    'PART-DISP-OLED': { x: 830, y: 340 },
    'T1-VISTEON-COCKPIT': { x: 1080, y: 240 },
    'WC-1-CHASSIS': { x: 1350, y: 60 },
    'WC-2-POWERTRAIN': { x: 1350, y: 190 },
    'WC-3-COCKPIT': { x: 1350, y: 320 },
    'WC-4-FINAL-INSPECT': { x: 1350, y: 460 }
  };

  const nodes: Node[] = useMemo(() => {
    return topology.nodes.map((n, idx) => {
      const pos = layoutCoordinates[n.id] || { x: 100 + (idx % 4) * 260, y: 80 + Math.floor(idx / 4) * 160 };
      return {
        id: n.id,
        type: n.type,
        position: pos,
        data: { ...n }
      };
    });
  }, [topology.nodes]);

  const edges: Edge[] = useMemo(() => {
    return topology.edges.map((e) => {
      const isCritical = e.is_critical_path;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isCritical,
        label: e.relationship.replace('_', ' '),
        labelStyle: { fill: isCritical ? '#EF4444' : '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
        style: {
          stroke: isCritical ? '#EF4444' : '#334155',
          strokeWidth: isCritical ? 3 : 1.5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCritical ? '#EF4444' : '#64748B',
          width: 14,
          height: 14
        }
      };
    });
  }, [topology.edges]);

  return (
    <div className="w-full h-full bg-[#080C15] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.status === 'critical') return '#EF4444';
            if (node.data?.status === 'warning') return '#F59E0B';
            return '#334155';
          }}
          className="!bg-slate-950 !border-slate-800"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>

      {/* Graph Legend overlay */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-darkborder backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1.5 shadow-xl pointer-events-none">
        <div className="font-bold text-white mb-1">TOPOLOGY LEGEND</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Nominal (Buffer Healthy)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Buffer Depleting / Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
          <span>Buffer Breached / Starvation Stall</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500"></span>
          <span className="text-red-400">Critical Disruption Vector</span>
        </div>
      </div>
    </div>
  );
};
