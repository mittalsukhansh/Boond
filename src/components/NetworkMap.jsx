// components/NetworkMap.jsx - hand-written SVG map with pipes, junctions, sensors, and heatmap
import React, { useState, useMemo } from 'react';
import { HeatLegend } from './HeatLegend.jsx';

export function NetworkMap({
  network,
  selectedPipe,
  selectedNode,
  onSelectPipe,
  onSelectNode,
  sensorCount,
  results,
  currentCycle,
  isRevealed,
  trueLeakNode,
}) {
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  const nodeMap = useMemo(() => {
    if (!network || !network.nodes) return {};
    const map = {};
    for (const n of network.nodes) {
      map[n.id] = n;
    }
    return map;
  }, [network]);

  const activeSensors = useMemo(() => {
    if (!network || !network.sensor_sets) return new Set();
    const list = network.sensor_sets[String(sensorCount)] || [];
    return new Set(list);
  }, [network, sensorCount]);

  const detectedCycle = results?.detected_cycle;
  const isDetected = detectedCycle !== null && detectedCycle !== undefined && currentCycle >= detectedCycle;
  const topK = isDetected && results?.top_k ? results.top_k : [];

  const candidateScoreMap = useMemo(() => {
    const map = {};
    for (const c of topK) {
      map[c.node] = c.score;
    }
    return map;
  }, [topK]);

  function getHeatToken(score) {
    if (score >= 0.8) return 'var(--heat-5)';
    if (score >= 0.6) return 'var(--heat-4)';
    if (score >= 0.4) return 'var(--heat-3)';
    if (score >= 0.2) return 'var(--heat-2)';
    return 'var(--heat-1)';
  }

  const nextSensor = isDetected && results?.next_sensor ? results.next_sensor : null;

  return (
    <div className="map-pane">
      <div className="map-toolbar">
        <span className="map-hint">Click a pipe or junction to inject leak</span>
      </div>

      <svg
        className="map-canvas"
        viewBox="0 0 1000 620"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Network Pipes */}
        {network && network.pipes && network.pipes.map((pipe) => {
          const fromNode = nodeMap[pipe.from];
          const toNode = nodeMap[pipe.to];
          if (!fromNode || !toNode) return null;

          const isSelected = selectedPipe === pipe.id;

          return (
            <line
              key={pipe.id}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={isSelected ? 'var(--ink)' : 'var(--cast-iron)'}
              strokeWidth={isSelected ? '4' : '2'}
              strokeLinecap="round"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectPipe(pipe)}
            />
          );
        })}

        {/* Heatmap circles on detected candidate nodes */}
        {topK.map((c) => {
          const pos = nodeMap[c.node];
          if (!pos) return null;
          const radius = 8 + c.score * 12;

          return (
            <circle
              key={'heat-' + c.node}
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill={getHeatToken(c.score)}
              stroke="var(--ink)"
              strokeWidth="1"
            />
          );
        })}

        {/* Junctions: 5px filled squares in var(--cast-iron) */}
        {network && network.nodes && network.nodes.map((node) => {
          const isSensor = activeSensors.has(node.id);
          const score = candidateScoreMap[node.id];

          return (
            <g
              key={node.id}
              tabIndex={0}
              role="button"
              aria-label={`Junction ${node.id}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectNode(node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectNode(node.id);
                }
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  show: true,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  content: score !== undefined
                    ? `${node.id}: score ${score.toFixed(2)}`
                    : `${node.id}: ${node.elevation}\u2009m`,
                });
              }}
              onMouseLeave={() => setTooltip({ show: false, x: 0, y: 0, content: '' })}
            >
              {/* If not a sensor, draw standard junction square */}
              {!isSensor && (
                <rect
                  x={node.x - 2.5}
                  y={node.y - 2.5}
                  width="5"
                  height="5"
                  fill="var(--cast-iron)"
                />
              )}

              {/* If active sensor, draw brass ring-and-dot larger than junction */}
              {isSensor && (
                <g>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="8"
                    fill="none"
                    stroke="var(--brass)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="2.5"
                    fill="var(--brass)"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* Suggested next sensor (if present in results) */}
        {nextSensor && nodeMap[nextSensor] && (
          <g>
            <circle
              cx={nodeMap[nextSensor].x}
              cy={nodeMap[nextSensor].y}
              r="14"
              fill="none"
              stroke="var(--brass)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <text
              x={nodeMap[nextSensor].x}
              y={nodeMap[nextSensor].y + 24}
              fill="var(--brass)"
              fontSize="14"
              fontWeight="500"
              textAnchor="middle"
            >
              Suggested next sensor
            </text>
          </g>
        )}

        {/* True leak marker (revealed only) */}
        {isRevealed && trueLeakNode && nodeMap[trueLeakNode] && (
          <g>
            <circle
              cx={nodeMap[trueLeakNode].x}
              cy={nodeMap[trueLeakNode].y}
              r="15"
              fill="none"
              stroke="var(--oxide)"
              strokeWidth="3"
            />
            <text
              x={nodeMap[trueLeakNode].x}
              y={nodeMap[trueLeakNode].y - 20}
              fill="var(--oxide)"
              fontSize="14"
              fontWeight="600"
              textAnchor="middle"
            >
              Actual leak
            </text>
          </g>
        )}
      </svg>

      {/* Fixed heat legend */}
      <HeatLegend />

      {/* Plain tooltip */}
      {tooltip.show && (
        <div
          className="map-tooltip num"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
