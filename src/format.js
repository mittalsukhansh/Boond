// format.js - metres, cycles, hour labels
// Values with units and a thin space: 23.4 m

export function formatMetres(val) {
  if (val === null || val === undefined || isNaN(val)) return '—\u2009m';
  return Number(val).toFixed(1) + '\u2009m';
}

export function formatCycle(cycleIndex, total = 8) {
  if (cycleIndex === null || cycleIndex === undefined) return 'Cycle —';
  return 'Cycle ' + (cycleIndex + 1) + ' of ' + total;
}

export function formatHour(hour) {
  const pad = String(hour).padStart(2, '0');
  return pad + ':00';
}

export function formatScore(score) {
  if (score === null || score === undefined || isNaN(score)) return '—';
  return Number(score).toFixed(2);
}
