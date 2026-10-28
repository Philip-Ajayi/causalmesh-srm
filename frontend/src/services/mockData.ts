import {
  NetworkTopologyResponse,
  BlastRadiusResponse,
  SolveMitigationResponse
} from '../types';

export const INITIAL_FALLBACK_TOPOLOGY: NetworkTopologyResponse = {
  total_nodes: 13,
  total_edges: 14,
  nodes: [
    {
      id: 'T3-APEX-FAB',
      label: 'Apex Silicon Fab (Kaohsiung)',
      type: 'Tier3Supplier',
      status: 'nominal',
      tier: 3,
      location: 'Kaohsiung, TW',
      metadata: { certifications: ['IATF-16949'], reliability: '96.4%' }
    },
    {
      id: 'T3-GRAZ-SEMI',
      label: 'MicroTech Graz Semi (Austria)',
      type: 'Tier3Supplier',
      status: 'nominal',
      tier: 3,
      location: 'Graz, AT',
      metadata: { certifications: ['IATF-16949'], reliability: '99.1%', secondary: true }
    },
    {
      id: 'T3-SHIN-WAFER',
      label: 'Shin-Etsu Substrates',
      type: 'Tier3Supplier',
      status: 'nominal',
      tier: 3,
      location: 'Niigata, JP',
      metadata: { reliability: '98.8%' }
    },
    {
      id: 'PART-MCU-8841',
      label: 'MCU-8841-A (ASIL-D Automotive MCU)',
      type: 'Part',
      status: 'nominal',
      part_number: 'MCU-8841-A',
      unit_cost: 42.5,
      lead_time_days: 45,
      metadata: { criticality: 'Safety-Critical' }
    },
    {
      id: 'PO-8821',
      label: 'PO #8821 (10,000 units)',
      type: 'PurchaseOrder',
      status: 'nominal',
      part_number: 'MCU-8841-A',
      quantity: 10000,
      metadata: { vendor: 'Apex Silicon Fab' }
    },
    {
      id: 'T2-ADV-PCBA',
      label: 'Advanced PCBA Systems (MX)',
      type: 'Tier2Supplier',
      status: 'nominal',
      tier: 2,
      location: 'Guadalajara, MX'
    },
    {
      id: 'T2-ALPINE-DISP',
      label: 'Alpine OLED Optics (Seoul)',
      type: 'Tier2Supplier',
      status: 'nominal',
      tier: 2,
      location: 'Seoul, KR'
    },
    {
      id: 'PART-PCBA-V2',
      label: 'PCBA-CLUSTER-V2 (Instrument Cluster)',
      type: 'Part',
      status: 'nominal',
      part_number: 'PCBA-CLUSTER-V2',
      unit_cost: 185.0
    },
    {
      id: 'T1-VISTEON-COCKPIT',
      label: 'Apex Cockpit Integrator',
      type: 'Tier1Supplier',
      status: 'nominal',
      tier: 1,
      location: 'Munich, DE'
    },
    {
      id: 'WC-1-CHASSIS',
      label: 'Work Center 1: Structural Chassis',
      type: 'WorkCenter',
      status: 'nominal',
      hourly_downtime_cost: 3200,
      safety_buffer_days: 5
    },
    {
      id: 'WC-2-POWERTRAIN',
      label: 'Work Center 2: EV Battery Pack Decking',
      type: 'WorkCenter',
      status: 'nominal',
      hourly_downtime_cost: 3800,
      safety_buffer_days: 4
    },
    {
      id: 'WC-3-COCKPIT',
      label: 'Work Center 3: Cockpit Final Integration',
      type: 'WorkCenter',
      status: 'nominal',
      hourly_downtime_cost: 4500,
      safety_buffer_days: 3,
      metadata: { takt_seconds: 96, output_hourly: 2.5 }
    },
    {
      id: 'WC-4-FINAL-INSPECT',
      label: 'Work Center 4: ADAS Calibration',
      type: 'WorkCenter',
      status: 'nominal',
      hourly_downtime_cost: 2900,
      safety_buffer_days: 6
    }
  ],
  edges: [
    { id: 'e1', source: 'T3-SHIN-WAFER', target: 'T3-APEX-FAB', relationship: 'SUPPLIES_INGOTS', is_critical_path: false },
    { id: 'e2', source: 'T3-APEX-FAB', target: 'PART-MCU-8841', relationship: 'FABRICATES', is_critical_path: false },
    { id: 'e3', source: 'T3-GRAZ-SEMI', target: 'PART-MCU-8841', relationship: 'QUALIFIED_SECONDARY', is_critical_path: false },
    { id: 'e4', source: 'T3-APEX-FAB', target: 'PO-8821', relationship: 'COMMITTED_UNDER', is_critical_path: false },
    { id: 'e5', source: 'PART-MCU-8841', target: 'T2-ADV-PCBA', relationship: 'FEEDS_SMT', is_critical_path: false },
    { id: 'e6', source: 'T2-ADV-PCBA', target: 'PART-PCBA-V2', relationship: 'MANUFACTURES', is_critical_path: false },
    { id: 'e7', source: 'PART-PCBA-V2', target: 'T1-VISTEON-COCKPIT', relationship: 'INTEGRATED_INTO', is_critical_path: false },
    { id: 'e8', source: 'T2-ALPINE-DISP', target: 'T1-VISTEON-COCKPIT', relationship: 'OPTICS_SUPPLY', is_critical_path: false },
    { id: 'e9', source: 'T1-VISTEON-COCKPIT', target: 'WC-3-COCKPIT', relationship: 'DELIVERS_JIS', is_critical_path: false },
    { id: 'e10', source: 'WC-1-CHASSIS', target: 'WC-2-POWERTRAIN', relationship: 'FLOWS_TO', is_critical_path: false },
    { id: 'e11', source: 'WC-2-POWERTRAIN', target: 'WC-3-COCKPIT', relationship: 'FLOWS_TO', is_critical_path: false },
    { id: 'e12', source: 'WC-3-COCKPIT', target: 'WC-4-FINAL-INSPECT', relationship: 'FLOWS_TO', is_critical_path: false }
  ]
};

