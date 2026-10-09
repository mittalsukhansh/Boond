// components/HeatLegend.jsx - 5-step flat heatmap legend
import React from 'react';

export function HeatLegend() {
  const steps = [
    { varName: 'var(--heat-1)' },
    { varName: 'var(--heat-2)' },
    { varName: 'var(--heat-3)' },
    { varName: 'var(--heat-4)' },
    { varName: 'var(--heat-5)' },
  ];

  return (
    <div className="heat-legend-box" aria-label="Heatmap legend">
      <div className="legend-title">Likelihood</div>
      <div className="legend-steps">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="legend-step-swatch"
            style={{ backgroundColor: step.varName }}
          />
        ))}
      </div>
      <div className="legend-labels">
        <span>Less likely</span>
        <span>More likely</span>
      </div>
    </div>
  );
}
