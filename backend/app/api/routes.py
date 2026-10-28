from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import (
    NetworkTopologyResponse,
    DisruptionEventRequest,
    BlastRadiusResponse,
    SolveMitigationResponse,
    DispatchPORequest,
    DispatchPOResponse
)
from app.services.graph_service import supply_graph_service
from app.services.blast_engine import blast_engine
from app.services.solver_service import solver_service
from app.services.erp_service import erp_service
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/api/v1")


@router.get("/graph/topology", response_model=NetworkTopologyResponse)
def get_graph_topology():
    return supply_graph_service.get_topology()


@router.post("/events/disruption", response_model=BlastRadiusResponse)
async def inject_disruption(event: DisruptionEventRequest, background_tasks: BackgroundTasks):
    try:
        blast_result = blast_engine.compute_blast_radius(
            disrupted_node_id=event.node_id,
            delay_days=event.delay_days,
            reason=event.reason
        )

        erp_service.log_custom_event(
            event_type="DISRUPTION_INJECTED",
            actor="Simulated Operational Webhook (Kaohsiung Fab)",
            payload=blast_result.model_dump()
        )

        # Broadcast update to connected dashboards
        background_tasks.add_task(
            ws_manager.broadcast,
            "DISRUPTION_ALERT",
            blast_result.model_dump()
        )

        return blast_result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Causal engine failure: {str(e)}")


@router.post("/engine/blast-radius", response_model=BlastRadiusResponse)
def calculate_blast_radius(event: DisruptionEventRequest):
    try:
        return blast_engine.compute_blast_radius(
            disrupted_node_id=event.node_id,
            delay_days=event.delay_days,
            reason=event.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/engine/solve-mitigation", response_model=SolveMitigationResponse)
def solve_mitigation(event: DisruptionEventRequest):
    try:
        return solver_service.solve(
            disrupted_node_id=event.node_id,
            delay_days=event.delay_days
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LP Optimization failed: {str(e)}")


@router.post("/po/dispatch", response_model=DispatchPOResponse)
async def dispatch_purchase_orders(payload: DispatchPORequest, background_tasks: BackgroundTasks):
    dispatch_res = erp_service.dispatch_remediation(
        scenario_id=payload.scenario_id,
        notes=payload.notes or "PO split and line resequence"
    )

    background_tasks.add_task(
        ws_manager.broadcast,
        "REMEDIATION_EXECUTED",
        dispatch_res.model_dump()
    )

    return dispatch_res


@router.post("/events/reset")
async def reset_simulation(background_tasks: BackgroundTasks):
    supply_graph_service.reset_all()
    erp_service.log_custom_event(
        event_type="SYSTEM_RESET",
        actor="Operator",
        payload={"message": "Supply topology reset to baseline nominal state."}
    )
    topo = supply_graph_service.get_topology()
    background_tasks.add_task(
        ws_manager.broadcast,
        "SYSTEM_RESET",
        topo.model_dump()
    )
    return {"status": "RESET_SUCCESSFUL", "message": "All nodes returned to nominal."}


@router.get("/audit/logs")
def get_audit_logs():
    return erp_service.get_logs()
