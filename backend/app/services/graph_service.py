import networkx as nx
from typing import Dict, Any, List
from app.models.schemas import (
    GraphNode, GraphEdge, NodeType, NodeStatus, NetworkTopologyResponse
)


class SupplyGraphService:
    def __init__(self):
        self.graph: nx.DiGraph = nx.DiGraph()
        self.critical_path_edges: set = set()
        self.build_default_topology()

    def build_default_topology(self):
        self.graph.clear()
        self.critical_path_edges.clear()

        nodes_data = [
            # Tier 3 Suppliers & Substrates
            {
                "id": "T3-APEX-FAB",
                "label": "Apex Silicon Fab (Kaohsiung)",
                "type": NodeType.TIER3_SUPPLIER,
                "tier": 3,
                "location": "Kaohsiung, TW",
                "metadata": {"certifications": ["IATF-16949"], "reliability_rating": 0.96}
            },
            {
                "id": "T3-GRAZ-SEMI",
                "label": "MicroTech Graz Semi (Austria)",
                "type": NodeType.TIER3_SUPPLIER,
                "tier": 3,
                "location": "Graz, AT",
                "metadata": {"certifications": ["IATF-16949", "AEC-Q100"], "reliability_rating": 0.99, "is_secondary": True}
            },
            {
                "id": "T3-SHIN-WAFER",
                "label": "Shin-Etsu Substrates (Japan)",
                "type": NodeType.TIER3_SUPPLIER,
                "tier": 3,
                "location": "Niigata, JP",
                "metadata": {"certifications": ["ISO-9001"], "reliability_rating": 0.98}
            },
            # Tier 2 Suppliers & Fabricators
            {
                "id": "T2-ADV-PCBA",
                "label": "Advanced PCBA Systems (Guadalajara)",
                "type": NodeType.TIER2_SUPPLIER,
                "tier": 2,
                "location": "Guadalajara, MX",
                "metadata": {"smt_lines": 12, "buffer_days": 4}
            },
            {
                "id": "T2-ALPINE-DISP",
                "label": "Alpine OLED Optics (Seoul)",
                "type": NodeType.TIER2_SUPPLIER,
                "tier": 2,
                "location": "Seoul, KR",
                "metadata": {"buffer_days": 5}
            },
            {
                "id": "T2-MAGNA-STRUCT",
                "label": "Magna Structural Framing (Ontario)",
                "type": NodeType.TIER2_SUPPLIER,
                "tier": 2,
                "location": "Ontario, CA",
                "metadata": {"press_tonnage": 5000}
            },
            # Tier 1 System Integrators
            {
                "id": "T1-VISTEON-COCKPIT",
                "label": "Apex Cockpit Modules (Munich)",
                "type": NodeType.TIER1_SUPPLIER,
                "tier": 1,
                "location": "Munich, DE",
                "metadata": {"just_in_sequence": True, "transit_hours_to_oem": 6}
            },
            {
                "id": "T1-CHASSIS-INTEG",
                "label": "Apex Modular Chassis Systems",
                "type": NodeType.TIER1_SUPPLIER,
                "tier": 1,
                "location": "Leipzig, DE",
                "metadata": {"transit_hours_to_oem": 8}
            },
            # Parts & BOM Components
            {
                "id": "PART-MCU-8841",
                "label": "MCU-8841-A (ASIL-D Automotive MCU)",
                "type": NodeType.PART,
                "part_number": "MCU-8841-A",
                "unit_cost": 42.50,
                "lead_time_days": 45,
                "metadata": {"criticality": "Safety-Critical", "inventory_on_hand": 1200}
            },
            {
                "id": "PART-MCU-9200",
                "label": "MCU-9200-EV (NextGen EV MCU)",
                "type": NodeType.PART,
                "part_number": "MCU-9200-EV",
                "unit_cost": 48.00,
                "lead_time_days": 18,
                "metadata": {"inventory_on_hand": 4500, "alternative_for": "MCU-8841-A"}
            },
            {
                "id": "PART-PCBA-V2",
                "label": "PCBA-CLUSTER-V2 (Instrument Cluster Board)",
                "type": NodeType.PART,
                "part_number": "PCBA-CLUSTER-V2",
                "unit_cost": 185.00,
                "lead_time_days": 14,
                "metadata": {"safety_stock": 400}
            },
            {
                "id": "PART-DISP-OLED",
                "label": "DISP-OLED-12 (12.3\" Curved Display)",
                "type": NodeType.PART,
                "part_number": "DISP-OLED-12",
                "unit_cost": 210.00,
                "lead_time_days": 21,
                "metadata": {"safety_stock": 800}
            },
            # OEM Work Centers (Assembly Factory Floor)
            {
                "id": "WC-1-CHASSIS",
                "label": "Work Center 1: Structural Chassis",
                "type": NodeType.WORK_CENTER,
                "hourly_downtime_cost": 3200.0,
                "safety_buffer_days": 5,
                "metadata": {"line": "Assembly-A", "vehicles": ["Model S Sedan", "Model X SUV"]}
            },
            {
                "id": "WC-2-POWERTRAIN",
                "label": "Work Center 2: EV Battery Pack Decking",
                "type": NodeType.WORK_CENTER,
                "hourly_downtime_cost": 3800.0,
                "safety_buffer_days": 4,
                "metadata": {"line": "Assembly-A", "vehicles": ["Model E-Cross"]}
            },
            {
                "id": "WC-3-COCKPIT",
                "label": "Work Center 3: Cockpit Final Integration",
                "type": NodeType.WORK_CENTER,
                "hourly_downtime_cost": 4500.0,
                "safety_buffer_days": 3,
                "metadata": {
                    "line": "Assembly-A",
                    "takt_time_seconds": 96,
                    "vehicles": ["Model S Sedan", "Model E-Cross (EV)"],
                    "output_per_hour": 2.5
                }
            },
            {
                "id": "WC-4-FINAL-INSPECT",
                "label": "Work Center 4: ADAS Calibration & Rollout",
                "type": NodeType.WORK_CENTER,
                "hourly_downtime_cost": 2900.0,
                "safety_buffer_days": 6,
                "metadata": {"line": "Assembly-A"}
            },
            # Active Purchase Orders
            {
                "id": "PO-8821",
                "label": "PO #8821 (Apex Silicon)",
                "type": NodeType.PURCHASE_ORDER,
                "part_number": "MCU-8841-A",
                "quantity": 10000,
                "lead_time_days": 2,
                "metadata": {"vendor_id": "T3-APEX-FAB", "due_in_days": 2, "committed_date": "Day +2"}
            },
            {
                "id": "PO-8822",
                "label": "PO #8822 (Alpine Display)",
                "type": NodeType.PURCHASE_ORDER,
                "part_number": "DISP-OLED-12",
                "quantity": 5000,
                "lead_time_days": 4,
                "metadata": {"vendor_id": "T2-ALPINE-DISP", "due_in_days": 4}
            }
        ]

        for n in nodes_data:
            node_id = n["id"]
            self.graph.add_node(node_id, **n, status=NodeStatus.NOMINAL.value)

        edges_data = [
            # T3 to Parts
            {"source": "T3-APEX-FAB", "target": "PART-MCU-8841", "rel": "FABRICATES", "lead_time_days": 45},
            {"source": "T3-GRAZ-SEMI", "target": "PART-MCU-8841", "rel": "QUALIFIED_SECONDARY", "lead_time_days": 20},
            {"source": "T3-SHIN-WAFER", "target": "T3-APEX-FAB", "rel": "SUPPLIES_INGOTS", "lead_time_days": 30},
            # Parts to T2 PCBA Assembly
            {"source": "PART-MCU-8841", "target": "T2-ADV-PCBA", "rel": "FEEDS_SMT", "lead_time_days": 2},
            {"source": "T3-APEX-FAB", "target": "PO-8821", "rel": "COMMITTED_UNDER", "lead_time_days": 2},
            # T2 to Parts
            {"source": "T2-ADV-PCBA", "target": "PART-PCBA-V2", "rel": "MANUFACTURES", "lead_time_days": 5},
            {"source": "T2-ALPINE-DISP", "target": "PART-DISP-OLED", "rel": "MANUFACTURES", "lead_time_days": 6},
            {"source": "T2-ALPINE-DISP", "target": "PO-8822", "rel": "COMMITTED_UNDER", "lead_time_days": 4},
            # Components to T1 Sub-Assembly
            {"source": "PART-PCBA-V2", "target": "T1-VISTEON-COCKPIT", "rel": "INTEGRATED_INTO", "lead_time_days": 3},
            {"source": "PART-DISP-OLED", "target": "T1-VISTEON-COCKPIT", "rel": "INTEGRATED_INTO", "lead_time_days": 3},
            {"source": "T2-MAGNA-STRUCT", "target": "T1-CHASSIS-INTEG", "rel": "FEEDS_FRAME", "lead_time_days": 4},
            # T1 Modules into OEM Work Centers
            {"source": "T1-VISTEON-COCKPIT", "target": "WC-3-COCKPIT", "rel": "DELIVERS_JIS", "lead_time_days": 1},
            {"source": "T1-CHASSIS-INTEG", "target": "WC-1-CHASSIS", "rel": "DELIVERS_JIS", "lead_time_days": 1},
            {"source": "WC-1-CHASSIS", "target": "WC-2-POWERTRAIN", "rel": "FLOWS_TO", "lead_time_days": 0},
            {"source": "WC-2-POWERTRAIN", "target": "WC-3-COCKPIT", "rel": "FLOWS_TO", "lead_time_days": 0},
            {"source": "WC-3-COCKPIT", "target": "WC-4-FINAL-INSPECT", "rel": "FLOWS_TO", "lead_time_days": 0},
        ]

        for e in edges_data:
            edge_id = f"{e['source']}->{e['target']}"
            self.graph.add_edge(
                e["source"],
                e["target"],
                id=edge_id,
                relationship=e["rel"],
                lead_time_days=e.get("lead_time_days", 0),
                is_critical_path=False
            )

    def get_topology(self) -> NetworkTopologyResponse:
        nodes: List[GraphNode] = []
        for n_id, data in self.graph.nodes(data=True):
            nodes.append(
                GraphNode(
                    id=n_id,
                    label=data.get("label", n_id),
                    type=data.get("type", NodeType.PART),
                    status=data.get("status", NodeStatus.NOMINAL),
                    tier=data.get("tier"),
                    location=data.get("location"),
                    lead_time_days=data.get("lead_time_days"),
                    unit_cost=data.get("unit_cost"),
                    hourly_downtime_cost=data.get("hourly_downtime_cost"),
                    safety_buffer_days=data.get("safety_buffer_days"),
                    part_number=data.get("part_number"),
                    quantity=data.get("quantity"),
                    metadata=data.get("metadata", {})
                )
            )

        edges: List[GraphEdge] = []
        for u, v, data in self.graph.edges(data=True):
            is_cp = (u, v) in self.critical_path_edges or data.get("is_critical_path", False)
            edges.append(
                GraphEdge(
                    id=data.get("id", f"{u}->{v}"),
                    source=u,
                    target=v,
                    relationship=data.get("relationship", "CONNECTED"),
                    lead_time_days=data.get("lead_time_days", 0),
                    is_critical_path=is_cp
                )
            )

        return NetworkTopologyResponse(
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges)
        )

    def set_node_status(self, node_id: str, status: NodeStatus):
        if self.graph.has_node(node_id):
            self.graph.nodes[node_id]["status"] = status.value

    def mark_critical_path(self, path_edges: List[tuple]):
        self.critical_path_edges = set(path_edges)
        for u, v in self.graph.edges():
            self.graph.edges[u, v]["is_critical_path"] = (u, v) in self.critical_path_edges

    def reset_all(self):
        self.build_default_topology()


supply_graph_service = SupplyGraphService()
