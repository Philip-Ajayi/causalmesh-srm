import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TopologyGraph } from './components/TopologyGraph';
import { BlastCommandCenter } from './components/BlastCommandCenter';
import { RemediationWorkbench } from './components/RemediationWorkbench';
import { DisruptionModal } from './components/DisruptionModal';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { ApiClient } from './services/api';
import {
  NetworkTopologyResponse,
  BlastRadiusResponse,
  SolveMitigationResponse,
  AuditLogEntry
} from './types';
import { INITIAL_FALLBACK_TOPOLOGY } from './services/mockData';

export const App: React.FC = () => {
  const [topology, setTopology] = useState<NetworkTopologyResponse>(INITIAL_FALLBACK_TOPOLOGY);
  const [blastData, setBlastData] = useState<BlastRadiusResponse | null>(null);
  const [solveData, setSolveData] = useState<SolveMitigationResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [activeScreen, setActiveScreen] = useState<'topology' | 'command' | 'workbench' | 'audit'>('topology');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    const topo = await ApiClient.fetchTopology();
    setTopology(topo);
    setIsMockMode(ApiClient.isMockMode);
    const logs = await ApiClient.fetchAuditLogs();
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Dynamic WSS/WS WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${protocol}//${window.location.host}/ws`;
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || defaultWsUrl;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'DISRUPTION_ALERT') {
            setBlastData(parsed.data);
            ApiClient.fetchTopology().then(setTopology);
          } else if (parsed.type === 'REMEDIATION_EXECUTED') {
            ApiClient.fetchTopology().then(setTopology);
            ApiClient.fetchAuditLogs().then(setAuditLogs);
          } else if (parsed.type === 'SYSTEM_RESET') {
            setTopology(parsed.data);
            setBlastData(null);
            setSolveData(null);
          }
        } catch {
          // ignore keep-alive
        }
      };
    } catch {
      console.warn('[CausalMesh] WebSocket connection unavailable; running over HTTP.');
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleTriggerDisruption = async (nodeId: string, delayDays: number, reason: string) => {
    setIsSolving(true);
    const blastRes = await ApiClient.injectDisruption(nodeId, delayDays, reason);
    setBlastData(blastRes);

    const updatedTopo = await ApiClient.fetchTopology();
    setTopology(updatedTopo);

    const solverRes = await ApiClient.solveMitigation(nodeId, delayDays);
    setSolveData(solverRes);

    const logs = await ApiClient.fetchAuditLogs();
    setAuditLogs(logs);

    setIsSolving(false);
    setActiveScreen('command');
  };

  const handleExecuteDispatch = async (scenarioId: string) => {
    setIsDispatching(true);
    await ApiClient.dispatchRemediation(scenarioId);
    const updatedTopo = await ApiClient.fetchTopology();
    setTopology(updatedTopo);

    setBlastData(null);
    const logs = await ApiClient.fetchAuditLogs();
    setAuditLogs(logs);
    setIsDispatching(false);
  };

  const handleReset = async () => {
    await ApiClient.resetSimulation();
    setBlastData(null);
    setSolveData(null);
    const topo = await ApiClient.fetchTopology();
    setTopology(topo);
    const logs = await ApiClient.fetchAuditLogs();
    setAuditLogs(logs);
    setActiveScreen('topology');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100">
      <Header
        hasActiveDisruption={blastData !== null && blastData.stalled_work_centers.length > 0}
        isSolving={isSolving}
        onOpenDisruptionModal={() => setIsModalOpen(true)}
        onReset={handleReset}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        isMockMode={isMockMode}
      />

      <main className="flex-1 relative overflow-hidden">
        {activeScreen === 'topology' && (
          <TopologyGraph
            topology={topology}
            onNodeClick={(id) => {
              if (id === 'T3-APEX-FAB') setIsModalOpen(true);
            }}
          />
        )}

        {activeScreen === 'command' && (
          <BlastCommandCenter
            blastData={blastData}
            onNavigateToRemediation={() => setActiveScreen('workbench')}
          />
        )}

        {activeScreen === 'workbench' && (
          <RemediationWorkbench
            solveData={solveData}
            onExecuteDispatch={handleExecuteDispatch}
            isDispatching={isDispatching}
          />
        )}

        {activeScreen === 'audit' && <AuditLogDrawer logs={auditLogs} />}
      </main>

      <DisruptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTriggerDisruption={handleTriggerDisruption}
      />
    </div>
  );
};

export default App;
