export type NodeType =
  | 'Tier3Supplier'
  | 'Tier2Supplier'
  | 'Tier1Supplier'
  | 'Part'
  | 'WorkCenter'
  | 'PurchaseOrder';

export type NodeStatus = 'nominal' | 'warning' | 'critical' | 'mitigated';

export interface GraphNodeData {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  tier?: number;
  location?: string;
  lead_time_days?: number;
  unit_cost?: number;
  hourly_downtime_cost?: number;
  safety_buffer_days?: number;
  part_number?: string;
  quantity?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: string;
  quantity_per?: number;
  lead_time_days?: number;
  is_critical_path: boolean;
}

export interface NetworkTopologyResponse {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  total_nodes: number;
  total_edges: number;
}

export interface ImpactedPO {
  po_id: string;
  part_number: string;
  original_arrival_days: number;
  revised_arrival_days: number;
  units_at_risk: number;
  supplier_id: string;
}

export interface StalledWorkCenter {
  work_center_id: string;
  name: string;
  safety_buffer_days: number;
  starvation_starts_in_hours: number;
  line_stoppage_hours: number;
  hourly_penalty_usd: float;
  financial_loss_usd: float;
  affected_vehicle_models: string[];
  impacted_units: number;
}

export type float = number;

export interface BlastRadiusResponse {
  disrupted_node_id: string;
  delay_days: number;
  reason: string;
  critical_path: string[];
  impacted_pos: ImpactedPO[];
  stalled_work_centers: StalledWorkCenter[];
  total_idle_loss_usd: number;
  earliest_line_stop_hours: number | null;
  total_vehicles_delayed: number;
  propagation_ms: number;
}

export interface POSplit {
  supplier: string;
  volume: number;
  freight: string;
  status: string;
}

export interface MESLineSwap {
  target_work_center: string;
  original_variant: string;
  substituted_variant: string;
  allocated_part: string;
  swap_duration_hours: number;
}

export interface MitigationScenario {
  scenario_id: string;
  title: string;
  description: string;
  expedite_cost_usd: number;
  resequencing_cost_usd: number;
  supplier_surcharge_usd: number;
  total_mitigation_cost_usd: number;
  projected_downtime_loss_usd: number;
  net_savings_usd: number;
  hours_recovered: number;
  po_splits: POSplit[];
  mes_line_swap?: MESLineSwap | null;
  recommended: boolean;
}

export interface SolveMitigationResponse {
  disruption_node_id: string;
  solver_status: string;
  optimal_scenario: MitigationScenario;
  alternative_scenarios: MitigationScenario[];
  execution_time_ms: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event_type: string;
  actor: string;
  payload: Record<string, any>;
}
