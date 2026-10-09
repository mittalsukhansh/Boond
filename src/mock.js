// mock.js - fallback mock network and scenarios for zero-config offline execution
// Built-in network with 30 nodes, 8 cycles, and plausible pressure traces

export function generateMockNetwork() {
  const nodes = [];
  const pipes = [];
  const cols = 6;
  const rows = 5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c + 1;
      const id = 'J-' + idx;
      nodes.push({
        id,
        x: 100 + c * 130 + (r % 2 === 1 ? 25 : 0),
        y: 80 + r * 100,
        elevation: 40 - (r * 2 + c),
      });
    }
  }

  let pId = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const current = r * cols + c;
      // East neighbor
      if (c + 1 < cols) {
        pipes.push({
          id: 'P-' + pId++,
          from: nodes[current].id,
          to: nodes[current + 1].id,
        });
      }
      // South neighbor
      if (r + 1 < rows) {
        pipes.push({
          id: 'P-' + pId++,
          from: nodes[current].id,
          to: nodes[current + cols].id,
        });
      }
    }
  }

  const sensorList20 = [
    'J-1', 'J-4', 'J-6', 'J-8', 'J-11',
    'J-12', 'J-14', 'J-17', 'J-19', 'J-20',
    'J-22', 'J-23', 'J-25', 'J-27', 'J-28',
    'J-2', 'J-9', 'J-15', 'J-24', 'J-30'
  ];

  return {
    nodes,
    pipes,
    sensor_sets: {
      '5': sensorList20.slice(0, 5),
      '10': sensorList20.slice(0, 10),
      '20': sensorList20.slice(0, 20),
    },
    supply_windows: [[6, 9], [18, 21]],
  };
}

export function generateMockScenarios(network) {
  const sizes = [
    { label: 'small', pct: 4.0 },
    { label: 'medium', pct: 7.5 },
    { label: 'large', pct: 12.0 },
  ];

  const leakNodes = ['J-12', 'J-14', 'J-20', 'J-8', 'J-22'];
  const scenarios = [];

  for (const leakNode of leakNodes) {
    for (const size of sizes) {
      const id = leakNode + '_' + size.label;
      const startCycle = 3;
      const cycles = [];

      for (let c = 0; c < 8; c++) {
        const isLeaking = c >= startCycle;
        const pressures = {};
        for (const sNode of network.sensor_sets['20']) {
          const base = 28.0 + (sNode.charCodeAt(2) % 6);
          const demand = 0.95 + 0.1 * Math.sin(c * 1.7);
          const drop = isLeaking ? (size.pct / 100) * 12.0 : 0.0;
          pressures[sNode] = Number((base * demand - drop).toFixed(2));
        }
        cycles.push({
          cycle: c,
          pressures,
          demand_factor: Number((0.95 + 0.1 * Math.sin(c * 1.7)).toFixed(2)),
        });
      }

      // Generate results for 5, 10, 20 sensors
      const results = {};
      const sensorCounts = [5, 10, 20];

      for (const count of sensorCounts) {
        const countKey = String(count);
        const threshold = 1.1;
        const d_series = [];
        let detected_cycle = null;

        for (let c = 0; c < 8; c++) {
          if (c < startCycle) {
            d_series.push(Number((0.35 + 0.25 * Math.cos(c * 0.8)).toFixed(3)));
          } else {
            // Signal strength depends on sensor density and size
            const multiplier = count === 20 ? 1.0 : (count === 10 ? 0.75 : 0.45);
            const val = 0.6 + (c - startCycle + 1) * 0.8 * multiplier * (size.pct / 7.5);
            const d = Number(val.toFixed(3));
            d_series.push(d);
            if (d >= threshold && detected_cycle === null) {
              detected_cycle = c;
            }
          }
        }

        const top_k = [
          { node: leakNode, score: Number((count === 20 ? 0.94 : (count === 10 ? 0.81 : 0.62)).toFixed(2)) },
          { node: 'J-11', score: 0.65 },
          { node: 'J-13', score: 0.54 },
          { node: 'J-18', score: 0.42 },
          { node: 'J-7', score: 0.35 },
        ];

        results[countKey] = {
          d_series,
          threshold,
          detected_cycle,
          top_k,
          next_sensor: count < 20 ? 'J-15' : null,
        };
      }

      scenarios.push({
        id,
        leak_node: leakNode,
        size_label: size.label,
        size_pct_of_supply: size.pct,
        start_cycle: startCycle,
        n_cycles: 8,
        cycles,
        results,
      });
    }
  }

  return scenarios;
}
