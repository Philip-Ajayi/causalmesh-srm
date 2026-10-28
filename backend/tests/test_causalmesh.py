import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.graph_service import supply_graph_service
from app.services.blast_engine import blast_engine
from app.services.solver_service import solver_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_graph():
    supply_graph_service.reset_all()
    yield
    supply_graph_service.reset_all()


def test_topology_initialization():
    topo = supply_graph_service.get_topology()
    assert topo.total_nodes >= 10
    assert topo.total_edges >= 10
    node_ids = [n.id for n in topo.nodes]
    assert "T3-APEX-FAB" in node_ids
    assert "WC-3-COCKPIT" in node_ids


def test_topological_isolation():
    """
    Asserts that an injected delay at Apex Silicon Fab affects only downstream
    Cockpit/WC-3 dependencies and leaves independent lines (e.g., WC-1 Chassis) untouched.
    """
    res = blast_engine.compute_blast_radius(
        disrupted_node_id="T3-APEX-FAB",
        delay_days=10,
        reason="Cleanroom Contamination"
    )

    stalled_ids = [wc.work_center_id for wc in res.stalled_work_centers]
    assert "WC-3-COCKPIT" in stalled_ids
    # WC-1 Chassis should NOT be in stalled list because it does not depend on Apex Silicon Fab
    assert "WC-1-CHASSIS" not in stalled_ids


def test_buffer_absorption():
    """
    Asserts that delays smaller than a work center's safety stock buffer
    do not trigger false downtime alerts.
    """
    # WC-3 has a 3-day safety buffer. A 2-day delay should be absorbed.
    res = blast_engine.compute_blast_radius(
        disrupted_node_id="T3-APEX-FAB",
        delay_days=2,
        reason="Minor Test Delay"
    )
    assert len(res.stalled_work_centers) == 0
    assert res.total_idle_loss_usd == 0.0


def test_buffer_breach_blast_calculation():
    """
    Asserts that a 10-day delay breaches the 3-day buffer by 7 days (168 hours),
    accurately calculating downtime idle cost (168h * $4500/h = $756,000).
    """
    res = blast_engine.compute_blast_radius(
        disrupted_node_id="T3-APEX-FAB",
        delay_days=10,
        reason="Cleanroom Contamination"
    )
    assert len(res.stalled_work_centers) == 1
    wc = res.stalled_work_centers[0]
    assert wc.work_center_id == "WC-3-COCKPIT"
    assert wc.line_stoppage_hours == 168
    assert wc.financial_loss_usd == 756000.0
    assert res.earliest_line_stop_hours == 72


def test_solver_cost_minimization():
    """
    Asserts that the PuLP optimization engine mathematically minimizes total recovery cost
    compared to the unmitigated downtime loss.
    """
    solve_res = solver_service.solve(disrupted_node_id="T3-APEX-FAB", delay_days=10)
    opt = solve_res.optimal_scenario

    assert opt.total_mitigation_cost_usd < 40000.0
    assert opt.net_savings_usd > 700000.0
    assert opt.recommended is True


def test_api_e2e_flow():
    # 1. Check topology endpoint
    r = client.get("/api/v1/graph/topology")
    assert r.status_code == 200

    # 2. Inject Disruption
    r = client.post(
        "/api/v1/events/disruption",
        json={"node_id": "T3-APEX-FAB", "delay_days": 10, "reason": "Test Disruption"}
    )
    assert r.status_code == 200
    data = r.json()
    assert data["total_idle_loss_usd"] > 0

    # 3. Solve Mitigation
    r = client.post(
        "/api/v1/engine/solve-mitigation",
        json={"node_id": "T3-APEX-FAB", "delay_days": 10}
    )
    assert r.status_code == 200
    solve_data = r.json()
    assert "optimal_scenario" in solve_data

    # 4. Dispatch Remediation
    r = client.post(
        "/api/v1/po/dispatch",
        json={"scenario_id": solve_data["optimal_scenario"]["scenario_id"], "notes": "Approved"}
    )
    assert r.status_code == 200
    dispatch_data = r.json()
    assert dispatch_data["blast_radius_cleared"] is True