export function simulateFallbackBlast(nodeId: string, delayDays: number, reason: string): BlastRadiusResponse {
  const safetyBuffer = 3;
  const breachDays = Math.max(0, delayDays - safetyBuffer);
  const idleHours = breachDays * 24;
  const hourlyRate = 4500;
  const totalLoss = idleHours * hourlyRate;

  return {
    disrupted_node_id: nodeId,
    delay_days: delayDays,
    reason,
    critical_path: [
      'T3-APEX-FAB->PART-MCU-8841',
      'PART-MCU-8841->T2-ADV-PCBA',
      'T2-ADV-PCBA->PART-PCBA-V2',
      'PART-PCBA-V2->T1-VISTEON-COCKPIT',
      'T1-VISTEON-COCKPIT->WC-3-COCKPIT'
    ],
    impacted_pos: [
      {
        po_id: 'PO-8821',
        part_number: 'MCU-8841-A',
        original_arrival_days: 2,
        revised_arrival_days: 2 + delayDays,
        units_at_risk: 10000,
        supplier_id: 'T3-APEX-FAB'
      }
    ],
    stalled_work_centers: [
      {
        work_center_id: 'WC-3-COCKPIT',
        name: 'Work Center 3: Cockpit Final Integration',
        safety_buffer_days: safetyBuffer,
        starvation_starts_in_hours: safetyBuffer * 24,
        line_stoppage_hours: idleHours,
        hourly_penalty_usd: hourlyRate,
        financial_loss_usd: totalLoss,
        affected_vehicle_models: ['Model S Sedan', 'Model E-Cross EV'],
        impacted_units: Math.floor(idleHours * 2.5)
      }
    ],
    total_idle_loss_usd: totalLoss,
    earliest_line_stop_hours: 72,
    total_vehicles_delayed: Math.floor(idleHours * 2.5),
    propagation_ms: 142.6
  };
}

export function simulateFallbackSolver(nodeId: string, delayDays: number): SolveMitigationResponse {
  return {
    disruption_node_id: nodeId,
    solver_status: 'Optimal',
    execution_time_ms: 384.2,
    optimal_scenario: {
      scenario_id: 'SCENARIO-LP-OPTIMAL-SPLIT',
      title: 'Scenario A: PO Split (60/40) & Air Expedite (LP Optimal)',
      description: 'Reallocate 4,000 units to MicroTech Graz via priority air freight. Delivers in 44 hours, fully absorbing the safety buffer.',
      expedite_cost_usd: 15400.0,
      resequencing_cost_usd: 0.0,
      supplier_surcharge_usd: 14000.0,
      total_mitigation_cost_usd: 29400.0,
      projected_downtime_loss_usd: 0.0,
      net_savings_usd: 726600.0,
      hours_recovered: 168,
      recommended: true,
      po_splits: [
        { supplier: 'Apex Silicon Fab (Kaohsiung)', volume: 6000, freight: 'Standard Ocean', status: 'Retained Volume' },
        { supplier: 'MicroTech Graz Semi (Austria)', volume: 4000, freight: 'Priority Air Express', status: 'Expedited Allocation' }
      ]
    },
    alternative_scenarios: [
      {
        scenario_id: 'SCENARIO-MES-RESEQUENCE',
        title: 'Scenario B: Dynamic MES Line Resequence + 25% Buffer Top-up',
        description: 'Swap Work Center 3 sequence to assemble unblocked EV variant (utilizing on-hand MCU-9200) for 96 hours while top-up order arrives.',
        expedite_cost_usd: 8500.0,
        resequencing_cost_usd: 3500.0,
        supplier_surcharge_usd: 8750.0,
        total_mitigation_cost_usd: 20750.0,
        projected_downtime_loss_usd: 0.0,
        net_savings_usd: 735250.0,
        hours_recovered: 168,
        recommended: false,
        po_splits: [
          { supplier: 'Apex Silicon Fab (Kaohsiung)', volume: 7500, freight: 'Standard Ocean', status: 'Deferred' },
          { supplier: 'MicroTech Graz Semi (Austria)', volume: 2500, freight: 'Regional Fast Truck', status: 'Top-up' }
        ],
        mes_line_swap: {
          target_work_center: 'WC-3-COCKPIT',
          original_variant: 'Model S Sedan (Cockpit IC-A)',
          substituted_variant: 'Model E-Cross EV (Cockpit IC-EV)',
          allocated_part: 'MCU-9200-EV',
          swap_duration_hours: 96
        }
      },
      {
        scenario_id: 'SCENARIO-DO-NOTHING',
        title: 'Baseline: Absorb Disruption (Status Quo)',
        description: 'Await late delivery from primary fab without intervention. Work Center 3 halts after 72 hours.',
        expedite_cost_usd: 0.0,
        resequencing_cost_usd: 0.0,
        supplier_surcharge_usd: 0.0,
        total_mitigation_cost_usd: 0.0,
        projected_downtime_loss_usd: 756000.0,
        net_savings_usd: 0.0,
        hours_recovered: 0,
        recommended: false,
        po_splits: [
          { supplier: 'Apex Silicon Fab (Kaohsiung)', volume: 10000, freight: 'Delayed Delivery', status: 'Stalled' }
        ]
      }
    ]
  };
}
