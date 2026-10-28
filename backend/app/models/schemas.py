from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum


class NodeType(str, Enum):
    TIER3_SUPPLIER = "Tier3Supplier"
    TIER2_SUPPLIER = "Tier2Supplier"
    TIER1_SUPPLIER = "Tier1Supplier"
    PART = "Part"
    WORK_CENTER = "WorkCenter"
    PURCHASE_ORDER = "PurchaseOrder"


class NodeStatus(str, Enum):
    NOMINAL = "nominal"
    WARNING = "warning"
    CRITICAL = "critical"
    MITIGATED = "mitigated"


class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    status: NodeStatus = NodeStatus.NOMINAL
    tier: Optional[int] = None
    location: Optional[str] = None
    lead_time_days: Optional[int] = None
    unit_cost: Optional[float] = None
    hourly_downtime_cost: Optional[float] = None
    safety_buffer_days: Optional[int] = None
    part_number: Optional[str] = None
    quantity: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    quantity_per: Optional[int] = None
    lead_time_days: Optional[int] = None
    is_critical_path: bool = False


class NetworkTopologyResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int


class DisruptionEventRequest(BaseModel):
    node_id: str = Field(..., description="ID of disrupted supplier or part")
    delay_days: int = Field(..., ge=1, le=120, description="Injected delay duration in days")
    reason: str = Field(default="Cleanroom Contamination Event", description="Disruption root cause")


class ImpactedPO(BaseModel):
    po_id: str
    part_number: str
    original_arrival_days: int
    revised_arrival_days: int
    units_at_risk: int
    supplier_id: str


class StalledWorkCenter(BaseModel):
    work_center_id: str
    name: str
    safety_buffer_days: int
    starvation_starts_in_hours: int
    line_stoppage_hours: int
    hourly_penalty_usd: float
    financial_loss_usd: float
    affected_vehicle_models: List[str]
    impacted_units: int


class BlastRadiusResponse(BaseModel):
    disrupted_node_id: str
    delay_days: int
    reason: str
    critical_path: List[str]
    impacted_pos: List[ImpactedPO]
    stalled_work_centers: List[StalledWorkCenter]
    total_idle_loss_usd: float
    earliest_line_stop_hours: Optional[int]
    total_vehicles_delayed: int
    propagation_ms: float


class MitigationScenario(BaseModel):
    scenario_id: str
    title: str
    description: str
    expedite_cost_usd: float
    resequencing_cost_usd: float
    supplier_surcharge_usd: float
    total_mitigation_cost_usd: float
    projected_downtime_loss_usd: float
    net_savings_usd: float
    hours_recovered: int
    po_splits: List[Dict[str, Any]]
    mes_line_swap: Optional[Dict[str, Any]]
    recommended: bool = False


class SolveMitigationResponse(BaseModel):
    disruption_node_id: str
    solver_status: str
    optimal_scenario: MitigationScenario
    alternative_scenarios: List[MitigationScenario]
    execution_time_ms: float


class DispatchPORequest(BaseModel):
    scenario_id: str
    notes: Optional[str] = "Autonomous compensatory split and MES resequence dispatch"


class DispatchPOResponse(BaseModel):
    dispatch_id: str
    scenario_id: str
    timestamp: str
    status: str
    erp_orders: List[Dict[str, Any]]
    mes_job_updates: List[Dict[str, Any]]
    blast_radius_cleared: bool


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    event_type: str
    actor: str
    payload: Dict[str, Any]
