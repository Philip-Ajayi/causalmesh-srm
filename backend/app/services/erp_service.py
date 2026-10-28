import datetime
from typing import Dict, Any, List
from app.models.schemas import DispatchPOResponse, NodeStatus
from app.services.graph_service import supply_graph_service


class ERPService:
    def __init__(self):
        self.audit_logs: List[Dict[str, Any]] = []

    def dispatch_remediation(self, scenario_id: str, notes: str) -> DispatchPOResponse:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        dispatch_id = f"DISPATCH-ERP-{int(datetime.datetime.now().timestamp())}"

        # Mock ERP EDI 850/860 Change Orders
        erp_orders = [
            {
                "edi_transaction": "860-PO-CHANGE-NOTIFICATION",
                "original_po_number": "PO-8821",
                "vendor": "Apex Silicon Fab (Kaohsiung)",
                "action": "DECREMENT_QUANTITY",
                "prior_quantity": 10000,
                "revised_quantity": 6000,
                "edi_confirmation_code": "EDI-ACK-984210-APEX"
            },
            {
                "edi_transaction": "850-PURCHASE-ORDER-CREATION",
                "new_po_number": "PO-9942-EXPEDITE",
                "vendor": "MicroTech Graz Semi (Austria)",
                "action": "NEW_ORDER_DISPATCH",
                "quantity": 4000,
                "carrier": "Lufthansa Cargo Priority Air",
                "estimated_arrival": "44 Hours",
                "edi_confirmation_code": "EDI-ACK-332911-GRAZ"
            }
        ]

        mes_job_updates = [
            {
                "work_center": "WC-3-COCKPIT",
                "instruction": "RESEQUENCE_SCHEDULE_BLOCK",
                "active_sequence": "BLOCK-ALPHA-EV-BUFFERED",
                "takt_rebalance": "NORMAL_SPEED_MAINTAINED",
                "downtime_avoided_hours": 168
            }
        ]

        # Reset all graph nodes back to nominal or mitigated
        for node_id in supply_graph_service.graph.nodes:
            supply_graph_service.set_node_status(node_id, NodeStatus.NOMINAL)
        supply_graph_service.critical_path_edges.clear()

        # Mark remediated node
        supply_graph_service.set_node_status("T3-APEX-FAB", NodeStatus.MITIGATED)
        supply_graph_service.set_node_status("T3-GRAZ-SEMI", NodeStatus.NOMINAL)
        supply_graph_service.set_node_status("WC-3-COCKPIT", NodeStatus.NOMINAL)

        # Log event
        log_entry = {
            "id": dispatch_id,
            "timestamp": now_iso,
            "event_type": "REMEDIATION_DISPATCH_CONFIRMED",
            "actor": "Lead Sourcing Manager & LP Autonomous Engine",
            "payload": {
                "scenario_id": scenario_id,
                "notes": notes,
                "erp_orders": erp_orders,
                "mes_updates": mes_job_updates
            }
        }
        self.audit_logs.insert(0, log_entry)

        return DispatchPOResponse(
            dispatch_id=dispatch_id,
            scenario_id=scenario_id,
            timestamp=now_iso,
            status="CONFIRMED_AND_SYNCHRONIZED",
            erp_orders=erp_orders,
            mes_job_updates=mes_job_updates,
            blast_radius_cleared=True
        )

    def log_custom_event(self, event_type: str, actor: str, payload: Dict[str, Any]):
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        entry = {
            "id": f"LOG-{int(datetime.datetime.now().timestamp() * 1000)}",
            "timestamp": now_iso,
            "event_type": event_type,
            "actor": actor,
            "payload": payload
        }
        self.audit_logs.insert(0, entry)

    def get_logs(self) -> List[Dict[str, Any]]:
        return self.audit_logs


erp_service = ERPService()
