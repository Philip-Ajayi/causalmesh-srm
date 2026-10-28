import time
import networkx as nx
from typing import Dict, Any, List
from app.models.schemas import (
    BlastRadiusResponse, ImpactedPO, StalledWorkCenter, NodeStatus
)
from app.services.graph_service import supply_graph_service


class BlastEngine:
    @staticmethod
    def compute_blast_radius(disrupted_node_id: str, delay_days: int, reason: str) -> BlastRadiusResponse:
        start_time = time.perf_counter()
        graph = supply_graph_service.graph

        if not graph.has_node(disrupted_node_id):
            raise ValueError(f"Disrupted node '{disrupted_node_id}' does not exist in graph topology.")

        # Identify all downstream impacted nodes via topological descendants
        downstream_nodes = list(nx.descendants(graph, disrupted_node_id))
        all_impacted_node_ids = [disrupted_node_id] + downstream_nodes

        critical_path_edges = []
        impacted_pos: List[ImpactedPO] = []
        stalled_work_centers: List[StalledWorkCenter] = []
        total_idle_loss_usd = 0.0
        earliest_line_stop_hours = None
        total_vehicles_delayed = 0

        # Extract critical path directed edges originating from disrupted node
        for u in all_impacted_node_ids:
            for v in graph.successors(u):
                if v in all_impacted_node_ids:
                    critical_path_edges.append((u, v))

        # Update node status in Graph
        supply_graph_service.set_node_status(disrupted_node_id, NodeStatus.CRITICAL)

        for node_id in downstream_nodes:
            node_data = graph.nodes[node_id]
            node_type = node_data.get("type")

            # Check purchase order starvation
            if node_type == "PurchaseOrder":
                supply_graph_service.set_node_status(node_id, NodeStatus.CRITICAL)
                orig_lead = node_data.get("lead_time_days", 2)
                impacted_pos.append(
                    ImpactedPO(
                        po_id=node_id,
                        part_number=node_data.get("part_number", "UNKNOWN-PART"),
                        original_arrival_days=orig_lead,
                        revised_arrival_days=orig_lead + delay_days,
                        units_at_risk=node_data.get("quantity", 0),
                        supplier_id=node_data.get("metadata", {}).get("vendor_id", disrupted_node_id)
                    )
                )

            # Check work center stoppage
            elif node_type == "WorkCenter":
                safety_buffer = node_data.get("safety_buffer_days", 0)
                hourly_cost = node_data.get("hourly_downtime_cost", 0.0)
                output_per_hour = node_data.get("metadata", {}).get("output_per_hour", 2.5)
                vehicles = node_data.get("metadata", {}).get("vehicles", ["Sedan", "SUV"])

                if delay_days > safety_buffer:
                    buffer_breach_days = delay_days - safety_buffer
                    idle_hours = buffer_breach_days * 24
                    loss = idle_hours * hourly_cost
                    starvation_hours = safety_buffer * 24
                    units_blocked = int(idle_hours * output_per_hour)

                    supply_graph_service.set_node_status(node_id, NodeStatus.CRITICAL)

                    if earliest_line_stop_hours is None or starvation_hours < earliest_line_stop_hours:
                        earliest_line_stop_hours = starvation_hours

                    stalled_work_centers.append(
                        StalledWorkCenter(
                            work_center_id=node_id,
                            name=node_data.get("label", node_id),
                            safety_buffer_days=safety_buffer,
                            starvation_starts_in_hours=starvation_hours,
                            line_stoppage_hours=idle_hours,
                            hourly_penalty_usd=hourly_cost,
                            financial_loss_usd=loss,
                            affected_vehicle_models=vehicles,
                            impacted_units=units_blocked
                        )
                    )
                    total_idle_loss_usd += loss
                    total_vehicles_delayed += units_blocked
                else:
                    supply_graph_service.set_node_status(node_id, NodeStatus.WARNING)
            else:
                supply_graph_service.set_node_status(node_id, NodeStatus.WARNING)

        supply_graph_service.mark_critical_path(critical_path_edges)
        propagation_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return BlastRadiusResponse(
            disrupted_node_id=disrupted_node_id,
            delay_days=delay_days,
            reason=reason,
            critical_path=[f"{u}->{v}" for u, v in critical_path_edges],
            impacted_pos=impacted_pos,
            stalled_work_centers=stalled_work_centers,
            total_idle_loss_usd=round(total_idle_loss_usd, 2),
            earliest_line_stop_hours=earliest_line_stop_hours,
            total_vehicles_delayed=total_vehicles_delayed,
            propagation_ms=propagation_ms
        )


blast_engine = BlastEngine()
