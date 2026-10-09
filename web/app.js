const React = window.React || globalThis.React;
const ReactDOM = window.ReactDOM || globalThis.ReactDOM;
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const API_BASE = ""; // Real AWS API Gateway URL (empty = fallback to local data)

function App() {
  const [network, setNetwork] = useState(window.BOOND_NETWORK || null);
  const [scenarios, setScenarios] = useState(window.BOOND_SCENARIOS || null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentSize, setCurrentSize] = useState("medium");
  const [currentSensorCount, setCurrentSensorCount] = useState("20");
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState(null);
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: ""
  });

  // Initial Data Fetching
  useEffect(() => {
    async function initData() {
      let net = window.BOOND_NETWORK;
      let scen = window.BOOND_SCENARIOS;
      try {
        if (API_BASE) {
          const r1 = await fetch(`${API_BASE}/network`);
          if (r1.ok) net = await r1.json();
        }
        if (!net) {
          const r1 = await fetch("network.json");
          if (r1.ok) net = await r1.json();
        }
      } catch (e) {
        console.warn("network fetch error:", e);
      }
      try {
        if (!scen) {
          const r2 = await fetch("scenarios.json");
          if (r2.ok) scen = await r2.json();
        }
      } catch (e) {
        console.warn("scenarios fetch error:", e);
      }
      if (net) setNetwork(net);
      if (scen) setScenarios(scen);
    }
    initData();
  }, []);

  // Set initial scenario once data is ready
  useEffect(() => {
    if (network && scenarios && !currentScenario) {
      const defaultNode = "J-22";
      loadScenario(defaultNode, currentSize);
      if (network.sensor_sets && network.sensor_sets[currentSensorCount]) {
        setSelectedSensorId(network.sensor_sets[currentSensorCount][0]);
      }
    }
  }, [network, scenarios]);

  // Scenario Loader
  const loadScenario = useCallback(async (nodeId, size) => {
    setIsPlaying(false);
    setIsRevealed(false);
    let scenObj = null;
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/scenario?node=${nodeId}&size=${size}`);
        if (res.ok) scenObj = await res.json();
      } catch (e) {}
    }
    if (!scenObj && scenarios) {
      const id = `${nodeId}_${size}`;
      if (Array.isArray(scenarios)) {
        scenObj = scenarios.find(s => s.id === id || s.leak_node === nodeId && s.size_label === size);
      } else if (scenarios[id]) {
        scenObj = scenarios[id];
      }
    }

    // Fallback: nearest scenario
    if (!scenObj && scenarios && network) {
      const targetNode = network.nodes.find(n => n.id === nodeId);
      if (targetNode) {
        const list = Array.isArray(scenarios) ? scenarios : Object.values(scenarios);
        let bestDist = Infinity;
        for (const s of list) {
          if (s.size_label !== size) continue;
          const n = network.nodes.find(x => x.id === s.leak_node);
          if (n) {
            const d = Math.hypot(n.x - targetNode.x, n.y - targetNode.y);
            if (d < bestDist) {
              bestDist = d;
              scenObj = s;
            }
          }
        }
      }
    }
    if (scenObj) {
      setCurrentScenario(scenObj);
      setCurrentCycle(0);
    }
  }, [scenarios, network]);

  // Handle Size change
  const handleSizeChange = size => {
    setCurrentSize(size);
    if (currentScenario) {
      loadScenario(currentScenario.leak_node, size);
    }
  };

  // Handle Sensor Count change
  const handleSensorsChange = count => {
    setCurrentSensorCount(count);
    if (network && network.sensor_sets && network.sensor_sets[count]) {
      setSelectedSensorId(network.sensor_sets[count][0]);
    }
  };

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentCycle(prev => {
        if (prev >= 7) {
          setIsPlaying(false);
          return 7;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Results slice for current sensor density
  const currentResults = useMemo(() => {
    if (!currentScenario || !currentScenario.results) return null;
    return currentScenario.results[currentSensorCount] || null;
  }, [currentScenario, currentSensorCount]);
  const isDetected = useMemo(() => {
    if (!currentResults || currentResults.detected_cycle === null) return false;
    return currentCycle >= currentResults.detected_cycle;
  }, [currentResults, currentCycle]);
  const isLeaking = useMemo(() => {
    if (!currentScenario) return false;
    return currentCycle >= currentScenario.start_cycle;
  }, [currentScenario, currentCycle]);
  return /*#__PURE__*/React.createElement("div", {
    className: "app-container"
  }, /*#__PURE__*/React.createElement("header", {
    className: "top-nav"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo-badge"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#FFFFFF",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "brand-title"
  }, "BOOND"), /*#__PURE__*/React.createElement("span", {
    className: "brand-subtitle"
  }, "Cyber AI Leak Telemetry"))), /*#__PURE__*/React.createElement("div", {
    className: "nav-telemetry"
  }, /*#__PURE__*/React.createElement("div", {
    className: "telemetry-chip"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pulse-dot"
  }), /*#__PURE__*/React.createElement("span", null, "EPANET / WNTR HYDRAULIC ENGINE")), /*#__PURE__*/React.createElement("div", {
    className: "telemetry-chip num"
  }, "60 JUNCTIONS • 119 PIPES"), /*#__PURE__*/React.createElement("div", {
    className: "telemetry-chip"
  }, "IWS: 06–09h & 18–21h"), /*#__PURE__*/React.createElement("span", {
    className: "simulated-pill"
  }, "Simulated Data"))), /*#__PURE__*/React.createElement("div", {
    className: "main-workspace"
  }, /*#__PURE__*/React.createElement(MapCanvas, {
    network: network,
    currentScenario: currentScenario,
    currentResults: currentResults,
    currentSensorCount: currentSensorCount,
    currentCycle: currentCycle,
    isDetected: isDetected,
    isRevealed: isRevealed,
    selectedSensorId: selectedSensorId,
    onSelectSensor: setSelectedSensorId,
    onInjectLeak: nodeId => loadScenario(nodeId, currentSize),
    setTooltip: setTooltip
  }), /*#__PURE__*/React.createElement(SidePanel, {
    currentScenario: currentScenario,
    currentResults: currentResults,
    currentSize: currentSize,
    currentSensorCount: currentSensorCount,
    currentCycle: currentCycle,
    isDetected: isDetected,
    isLeaking: isLeaking,
    isRevealed: isRevealed,
    onSizeChange: handleSizeChange,
    onSensorsChange: handleSensorsChange,
    onToggleReveal: () => setIsRevealed(r => !r),
    network: network
  })), /*#__PURE__*/React.createElement(RibbonSection, {
    network: network,
    currentScenario: currentScenario,
    currentResults: currentResults,
    currentSensorCount: currentSensorCount,
    currentCycle: currentCycle,
    isPlaying: isPlaying,
    isRevealed: isRevealed,
    selectedSensorId: selectedSensorId,
    onTogglePlay: () => {
      if (currentCycle >= 7) setCurrentCycle(0);
      setIsPlaying(p => !p);
    },
    onStep: dir => {
      setIsPlaying(false);
      setCurrentCycle(c => Math.max(0, Math.min(7, c + dir)));
    },
    onSelectCycle: c => {
      setIsPlaying(false);
      setCurrentCycle(c);
    }
  }), tooltip.show && /*#__PURE__*/React.createElement("div", {
    className: "tooltip-popup",
    style: {
      left: tooltip.x,
      top: tooltip.y
    }
  }, /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: tooltip.content
    }
  })));
}

/* -------------------------------------------------------------
   Map Component
   ------------------------------------------------------------- */
function MapCanvas({
  network,
  currentScenario,
  currentResults,
  currentSensorCount,
  currentCycle,
  isDetected,
  isRevealed,
  selectedSensorId,
  onSelectSensor,
  onInjectLeak,
  setTooltip
}) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({
    w: 800,
    h: 500
  });
  useEffect(() => {
    function updateDims() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDims({
            w: rect.width,
            h: rect.height
          });
        }
      }
    }
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);
  const nodePositions = useMemo(() => {
    if (!network || !network.nodes) return {};
    const xs = network.nodes.map(n => n.x);
    const ys = network.nodes.map(n => n.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const pad = 48;
    const scaleX = (dims.w - pad * 2) / (maxX - minX || 1);
    const scaleY = (dims.h - pad * 2) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (dims.w - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (dims.h - (maxY - minY) * scale) / 2 - minY * scale;
    const pos = {};
    network.nodes.forEach(n => {
      pos[n.id] = {
        x: n.x * scale + offsetX,
        y: n.y * scale + offsetY
      };
    });
    return pos;
  }, [network, dims]);
  const activeSensors = useMemo(() => {
    if (!network || !network.sensor_sets) return [];
    return network.sensor_sets[currentSensorCount] || [];
  }, [network, currentSensorCount]);
  return /*#__PURE__*/React.createElement("div", {
    className: "map-section",
    ref: containerRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "map-header-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "map-status-badge"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#38BDF8",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })), /*#__PURE__*/React.createElement("span", null, "Click any pipe or junction to inject a leak")), /*#__PURE__*/React.createElement("div", {
    className: "map-legend-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "legend-icon-sensor"
  }), /*#__PURE__*/React.createElement("span", null, "Pressure Sensor (", activeSensors.length, ")")), isRevealed && /*#__PURE__*/React.createElement("div", {
    className: "legend-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "legend-icon-leak"
  }), /*#__PURE__*/React.createElement("span", null, "Ground Truth")))), /*#__PURE__*/React.createElement("div", {
    className: "svg-container"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "network-canvas"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "glow-cyan",
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "3",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  }))), /*#__PURE__*/React.createElement("filter", {
    id: "glow-red",
    x: "-30%",
    y: "-30%",
    width: "160%",
    height: "160%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "4",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), network && network.pipes.map(p => {
    const p1 = nodePositions[p.from];
    const p2 = nodePositions[p.to];
    if (!p1 || !p2) return null;
    return /*#__PURE__*/React.createElement("line", {
      key: p.id,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      stroke: "rgba(100, 116, 139, 0.45)",
      strokeWidth: p.diameter_mm ? Math.max(2, p.diameter_mm / 90) : 2.5,
      strokeLinecap: "round",
      style: {
        cursor: "pointer",
        transition: "stroke 0.15s ease"
      },
      onMouseEnter: e => {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          show: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          content: `Pipe <b>${p.id}</b> &bull; ${p.from} &rarr; ${p.to} &bull; &Oslash;${p.diameter_mm || 200}mm`
        });
      },
      onMouseLeave: () => setTooltip({
        show: false,
        x: 0,
        y: 0,
        content: ""
      }),
      onClick: () => onInjectLeak(p.from)
    });
  }), isDetected && currentResults && currentResults.top_k && currentResults.top_k.map((cand, idx) => {
    const pos = nodePositions[cand.node];
    if (!pos) return null;
    const radius = 12 + cand.score * 16;
    const opacity = 0.25 + cand.score * 0.45;
    return /*#__PURE__*/React.createElement("g", {
      key: `heat-${cand.node}`
    }, /*#__PURE__*/React.createElement("circle", {
      cx: pos.x,
      cy: pos.y,
      r: radius,
      fill: "#EF4444",
      fillOpacity: opacity,
      filter: "url(#glow-red)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: pos.x,
      cy: pos.y,
      r: radius * 0.5,
      fill: "#F59E0B",
      fillOpacity: 0.6
    }));
  }), network && network.nodes.map(n => {
    const pos = nodePositions[n.id];
    if (!pos) return null;
    return /*#__PURE__*/React.createElement("circle", {
      key: n.id,
      cx: pos.x,
      cy: pos.y,
      r: "3.5",
      fill: "#475569",
      stroke: "#0F172A",
      strokeWidth: "1.5",
      style: {
        cursor: "pointer"
      },
      onMouseEnter: e => {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
          show: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          content: `Junction <b>${n.id}</b>`
        });
      },
      onMouseLeave: () => setTooltip({
        show: false,
        x: 0,
        y: 0,
        content: ""
      }),
      onClick: () => onInjectLeak(n.id)
    });
  }), activeSensors.map(sId => {
    const pos = nodePositions[sId];
    if (!pos) return null;
    const isSelected = sId === selectedSensorId;
    return /*#__PURE__*/React.createElement("g", {
      key: `sens-${sId}`,
      style: {
        cursor: "pointer"
      },
      onClick: () => onSelectSensor(sId),
      onMouseEnter: e => {
        const rect = containerRef.current.getBoundingClientRect();
        let pVal = "";
        if (currentScenario && currentScenario.cycles[currentCycle]) {
          const v = currentScenario.cycles[currentCycle].pressures[sId];
          if (v) pVal = ` &bull; <b>${v.toFixed(1)} m</b>`;
        }
        setTooltip({
          show: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          content: `Sensor <b>${sId}</b>${pVal}`
        });
      },
      onMouseLeave: () => setTooltip({
        show: false,
        x: 0,
        y: 0,
        content: ""
      })
    }, /*#__PURE__*/React.createElement("circle", {
      cx: pos.x,
      cy: pos.y,
      r: isSelected ? "9" : "7",
      fill: "none",
      stroke: isSelected ? "#00F2FE" : "#F59E0B",
      strokeWidth: isSelected ? "2.5" : "2",
      filter: "url(#glow-cyan)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: pos.x,
      cy: pos.y,
      r: "3",
      fill: isSelected ? "#00F2FE" : "#F59E0B"
    }));
  }), isRevealed && currentScenario && nodePositions[currentScenario.leak_node] && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: nodePositions[currentScenario.leak_node].x,
    cy: nodePositions[currentScenario.leak_node].y,
    r: "14",
    fill: "none",
    stroke: "#EF4444",
    strokeWidth: "2.5",
    strokeDasharray: "3 3",
    filter: "url(#glow-red)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: nodePositions[currentScenario.leak_node].x,
    cy: nodePositions[currentScenario.leak_node].y,
    r: "6",
    fill: "#EF4444"
  })))));
}

/* -------------------------------------------------------------
   Side Panel Component
   ------------------------------------------------------------- */
function SidePanel({
  currentScenario,
  currentResults,
  currentSize,
  currentSensorCount,
  currentCycle,
  isDetected,
  isLeaking,
  isRevealed,
  onSizeChange,
  onSensorsChange,
  onToggleReveal,
  network
}) {
  const leakDelay = useMemo(() => {
    if (!currentResults || currentResults.detected_cycle === null || !currentScenario) return null;
    return currentResults.detected_cycle - currentScenario.start_cycle;
  }, [currentResults, currentScenario]);
  const verdictInfo = useMemo(() => {
    if (!isRevealed || !currentScenario || !currentResults) return null;
    if (currentResults.detected_cycle === null) {
      return {
        text: "Leak not detected within 8 cycles under this sensor density.",
        exact: false
      };
    }
    const topNode = currentResults.top_k?.[0]?.node;
    const actual = currentScenario.leak_node;
    if (topNode === actual) {
      return {
        text: `✓ Ground truth exactly matches Top Candidate (${actual})!`,
        exact: true
      };
    }
    const hops = computeHopDistance(network, actual, topNode);
    return {
      text: `Actual leak is ${hops} junction${hops === 1 ? "" : "s"} away from top candidate.`,
      exact: false
    };
  }, [isRevealed, currentScenario, currentResults, network]);
  return /*#__PURE__*/React.createElement("div", {
    className: "side-telemetry"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, /*#__PURE__*/React.createElement("span", null, "SCENARIO CONTROLS"), /*#__PURE__*/React.createElement("span", {
    className: "num",
    style: {
      color: "var(--cyan-bright)"
    }
  }, currentScenario ? currentScenario.leak_node : "—")), /*#__PURE__*/React.createElement("div", {
    className: "control-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "control-label"
  }, "Leak Magnitude"), /*#__PURE__*/React.createElement("div", {
    className: "segmented-group"
  }, ["small", "medium", "large"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: `segmented-btn ${currentSize === s ? "active" : ""}`,
    onClick: () => onSizeChange(s)
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "control-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "control-label"
  }, "Sensor Density"), /*#__PURE__*/React.createElement("div", {
    className: "segmented-group"
  }, ["5", "10", "20"].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    className: `segmented-btn ${currentSensorCount === c ? "active" : ""}`,
    onClick: () => onSensorsChange(c)
  }, c))))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "ANOMALY DETECTION ENGINE"), /*#__PURE__*/React.createElement("div", {
    className: `alert-banner ${isDetected ? "detected" : "normal"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert-headline"
  }, isDetected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })), /*#__PURE__*/React.createElement("span", null, "HIGH-CONFIDENCE LEAK CONFIRMED")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "22 4 12 14.01 9 11.01"
  })), /*#__PURE__*/React.createElement("span", null, "ALL SECTORS NOMINAL"))), /*#__PURE__*/React.createElement("div", {
    className: "alert-detail"
  }, isDetected ? /*#__PURE__*/React.createElement(React.Fragment, null, "Alarm triggered at ", /*#__PURE__*/React.createElement("b", null, "Cycle ", currentResults.detected_cycle), " (", leakDelay, " cycle delay). Multi-cycle persistence verified at 5% FAR calibration.") : isLeaking ? /*#__PURE__*/React.createElement(React.Fragment, null, "Evaluating cancellation residual... anomaly has not crossed persistence threshold.") : /*#__PURE__*/React.createElement(React.Fragment, null, "Test statistic d remains below 1.10 threshold. Common-mode consumer swing projected out.")))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, /*#__PURE__*/React.createElement("span", null, "MOST LIKELY CANDIDATES"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "10px",
      color: "var(--text-faint)"
    }
  }, "COSINE SIGNATURE")), /*#__PURE__*/React.createElement("div", {
    className: "candidate-table"
  }, isDetected && currentResults?.top_k ? currentResults.top_k.slice(0, 5).map((cand, idx) => /*#__PURE__*/React.createElement("div", {
    key: cand.node,
    className: "candidate-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "candidate-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: `rank-pill ${idx === 0 ? "gold" : ""}`
  }, idx + 1), /*#__PURE__*/React.createElement("span", {
    className: "candidate-name"
  }, cand.node)), /*#__PURE__*/React.createElement("div", {
    className: "score-bar-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "score-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "score-fill",
    style: {
      width: `${Math.round(cand.score * 100)}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "score-val num"
  }, cand.score.toFixed(2))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-faint)",
      padding: "10px 0",
      fontSize: "11px",
      textAlign: "center"
    }
  }, isLeaking ? "Analyzing anomaly gradient..." : "Click a pipe to start leak scenario")), /*#__PURE__*/React.createElement("button", {
    className: `btn-reveal ${isRevealed ? "active" : ""}`,
    onClick: onToggleReveal
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })), /*#__PURE__*/React.createElement("span", null, isRevealed ? "Hide True Location" : "Reveal Ground Truth Leak")), verdictInfo && /*#__PURE__*/React.createElement("div", {
    className: `verdict-box ${verdictInfo.exact ? "exact" : ""}`
  }, verdictInfo.text), currentResults?.next_sensor && /*#__PURE__*/React.createElement("div", {
    className: "next-sensor-box"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "12",
    x2: "16",
    y2: "12"
  })), /*#__PURE__*/React.createElement("span", null, "Suggested Next Sensor: ", /*#__PURE__*/React.createElement("b", null, currentResults.next_sensor)))));
}

/* -------------------------------------------------------------
   Supply Ribbon Strip Chart Component
   ------------------------------------------------------------- */
function RibbonSection({
  network,
  currentScenario,
  currentResults,
  currentSensorCount,
  currentCycle,
  isPlaying,
  isRevealed,
  selectedSensorId,
  onTogglePlay,
  onStep,
  onSelectCycle
}) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({
    w: 900,
    h: 180
  });
  useEffect(() => {
    function update() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDims({
            w: rect.width,
            h: rect.height
          });
        }
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const activeSensors = useMemo(() => {
    if (!network || !network.sensor_sets) return [];
    return network.sensor_sets[currentSensorCount] || [];
  }, [network, currentSensorCount]);

  // Chart dimensions
  const padL = 84;
  const padR = 24;
  const padT = 16;
  const padB = 24;
  const chartW = Math.max(100, dims.w - padL - padR);
  const cycleW = chartW / 8;
  const mainH = (dims.h - padT - padB) * 0.60;
  const lowerT = padT + mainH + 16;
  const lowerH = (dims.h - padT - padB) * 0.40 - 16;
  const minP = 22,
    maxP = 36;
  const pToY = p => padT + mainH - (p - minP) / (maxP - minP) * mainH;
  const thr = currentResults ? currentResults.threshold : 1.10;
  const maxD = 6.0;
  const dToY = d => lowerT + lowerH - Math.min(d, maxD) / maxD * lowerH;
  return /*#__PURE__*/React.createElement("div", {
    className: "ribbon-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ribbon-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ribbon-title"
  }, /*#__PURE__*/React.createElement("span", null, "SUPPLY CYCLE RIBBON"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "11px",
      color: "var(--text-faint)"
    }
  }, "06:00–09:00h & 18:00–21:00h SUPPLY WINDOWS")), /*#__PURE__*/React.createElement("div", {
    className: "playback-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: `ctrl-btn play-btn`,
    onClick: onTogglePlay
  }, isPlaying ? "Pause" : "Play Telemetry"), /*#__PURE__*/React.createElement("button", {
    className: "ctrl-btn",
    onClick: () => onStep(-1)
  }, "← Prev"), /*#__PURE__*/React.createElement("button", {
    className: "ctrl-btn",
    onClick: () => onStep(1)
  }, "Next →"), /*#__PURE__*/React.createElement("div", {
    className: "cycle-pill-group"
  }, [0, 1, 2, 3, 4, 5, 6, 7].map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    className: `cycle-badge ${currentCycle === c ? "active" : ""}`,
    onClick: () => onSelectCycle(c)
  }, c))))), /*#__PURE__*/React.createElement("div", {
    className: "ribbon-chart-canvas-wrap",
    ref: containerRef
  }, /*#__PURE__*/React.createElement("svg", {
    className: "ribbon-canvas"
  }, /*#__PURE__*/React.createElement("text", {
    x: "14",
    y: padT + mainH / 2,
    fill: "#64748B",
    fontSize: "11",
    fontWeight: "600"
  }, "Pressure (m)"), /*#__PURE__*/React.createElement("text", {
    x: "14",
    y: padT + mainH / 2 + 13,
    fill: "#475569",
    fontSize: "9"
  }, "06-09, 18-21h"), /*#__PURE__*/React.createElement("text", {
    x: "14",
    y: lowerT + lowerH / 2 + 4,
    fill: "#64748B",
    fontSize: "11",
    fontWeight: "600"
  }, "Signal d"), [0, 1, 2, 3, 4, 5, 6, 7].map(c => {
    const cx = padL + c * cycleW;
    const w1X = cx + cycleW * (6 / 24);
    const w1W = cycleW * (3 / 24);
    const w2X = cx + cycleW * (18 / 24);
    const w2W = cycleW * (3 / 24);
    return /*#__PURE__*/React.createElement("g", {
      key: `cycle-col-${c}`
    }, /*#__PURE__*/React.createElement("line", {
      x1: cx,
      y1: padT,
      x2: cx,
      y2: dims.h - padB,
      stroke: "rgba(255, 255, 255, 0.05)",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: w1X,
      y: padT,
      width: w1W,
      height: mainH,
      fill: "rgba(56, 189, 248, 0.08)"
    }), /*#__PURE__*/React.createElement("rect", {
      x: w2X,
      y: padT,
      width: w2W,
      height: mainH,
      fill: "rgba(56, 189, 248, 0.08)"
    }), /*#__PURE__*/React.createElement("line", {
      x1: cx,
      y1: pToY(29.8),
      x2: cx + cycleW,
      y2: pToY(29.8),
      stroke: "rgba(148, 163, 184, 0.25)",
      strokeDasharray: "3 3"
    }), /*#__PURE__*/React.createElement("line", {
      x1: cx,
      y1: pToY(27.2),
      x2: cx + cycleW,
      y2: pToY(27.2),
      stroke: "rgba(148, 163, 184, 0.25)",
      strokeDasharray: "3 3"
    }), /*#__PURE__*/React.createElement("text", {
      x: cx + cycleW / 2,
      y: dims.h - 8,
      fill: c === currentCycle ? "#38BDF8" : "#64748B",
      fontWeight: c === currentCycle ? "700" : "500",
      fontSize: "11",
      fontFamily: "var(--font-mono)",
      textAnchor: "middle"
    }, "Cycle ", c));
  }), /*#__PURE__*/React.createElement("line", {
    x1: padL + chartW,
    y1: padT,
    x2: padL + chartW,
    y2: dims.h - padB,
    stroke: "rgba(255, 255, 255, 0.05)"
  }), currentScenario && activeSensors.map(sId => {
    const isSelected = sId === selectedSensorId;
    let dStr = "";
    for (let c = 0; c <= Math.min(currentCycle, 7); c++) {
      const pVal = currentScenario.cycles[c]?.pressures[sId] || 28.5;
      const x = padL + c * cycleW + cycleW / 2;
      const y = pToY(pVal);
      dStr += c === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return /*#__PURE__*/React.createElement("path", {
      key: `p-trace-${sId}`,
      d: dStr,
      fill: "none",
      stroke: isSelected ? "#00F2FE" : "rgba(148, 163, 184, 0.35)",
      strokeWidth: isSelected ? "2.5" : "1",
      strokeLinecap: "round"
    });
  }), /*#__PURE__*/React.createElement("line", {
    x1: padL,
    y1: dToY(thr),
    x2: padL + chartW,
    y2: dToY(thr),
    stroke: "#F59E0B",
    strokeWidth: "1.5",
    strokeDasharray: "4 3"
  }), /*#__PURE__*/React.createElement("text", {
    x: padL + chartW - 6,
    y: dToY(thr) - 4,
    fill: "#F59E0B",
    fontSize: "10",
    fontWeight: "600",
    textAnchor: "end",
    fontFamily: "var(--font-mono)"
  }, "Threshold ", thr.toFixed(2)), currentResults && currentResults.d_series && (() => {
    let dPath = "";
    const points = [];
    for (let c = 0; c <= Math.min(currentCycle, 7); c++) {
      const val = currentResults.d_series[c] || 0;
      const x = padL + c * cycleW + cycleW / 2;
      const y = dToY(val);
      dPath += c === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      points.push({
        x,
        y,
        val
      });
    }
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: dPath,
      fill: "none",
      stroke: "#38BDF8",
      strokeWidth: "2",
      strokeLinecap: "round"
    }), points.map((pt, i) => /*#__PURE__*/React.createElement("circle", {
      key: `pt-${i}`,
      cx: pt.x,
      cy: pt.y,
      r: "3",
      fill: "#38BDF8",
      stroke: "#0F172A",
      strokeWidth: "1.5"
    })));
  })(), currentResults && currentResults.detected_cycle !== null && currentCycle >= currentResults.detected_cycle && (() => {
    const detC = currentResults.detected_cycle;
    const detX = padL + detC * cycleW + cycleW / 2;
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
      x1: detX,
      y1: padT,
      x2: detX,
      y2: lowerT + lowerH,
      stroke: "#EF4444",
      strokeWidth: "2",
      strokeDasharray: "3 2"
    }), /*#__PURE__*/React.createElement("rect", {
      x: detX + 4,
      y: padT + 4,
      width: "110",
      height: "20",
      fill: "rgba(239, 68, 68, 0.9)",
      rx: "4"
    }), /*#__PURE__*/React.createElement("text", {
      x: detX + 10,
      y: padT + 18,
      fill: "#FFFFFF",
      fontSize: "10",
      fontWeight: "700"
    }, "LEAK CONFIRMED"));
  })())));
}

/* Hop Distance Utility */
function computeHopDistance(network, src, dst) {
  if (!network || !network.pipes) return 1;
  if (src === dst) return 0;
  const adj = {};
  network.pipes.forEach(p => {
    adj[p.from] = adj[p.from] || [];
    adj[p.to] = adj[p.to] || [];
    adj[p.from].push(p.to);
    adj[p.to].push(p.from);
  });
  const dist = {
    [src]: 0
  };
  const queue = [src];
  while (queue.length > 0) {
    const u = queue.shift();
    if (u === dst) return dist[u];
    for (const v of adj[u] || []) {
      if (dist[v] === undefined) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return 1;
}

// Render Root
const rootEl = document.getElementById("root");
if (rootEl) {
  if (ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(App, null));
  } else {
    ReactDOM.render(React.createElement(App, null), rootEl);
  }
}