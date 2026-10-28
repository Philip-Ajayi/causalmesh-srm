import {
  NetworkTopologyResponse,
  BlastRadiusResponse,
  SolveMitigationResponse,
  AuditLogEntry
} from '../types';
import {
  INITIAL_FALLBACK_TOPOLOGY,
  simulateFallbackBlast,
  simulateFallbackSolver
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiClient {
  public static isMockMode: boolean = false;

  public static async fetchTopology(): Promise<NetworkTopologyResponse> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/graph/topology`);
      if (!res.ok) throw new Error('Network response was not ok');
      this.isMockMode = false;
      return await res.json();
    } catch {
      console.warn('[CausalMesh] Backend unreachable; switching to autonomous browser simulation engine.');
      this.isMockMode = true;
      return INITIAL_FALLBACK_TOPOLOGY;
    }
  }

  public static async injectDisruption(
    nodeId: string,
    delayDays: number,
    reason: string
  ): Promise<BlastRadiusResponse> {
    if (this.isMockMode) {
      return simulateFallbackBlast(nodeId, delayDays, reason);
    }
    try {
      const res = await fetch(`${BASE_URL}/api/v1/events/disruption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId, delay_days: delayDays, reason })
      });
      if (!res.ok) throw new Error('Failed to inject disruption');
      return await res.json();
    } catch {
      this.isMockMode = true;
      return simulateFallbackBlast(nodeId, delayDays, reason);
    }
  }

  public static async solveMitigation(
    nodeId: string,
    delayDays: number
  ): Promise<SolveMitigationResponse> {
    if (this.isMockMode) {
      return simulateFallbackSolver(nodeId, delayDays);
    }
    try {
      const res = await fetch(`${BASE_URL}/api/v1/engine/solve-mitigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: nodeId, delay_days: delayDays })
      });
      if (!res.ok) throw new Error('Failed to solve LP mitigation');
      return await res.json();
    } catch {
      this.isMockMode = true;
      return simulateFallbackSolver(nodeId, delayDays);
    }
  }

  public static async dispatchRemediation(
    scenarioId: string,
    notes?: string
  ): Promise<any> {
    if (this.isMockMode) {
      return {
        dispatch_id: `DISPATCH-MOCK-${Date.now()}`,
        scenario_id: scenarioId,
        timestamp: new Date().toISOString(),
        status: 'CONFIRMED_AND_SYNCHRONIZED',
        blast_radius_cleared: true,
        erp_orders: [
          { edi_transaction: '860-PO-CHANGE', original_po_number: 'PO-8821', revised_quantity: 6000 },
          { edi_transaction: '850-NEW-PO', new_po_number: 'PO-9942-EXPEDITE', quantity: 4000 }
        ]
      };
    }
    const res = await fetch(`${BASE_URL}/api/v1/po/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, notes })
    });
    return await res.json();
  }

  public static async resetSimulation(): Promise<any> {
    if (this.isMockMode) {
      return { status: 'RESET_SUCCESSFUL' };
    }
    const res = await fetch(`${BASE_URL}/api/v1/events/reset`, { method: 'POST' });
    return await res.json();
  }

  public static async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    if (this.isMockMode) {
      return [
        {
          id: 'LOG-INIT',
          timestamp: new Date().toISOString(),
          event_type: 'SIMULATION_READY',
          actor: 'System Autonomous Kernel',
          payload: { message: 'Initialized in deterministic browser mode.' }
        }
      ];
    }
    const res = await fetch(`${BASE_URL}/api/v1/audit/logs`);
    return await res.json();
  }
}
