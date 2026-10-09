// App.jsx - main application component for Boond leak detection
import React, { useState, useEffect } from 'react';
import { fetchNetwork } from './api.js';
import { useScenario } from './hooks/useScenario.js';
import { TopBar } from './components/TopBar.jsx';
import { Controls } from './components/Controls.jsx';
import { Status } from './components/Status.jsx';
import { Candidates } from './components/Candidates.jsx';
import { NetworkMap } from './components/NetworkMap.jsx';
import { CycleRibbon } from './components/CycleRibbon.jsx';

export function App() {
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState('J-12');
  const [selectedPipe, setSelectedPipe] = useState(null);
  const [selectedSize, setSelectedSize] = useState('medium');
  const [sensorCount, setSensorCount] = useState(20);
  const [isRevealed, setIsRevealed] = useState(false);

  // Fetch network on mount
  useEffect(() => {
    fetchNetwork().then((net) => {
      setNetwork(net);
      if (net && net.pipes && net.pipes.length > 0) {
        // Find pipe connected to default node J-12
        const p = net.pipes.find(pipe => pipe.from === 'J-12' || pipe.to === 'J-12');
        if (p) setSelectedPipe(p.id);
      }
    });
  }, []);

  // Hook loads scenario and manages playback
  const {
    scenario,
    currentCycle,
    isPlaying,
    play,
    pause,
    step,
  } = useScenario(selectedNode, selectedSize);

  // Extract scenario results for current sensor count
  const results = scenario?.results?.[String(sensorCount)] || null;

  function handleSelectPipe(pipe) {
    setSelectedPipe(pipe.id);
    setSelectedNode(pipe.from);
    setIsRevealed(false);
  }

  function handleSelectNode(nodeId) {
    setSelectedNode(nodeId);
    if (network && network.pipes) {
      const p = network.pipes.find(pipe => pipe.from === nodeId || pipe.to === nodeId);
      if (p) setSelectedPipe(p.id);
    }
    setIsRevealed(false);
  }

  function handleSizeChange(newSize) {
    setSelectedSize(newSize);
    setIsRevealed(false);
  }

  function handleSensorCountChange(newCount) {
    setSensorCount(newCount);
  }

  function handleToggleReveal() {
    setIsRevealed(prev => !prev);
  }

  return (
    <div className="app-frame">
      <TopBar />

      <main className="main-body">
        <div className="workspace-grid">
          <NetworkMap
            network={network}
            selectedPipe={selectedPipe}
            selectedNode={selectedNode}
            onSelectPipe={handleSelectPipe}
            onSelectNode={handleSelectNode}
            sensorCount={sensorCount}
            results={results}
            currentCycle={currentCycle}
            isRevealed={isRevealed}
            trueLeakNode={scenario?.leak_node}
          />

          <div className="side-pane">
            <Controls
              size={selectedSize}
              onSizeChange={handleSizeChange}
              sensorCount={sensorCount}
              onSensorCountChange={handleSensorCountChange}
            />

            <Status
              scenario={scenario}
              results={results}
              currentCycle={currentCycle}
            />

            <Candidates
              scenario={scenario}
              results={results}
              currentCycle={currentCycle}
              isRevealed={isRevealed}
              onToggleReveal={handleToggleReveal}
              network={network}
            />
          </div>
        </div>

        <CycleRibbon
          scenario={scenario}
          results={results}
          currentCycle={currentCycle}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onStep={step}
          isRevealed={isRevealed}
          selectedSensor={network?.sensor_sets?.[String(sensorCount)]?.[0]}
        />
      </main>
    </div>
  );
}

export default App;
