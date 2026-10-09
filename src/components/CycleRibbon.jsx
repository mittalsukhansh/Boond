// components/CycleRibbon.jsx - signature 8-cycle intermittent supply strip chart
import React from 'react';
import { formatCycle } from '../format.js';

export function CycleRibbon({
  scenario,
  results,
  currentCycle,
  isPlaying,
  onPlay,
  onPause,
  onStep,
  isRevealed,
  selectedSensor,
}) {
  const padL = 72;
  const padR = 20;
  const totalW = 1000;
  const chartW = totalW - padL - padR;
  const cycleW = chartW / 8;

  // Upper section: Pressure traces
  const upperY = 18;
  const upperH = 100;

  // Lower section: Detection statistic
  const lowerY = 152;
  const lowerH = 48;

  const detectedCycle = results?.detected_cycle;
  const isDetected = detectedCycle !== null && detectedCycle !== undefined && currentCycle >= detectedCycle;
  const dSeries = results?.d_series || [];
  const threshold = results?.threshold || 1.1;

  // Sensor traces from scenario cycles
  const cyclesData = scenario?.cycles || [];

  return (
    <div className="ribbon-pane">
      <div className="ribbon-bar">
        <span className="sub-label">
          Supply cycles (intermittent windows 06:00–09:00, 18:00–21:00)
        </span>
        <div className="ribbon-controls">
          <button
            type="button"
            className="ribbon-btn"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="ribbon-btn"
            onClick={onStep}
          >
            Step
          </button>
          <span className="cycle-step-badge num">
            {formatCycle(currentCycle, 8)}
          </span>
        </div>
      </div>

      <div className="ribbon-canvas-wrap">
        <svg
          viewBox="0 0 1000 220"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* Axis Labels Left */}
          <text
            x={padL - 8}
            y={upperY + 12}
            fill="var(--cast-iron)"
            fontSize="14"
            textAnchor="end"
            fontFamily="inherit"
          >
            35 m
          </text>
          <text
            x={padL - 8}
            y={upperY + upperH / 2 + 5}
            fill="var(--cast-iron)"
            fontSize="14"
            textAnchor="end"
            fontFamily="inherit"
          >
            25 m
          </text>
          <text
            x={padL - 8}
            y={upperY + upperH}
            fill="var(--cast-iron)"
            fontSize="14"
            textAnchor="end"
            fontFamily="inherit"
          >
            15 m
          </text>

          <text
            x={padL - 8}
            y={lowerY + 14}
            fill="var(--cast-iron)"
            fontSize="14"
            textAnchor="end"
            fontFamily="inherit"
          >
            Test d
          </text>

          {/* 8 Cycle columns */}
          {Array.from({ length: 8 }).map((_, c) => {
            const colX = padL + c * cycleW;
            const isPastOrCurrent = c <= currentCycle;

            // Two daily supply windows: 06-09 (window 1) and 18-21 (window 2)
            const w1X = colX + (6 / 24) * cycleW;
            const w1W = (3 / 24) * cycleW;
            const w2X = colX + (18 / 24) * cycleW;
            const w2W = (3 / 24) * cycleW;

            return (
              <g key={'cycle-col-' + c}>
                {/* Column dividing line */}
                <line
                  x1={colX}
                  y1={upperY}
                  x2={colX}
                  y2={lowerY + lowerH}
                  stroke="var(--concrete)"
                  strokeWidth="1"
                />

                {/* Shaded bands for daily supply windows */}
                <rect
                  x={w1X}
                  y={upperY}
                  width={w1W}
                  height={upperH}
                  fill="var(--concrete)"
                />
                <rect
                  x={w2X}
                  y={upperY}
                  width={w2W}
                  height={upperH}
                  fill="var(--concrete)"
                />

                {/* Dashed band behind traces for +-10% demand swing */}
                <line
                  x1={colX}
                  y1={upperY + 28}
                  x2={colX + cycleW}
                  y2={upperY + 28}
                  stroke="var(--cast-iron)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={colX}
                  y1={upperY + 48}
                  x2={colX + cycleW}
                  y2={upperY + 48}
                  stroke="var(--cast-iron)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Cycle label */}
                <text
                  x={colX + cycleW / 2}
                  y={upperY + upperH + 16}
                  fill={c === currentCycle ? 'var(--ink)' : 'var(--cast-iron)'}
                  fontSize="14"
                  fontWeight={c === currentCycle ? '600' : '400'}
                  textAnchor="middle"
                  className="num"
                >
                  {'Day ' + (c + 1)}
                </text>

                {/* Active cycle highlight column border */}
                {c === currentCycle && (
                  <rect
                    x={colX}
                    y={upperY}
                    width={cycleW}
                    height={upperH + lowerH + 20}
                    fill="none"
                    stroke="var(--verdigris)"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* Right boundary line */}
          <line
            x1={padL + 8 * cycleW}
            y1={upperY}
            x2={padL + 8 * cycleW}
            y2={lowerY + lowerH}
            stroke="var(--concrete)"
            strokeWidth="1"
          />

          {/* Pressure traces across elapsed cycles */}
          {cyclesData.length > 0 && (() => {
            const lines = [];
            // Get available sensors
            const sensors = Object.keys(cyclesData[0].pressures || {});

            sensors.forEach((sId) => {
              const isSelected = sId === selectedSensor;
              const points = [];

              for (let c = 0; c <= currentCycle && c < cyclesData.length; c++) {
                const pVal = cyclesData[c].pressures[sId] || 25;
                // Map pressure 15m..35m to upperY + upperH .. upperY
                const normY = upperY + upperH - ((pVal - 15) / 20) * upperH;
                const ptX = padL + c * cycleW + cycleW / 2;
                points.push(`${ptX},${normY}`);
              }

              if (points.length > 1) {
                lines.push(
                  <polyline
                    key={'trace-' + sId}
                    points={points.join(' ')}
                    fill="none"
                    stroke={isSelected ? 'var(--ink)' : 'var(--cast-iron)'}
                    strokeWidth={isSelected ? '2.5' : '1'}
                  />
                );
              }
            });

            return lines;
          })()}

          {/* Dividing line above detection strip */}
          <line
            x1={padL}
            y1={lowerY - 14}
            x2={totalW - padR}
            y2={lowerY - 14}
            stroke="var(--concrete)"
            strokeWidth="1"
          />

          {/* Horizontal threshold line */}
          {(() => {
            // Map d threshold (e.g. 1.1) to lower strip (range 0..5)
            const threshY = lowerY + lowerH - (threshold / 5) * lowerH;
            return (
              <g>
                <line
                  x1={padL}
                  y1={threshY}
                  x2={totalW - padR}
                  y2={threshY}
                  stroke="var(--brass)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <text
                  x={totalW - padR}
                  y={threshY - 4}
                  fill="var(--brass)"
                  fontSize="14"
                  fontWeight="500"
                  textAnchor="end"
                  className="num"
                >
                  Threshold 1.10
                </text>
              </g>
            );
          })()}

          {/* Test statistic d trajectory */}
          {dSeries.length > 0 && (() => {
            const points = [];
            for (let c = 0; c <= currentCycle && c < dSeries.length; c++) {
              const dVal = dSeries[c];
              const ptX = padL + c * cycleW + cycleW / 2;
              const ptY = lowerY + lowerH - (Math.min(5, Math.max(0, dVal)) / 5) * lowerH;
              points.push(`${ptX},${ptY}`);
            }

            return (
              <g>
                {points.length > 1 && (
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2"
                  />
                )}
                {points.map((pt, idx) => {
                  const [px, py] = pt.split(',');
                  return (
                    <circle
                      key={'stat-pt-' + idx}
                      cx={px}
                      cy={py}
                      r="3"
                      fill="var(--ink)"
                    />
                  );
                })}
              </g>
            );
          })()}

          {/* Oxide vertical detection drop marker */}
          {isDetected && (() => {
            const detX = padL + detectedCycle * cycleW + cycleW / 2;
            const diff = Math.max(1, detectedCycle - (scenario?.start_cycle || 0));

            return (
              <g>
                <line
                  x1={detX}
                  y1={upperY}
                  x2={detX}
                  y2={lowerY + lowerH}
                  stroke="var(--oxide)"
                  strokeWidth="2"
                />
                <rect
                  x={detX - 60}
                  y={upperY - 4}
                  width="120"
                  height="22"
                  fill="var(--sand)"
                  stroke="var(--oxide)"
                  strokeWidth="1"
                />
                <text
                  x={detX}
                  y={upperY + 12}
                  fill="var(--oxide)"
                  fontSize="14"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {`Leak detected (+${diff})`}
                </text>
              </g>
            );
          })()}

          {/* Leak starts tick on axis (only after Reveal) */}
          {isRevealed && scenario && (() => {
            const startX = padL + scenario.start_cycle * cycleW + cycleW / 2;

            return (
              <g>
                <line
                  x1={startX}
                  y1={upperY + upperH}
                  x2={startX}
                  y2={upperY + upperH + 8}
                  stroke="var(--oxide)"
                  strokeWidth="2"
                />
                <text
                  x={startX}
                  y={upperY + upperH + 28}
                  fill="var(--oxide)"
                  fontSize="14"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Leak starts
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
