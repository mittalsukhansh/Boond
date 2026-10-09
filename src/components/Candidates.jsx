// components/Candidates.jsx - ranked likely-leaking list + Reveal + next sensor
import React from 'react';
import { formatScore } from '../format.js';

export function Candidates({
  scenario,
  results,
  currentCycle,
  isRevealed,
  onToggleReveal,
  network,
}) {
  const detectedCycle = results?.detected_cycle;
  const isDetected = detectedCycle !== null && detectedCycle !== undefined && currentCycle >= detectedCycle;
  const topK = isDetected && results?.top_k ? results.top_k.slice(0, 5) : [];
  const nextSensor = results?.next_sensor;

  // Heatmap step token for a score between 0 and 1
  function getHeatStep(score) {
    if (score >= 0.8) return 'var(--heat-5)';
    if (score >= 0.6) return 'var(--heat-4)';
    if (score >= 0.4) return 'var(--heat-3)';
    if (score >= 0.2) return 'var(--heat-2)';
    return 'var(--heat-1)';
  }

  // Calculate junction hop distance between two nodes
  function computeHops(nodeA, nodeB) {
    if (!nodeA || !nodeB || !network) return 1;
    if (nodeA === nodeB) return 0;

    const queue = [[nodeA, 0]];
    const visited = new Set([nodeA]);

    while (queue.length > 0) {
      const [curr, dist] = queue.shift();
      if (curr === nodeB) return dist;

      // Find neighbors in network pipes
      for (const pipe of network.pipes) {
        let nbr = null;
        if (pipe.from === curr) nbr = pipe.to;
        else if (pipe.to === curr) nbr = pipe.from;

        if (nbr && !visited.has(nbr)) {
          visited.add(nbr);
          queue.push([nbr, dist + 1]);
        }
      }
    }
    return 2;
  }

  let verdict = '';
  let isVerdictAlarm = false;

  if (isRevealed && scenario) {
    if (!isDetected) {
      verdict = 'Not detected in 8 cycles.';
      isVerdictAlarm = true;
    } else if (topK.length > 0) {
      const topNode = topK[0].node;
      const trueNode = scenario.leak_node;
      if (topNode === trueNode) {
        verdict = 'Top candidate was correct.';
      } else {
        const hops = computeHops(topNode, trueNode);
        verdict = hops === 1
          ? 'Actual leak was 1 junction from the top candidate.'
          : `Actual leak was ${hops} junctions from the top candidate.`;
        isVerdictAlarm = true;
      }
    }
  }

  return (
    <section className="panel-section">
      <h2 className="section-heading">Most likely leaking</h2>

      {topK.length === 0 ? (
        <div className="sub-label">
          {scenario
            ? 'Heatmap appears when leak is detected.'
            : 'Select a pipe to begin detection analysis.'}
        </div>
      ) : (
        <div>
          {topK.map((item, idx) => (
            <div key={item.node} className="candidate-row">
              <div className="candidate-info">
                <span className="candidate-rank num">{idx + 1}</span>
                <span className="candidate-node">{item.node}</span>
              </div>
              <div className="candidate-score-wrap">
                <div
                  className="candidate-heat-swatch"
                  style={{ backgroundColor: getHeatStep(item.score) }}
                />
                <span className="candidate-score num">{formatScore(item.score)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {scenario && (
        <button
          type="button"
          className={`action-button ${isRevealed ? 'active' : ''}`}
          onClick={onToggleReveal}
        >
          {isRevealed ? 'Hide true location' : 'Reveal true location'}
        </button>
      )}

      {verdict && (
        <div className={`verdict-text ${isVerdictAlarm ? 'alarm' : ''}`}>
          {verdict}
        </div>
      )}

      {nextSensor && (
        <div className="next-sensor-notice">
          Suggested next sensor: <strong>{nextSensor}</strong>
        </div>
      )}
    </section>
  );
}
