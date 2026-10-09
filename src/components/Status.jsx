// components/Status.jsx - plain-language detection status
import React from 'react';

export function Status({ scenario, results, currentCycle }) {
  if (!scenario) {
    return (
      <section className="panel-section">
        <h2 className="section-heading">Status</h2>
        <div className="status-box">
          Click a pipe on the map to start a leak.
        </div>
      </section>
    );
  }

  const detectedCycle = results?.detected_cycle;
  const isDetected = detectedCycle !== null && detectedCycle !== undefined && currentCycle >= detectedCycle;
  const isFinished = currentCycle >= 7;

  let message = 'No leak detected';
  let isAlarm = false;

  if (isDetected) {
    isAlarm = true;
    const diff = Math.max(1, detectedCycle - scenario.start_cycle);
    message = diff === 1
      ? 'Leak detected 1 cycle after it started'
      : `Leak detected ${diff} cycles after it started`;
  } else if (isFinished) {
    message = 'Not detected in 8 cycles. Try a larger leak or more sensors.';
  }

  return (
    <section className="panel-section">
      <h2 className="section-heading">Status</h2>
      <div className={`status-box ${isAlarm ? 'alarm' : ''}`}>
        {message}
      </div>
    </section>
  );
}
